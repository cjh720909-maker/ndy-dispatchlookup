'use server';

import { authDb, logisticsDb } from '../../../lib/db';
import { revalidatePath } from 'next/cache';
import iconv from 'iconv-lite';

function fromLegacy(str: string | null | undefined): string {
    if (!str) return '';
    try { return iconv.decode(Buffer.from(str, 'binary'), 'euc-kr'); } catch (e) { return str || ''; }
}

export async function getVehicles() {
    try {
        // MySQL에서 전체 기사 목록 가져오기
        const rawVehicles = await logisticsDb.vehicle.findMany({
            orderBy: { driverName: 'asc' }
        });

        // Auth DB에서 추가 정보(타입 등) 가져오기
        const extraInfos = await authDb.vehicleInfo.findMany();
        const extraMap = new Map(extraInfos.map(info => [info.driverName, info]));

        const vehicles = rawVehicles.map(v => {
            const driverNameKST = fromLegacy(v.driverName);
            const extra = extraMap.get(v.driverName); // 매핑은 원본(legacy) 키로 수행

            return {
                driverId: v.driverName, // legacy key
                driverName: fromLegacy(v.realDriverName) || driverNameKST,
                vehicleNo: fromLegacy(v.vehicleNo),
                driverPhone: fromLegacy(v.driverPhone),
                type: extra?.vehicleType || 'fixed',
                memo: extra?.memo || ''
            };
        });

        return { data: vehicles };
    } catch (error: any) {
        console.error('getVehicles error:', error);
        return { error: error.message };
    }
}

export async function updateVehicleType(driverId: string, type: string) {
    try {
        await authDb.vehicleInfo.upsert({
            where: { driverName: driverId },
            update: { vehicleType: type },
            create: { driverName: driverId, vehicleType: type }
        });
        revalidatePath('/admin/vehicles');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateVehicleMemo(driverId: string, memo: string) {
    try {
        await authDb.vehicleInfo.upsert({
            where: { driverName: driverId },
            update: { memo: memo },
            create: { driverName: driverId, memo: memo }
        });
        revalidatePath('/admin/vehicles');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
