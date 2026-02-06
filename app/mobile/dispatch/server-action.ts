'use server';

import { logisticsDb as prisma } from '../../../lib/db';
import iconv from 'iconv-lite';

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

export async function getUserInfo() {
  const session = await getSession();
  return {
    username: session?.username || null,
    role: session?.role || null
  };
}

export async function getRealDispatchData(searchTerm: string, dateStr?: string): Promise<{ data: DispatchGroup[], totalCount: number, error?: string }> {
  const session = await getSession();
  if (!session) {
    // Should be handled by middleware, but double check
    return { data: [], totalCount: 0 };
  }

  let targetDateStr = dateStr;

  if (!targetDateStr) {
    const now = new Date();
    const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 60 * 60 * 1000));

    if (kstNow.getHours() >= 18) {
      kstNow.setDate(kstNow.getDate() + 1);
    }

    const y = kstNow.getFullYear();
    const m = String(kstNow.getMonth() + 1).padStart(2, '0');
    const d = String(kstNow.getDate()).padStart(2, '0');
    targetDateStr = `${y}-${m}-${d}`;
  }

  try {
    const whereCondition: any = {
      date: targetDateStr,
    };

    // 4단계 권한 체크
    const isAdmin = session.username === 'admin';
    const isNDY = session.role === 'staff' && (!session.companyName || session.companyName === 'NDY' || session.companyName === '관리자') && !isAdmin;
    const isCustomer = session.role === 'customer';
    const isLogistics = !isAdmin && !isNDY && !isCustomer && !!session.companyName;

    if (isLogistics) {
      // 운수회사(staff이면서 companyName이 있는 경우)는 결품조회 접근 불가
      return { data: [], totalCount: 0, error: '운수회사는 결품조회 권한이 없습니다.' };
    }

    if (isCustomer && session.companyName) {
      // 고객사는 본인 데이터만 조회
      const legacyCompanyName = toLegacy(session.companyName);
      whereCondition.customerName = { contains: legacyCompanyName };
    }
    // 관리자(isAdmin)와 NDY팀(isNDY)은 whereCondition에 회사 제한 없이 전체 조회 가능

    if (searchTerm && searchTerm.trim().length > 0) {
      const legacySearch = toLegacy(searchTerm);

      // Combine with existing company filter if present
      // whereCondition is already an object. We want (Company Filter) AND (Search Filter)
      // Prisma implicit AND is top level.
      whereCondition.OR = [
        { customerName: { contains: legacySearch } },
        { customerCode: { contains: legacySearch } },
        { driverName: { contains: legacySearch } },
        { vehicle: { realDriverName: { contains: legacySearch } } }
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
        missouts: true,
      },
      orderBy: { id: 'asc' }
    });

    const groupedMap = new Map<string, DispatchGroup>();

    for (const order of rawOrders) {
      const dpId = order.deliveryPointId || -1;
      const cName = fromLegacy(order.customerName) || '알 수 없는 납품처';

      // [최적화] 기사명 표시: 조인 없이 CB_DRIVER 직접 사용
      const drvName = fromLegacy(order.driverName) || '미지정';

      // [최적화] 연락처 및 주소: t_balju의 CB_HP, CB_PHONE, CB_ADDRESS 직접 사용
      const drvPhone = fromLegacy(order.hp) || fromLegacy(order.phone) || '';
      const vNo = ''; // 차량번호가 t_balju에 직접 노출되지 않는 경우 빈값 처리 (필요시 추후 필드 확인)
      const dNo = '';
      const cCode = fromLegacy(order.routingBind) || fromLegacy(order.customerCode) || 'N/A';
      const drvAddress = fromLegacy(order.address) || '';

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
      const missingQty = order.missouts?.reduce((sum: number, m: any) => sum + (m.qty || 0), 0) || 0;
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
      // [수정] 결품(missingQty > 0)이 발생한 거래처를 우선적으로 필터링
      const missingOnly = result.filter(group => group.items.some(it => it.missingQty > 0));

      // 결품된 거래처가 있으면 해당 리스트를 보여주고, 없으면 전체 중 상위 10개만 표시하여 빈 화면 방지
      if (missingOnly.length > 0) {
        finalResult = missingOnly;
      } else {
        finalResult = result.slice(0, 10);
      }
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