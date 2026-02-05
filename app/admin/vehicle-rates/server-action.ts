'use server';

import { authDb, logisticsDb } from '../../../lib/db';
import { revalidatePath } from 'next/cache';
import iconv from 'iconv-lite';

function fromLegacy(str: string | null | undefined): string {
    if (!str) return '';
    try { return iconv.decode(Buffer.from(str, 'binary'), 'euc-kr'); } catch (e) { return str || ''; }
}

export async function getVehicleRates() {
    try {
        // 용차(Outsourced)인 기사 목록만 필터링하거나, 전체 가져와서 단가 설정
        // 여기서는 용차 단가 설정을 위해 용차로 등록된 기사들 위주로 보여줌
        const outsourcedVehicles = await authDb.vehicleInfo.findMany({
            where: { vehicleType: 'outsourced' }
        });

        const rates = await authDb.vehicleRate.findMany();
        const rateMap = new Map(rates.map(r => [r.driverName, r]));

        const data = outsourcedVehicles.map(v => {
            const currentRate = rateMap.get(v.driverName);
            return {
                driverId: v.driverName,
                basePrice: currentRate?.basePrice || 0,
                description: currentRate?.description || ''
            };
        });

        return { data };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateRate(driverId: string, price: number, description: string) {
    try {
        await authDb.vehicleRate.upsert({
            where: { driverName: driverId },
            update: { basePrice: price, description: description },
            create: { driverName: driverId, basePrice: price, description: description }
        });
        revalidatePath('/admin/vehicle-rates');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
