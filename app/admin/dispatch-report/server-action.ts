'use server';

import { authDb, logisticsDb } from '../../../lib/db';
import { revalidatePath } from 'next/cache';
import iconv from 'iconv-lite';

function fromLegacy(str: string | null | undefined): string {
    if (!str) return '';
    try { return iconv.decode(Buffer.from(str, 'binary'), 'euc-kr'); } catch (e) { return str || ''; }
}

function toLegacy(str: string): string {
    try { return iconv.encode(str, 'euc-kr').toString('binary'); } catch (e) { return str; }
}

export async function getSettlementData(dateStr: string) {
    try {
        // 1. 해당 날짜의 배차 완료된 기사 목록 및 박스 수 계산
        // t_balju 조인 t_product (입수량 정보 필요)
        const orders = await logisticsDb.order.findMany({
            where: { date: dateStr },
            select: {
                driverName: true,
                outQty: true,
                productCode: true,
            }
        });

        // 제품별 입수량(IPSU) 가져오기
        // 제품별 입수량(IPSU) 가져오기
        const productCodes = Array.from(new Set(orders.map(o => o.productCode).filter(Boolean))) as string[];

        // npx prisma queryRaw를 사용
        let productInfos: any[] = [];
        if (productCodes.length > 0) {
            // Join strings with quotes for raw SQL
            const codesStr = productCodes.map(c => `'${c}'`).join(',');
            productInfos = await logisticsDb.$queryRawUnsafe(`
                SELECT P_CODE, P_IPSU FROM t_product WHERE P_CODE IN (${codesStr})
            `);
        }
        const ipsuMap = new Map(productInfos.map(p => [p.P_CODE, p.P_IPSU || 1]));

        // 기사별 박스 수 집계
        const driverStats = new Map<string, { boxCount: number }>();
        for (const order of orders) {
            const drvKey = order.driverName || '미지정';
            const ipsu = ipsuMap.get(order.productCode || '') || 1;
            const boxes = Math.ceil(order.outQty / ipsu);

            const stats = driverStats.get(drvKey) || { boxCount: 0 };
            stats.boxCount += boxes;
            driverStats.set(drvKey, stats);
        }

        // 2. 용차 기사 정보 및 설정된 단가 가져오기
        const outsourcedInfos = await authDb.vehicleInfo.findMany({
            where: { vehicleType: 'outsourced' }
        });
        const outsourcedKeys = outsourcedInfos.map(i => i.driverName);

        const rates = await authDb.vehicleRate.findMany({
            where: { driverName: { in: outsourcedKeys } }
        });
        const rateMap = new Map(rates.map(r => [r.driverName, r]));

        // 3. 이미 저장된 정산 리포트 데이터 가져오기
        const savedReports = await authDb.dispatchReport.findMany({
            where: { date: dateStr }
        });
        const reportMap = new Map(savedReports.map(r => [r.driverName, r]));

        // 4. 최종 데이터 조합
        const result = outsourcedInfos.map(info => {
            const stats = driverStats.get(info.driverName);
            const saved = reportMap.get(info.driverName);
            const rate = rateMap.get(info.driverName);

            return {
                driverId: info.driverName,
                driverName: fromLegacy(info.driverName),
                calculatedBox: stats?.boxCount || 0,
                savedBox: saved?.boxCount,
                isReturn: saved?.isReturn || false,
                basePrice: rate?.basePrice || 0,
                finalPrice: saved?.price || (rate?.basePrice || 0),
                remarks: saved?.remarks || '',
                isSaved: !!saved
            };
        });

        return { data: result };
    } catch (error: any) {
        console.error('getSettlementData error:', error);
        return { error: error.message };
    }
}

export async function saveReport(data: {
    date: string;
    driverName: string;
    boxCount: number;
    isReturn: boolean;
    price: number;
    remarks: string;
}) {
    try {
        await authDb.dispatchReport.upsert({
            where: {
                date_driverName: {
                    date: data.date,
                    driverName: data.driverName
                }
            },
            update: {
                boxCount: data.boxCount,
                isReturn: data.isReturn,
                price: data.price,
                remarks: data.remarks
            },
            create: {
                date: data.date,
                driverName: data.driverName,
                boxCount: data.boxCount,
                isReturn: data.isReturn,
                price: data.price,
                remarks: data.remarks
            }
        });
        revalidatePath('/admin/dispatch-report');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
