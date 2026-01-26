'use server';

import { PrismaClient } from '@prisma/client';
import iconv from 'iconv-lite';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

function fromLegacy(str: string | null | undefined): string {
  if (!str) return '';
  try { return iconv.decode(Buffer.from(str, 'binary'), 'euc-kr'); } catch (e) { return str || ''; }
}

function toLegacy(str: string): string {
  try { return iconv.encode(str, 'euc-kr').toString('binary'); } catch (e) { return str; }
}

export interface DispatchGroup {
  groupKey: string;
  deliveryPointId: number;
  customerCode: string;
  customerName: string;
  driverName: string;
  driverPhone: string;
  vehicleNo: string;
  dockNo: string;
  address: string;
  items: {
    id: number;
    productCode: string;
    productName: string;
    qty: number;        // 원주문
    outQty: number;     // 납품
    missingQty: number; // 결품 (t_missout)
    weight: string;
    unit: string;
  }[];
}

import { getSession } from '../../../lib/auth';

export async function getRealDispatchData(searchTerm: string, dateStr?: string): Promise<{ data: DispatchGroup[], totalCount: number, error?: string }> {
  const session = await getSession();
  if (!session) {
    // Should be handled by middleware, but double check
    return { data: [], totalCount: 0 };
  }

  let targetDateStr = dateStr;

  if (!targetDateStr) {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstGap = 9 * 60 * 60 * 1000;
    const todayKST = new Date(utc + kstGap);
    const y = todayKST.getFullYear();
    const m = String(todayKST.getMonth() + 1).padStart(2, '0');
    const d = String(todayKST.getDate()).padStart(2, '0');
    targetDateStr = `${y}-${m}-${d}`;
  }

  try {
    const whereCondition: any = {
      date: targetDateStr,
    };

    // [New] Filter by Company if not admin
    if (session.companyName) {
      // User clarified: t_balju.c_name holds the company data (e.g. '하회', '대상')
      // Map session.companyName to this column.
      const legacyCompanyName = toLegacy(session.companyName);

      // Filter by the specific company column
      whereCondition.companyNameInTable = { contains: legacyCompanyName };
    }

    if (searchTerm && searchTerm.trim().length > 0) {
      const legacySearch = toLegacy(searchTerm);

      // Combine with existing company filter if present
      // whereCondition is already an object. We want (Company Filter) AND (Search Filter)
      // Prisma implicit AND is top level.
      whereCondition.OR = [
        { customerName: { contains: legacySearch } },
        { customerCode: { contains: legacySearch } }
      ];
    }

    // 1. Get Total Count (before slicing)
    // We can't easily get the "group count" without fetching all or doing complex raw SQL group by count.
    // However, the user said "List Status shows entire transaction count in date".
    // Is it "Order Count" or "Dispatch Count"?
    // "List Status 엔 날짜에 있는 전체 거래처수로" -> "Total number of customers (dispatches) in that date".
    // Fetching ALL is heavy if we just want count?
    // But we need to group them to count them.
    // Given the previous performance ("hundreds"), fetching all columns for all rows might be heavy.
    // Let's optimize: Fetch only necessary columns for grouping first?
    // Actually, `findMany` with the `whereCondition` is what we need.
    // For now, let's keep fetching all because we need them for the slice anyway.
    // 500 rows is fine for Node.js.

    const rawOrders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        deliveryPoint: true,
        vehicle: true,
        missouts: true,
      },
      orderBy: { id: 'asc' }
    });

    const groupedMap = new Map<string, DispatchGroup>();

    for (const order of rawOrders) {
      const dpId = order.deliveryPointId || -1;
      const cName = fromLegacy(order.customerName) || '알 수 없는 납품처';

      // [수정] 기사명 표시 로직 변경
      // CB_DRIVER는 코드로 사용하고, 실제 화면 표시는 CA_NAME(realDriverName)을 사용
      let drvName = fromLegacy(order.vehicle?.realDriverName);
      if (!drvName || drvName.trim() === '') {
        // CA_NAME이 없으면 기존 CB_DRIVER 사용
        drvName = fromLegacy(order.driverName) || '미지정';
      }

      const drvPhone = fromLegacy(order.vehicle?.driverPhone) || '';
      const vNo = fromLegacy(order.vehicle?.vehicleNo) || '';
      const dNo = fromLegacy(order.vehicle?.dockNo) || '';
      const cCode = fromLegacy(order.customerCode) || fromLegacy(order.deliveryPoint?.routingBind) || 'N/A';
      const drvAddress = fromLegacy(order.deliveryPoint?.address) || '';

      const groupKey = `${dpId}_${cName}`;

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          groupKey: groupKey,
          deliveryPointId: dpId,
          customerCode: cCode,
          customerName: cName,
          driverName: drvName,
          driverPhone: drvPhone,
          vehicleNo: vNo,
          dockNo: dNo,
          address: drvAddress,
          items: []
        });
      }

      const pCode = fromLegacy(order.productCode) || '-';
      const pName = fromLegacy(order.productName) || '제품명 없음';
      const weight = order.weight ? Number(order.weight).toString() : '0';
      const qty = order.qty || 0;
      const missingQty = order.missouts?.reduce((sum, m) => sum + (m.qty || 0), 0) || 0;
      const outQty = Math.max(0, qty - missingQty);

      groupedMap.get(groupKey)?.items.push({
        id: order.id,
        productCode: pCode,
        productName: pName,
        qty: qty,
        outQty: outQty,
        missingQty: missingQty,
        weight: weight,
        unit: 'EA'
      });
    }

    const result = Array.from(groupedMap.values());
    result.sort((a, b) => a.customerName.localeCompare(b.customerName));

    const totalCount = result.length;

    // [New] User Request: "Initial screen showing about 10 items is fine"
    // If no search term is active, limit to 10 items for performance/UX.
    // If searching, show all matches.
    let finalResult = result;
    if (!searchTerm || searchTerm.trim() === '') {
      finalResult = result.slice(0, 10);
    }

    return {
      data: finalResult,
      totalCount: totalCount
    };

  } catch (error: any) {
    console.error("[Error] DB 조회 오류:", error);
    // [Diagnostic Update] Return error to client
    return {
      data: [],
      totalCount: 0,
      error: error.message || String(error)
    };
  }
}

import { logout } from '../../../lib/auth';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  await logout();
  redirect('/login');
}