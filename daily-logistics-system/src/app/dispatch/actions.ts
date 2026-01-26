'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import iconv from 'iconv-lite';

export interface DispatchData {
    orders: any[];
    drivers: string[];
}

export async function getDispatchData(date: string) {
    // 1. Fetch Orders for the date
    const rawOrders = await prisma.order.findMany({
        where: {
            date: date,
        },
        include: {
            deliveryPoint: true,
            vehicle: true,
        },
        orderBy: {
            id: 'asc',
        }
    });

    // Encoding Helper: Latin1 -> EUC-KR -> UTF-8
    // Prisma often reads EUC-KR as Latin1 when DB encoding is not set to UTF8mb4
    const decode = (str: string | null) => {
        if (!str) return '';
        try {
            // Assuming existing data is EUC-KR stored but read as binary/latin1
            // We convert the string to buffer (binary) then decode as euc-kr
            return iconv.decode(Buffer.from(str, 'binary'), 'euc-kr');
        } catch (e) {
            return str;
        }
    };

    const orders = rawOrders.map(o => ({
        ...o,
        customerName: decode(o.customerName),
        productName: decode(o.productName),
        deliveryPoint: o.deliveryPoint ? {
            ...o.deliveryPoint,
            name: decode(o.deliveryPoint.name),
        } : null,
        driverName: decode(o.driverName),
        // vehicle info might also need decoding
        vehicle: o.vehicle ? {
            ...o.vehicle,
            vehicleNo: decode(o.vehicle.vehicleNo),
            dockNo: decode(o.vehicle.dockNo),
        } : null
    }));

    // 2. Fetch All Drivers for Dropdown
    const vehicles = await prisma.vehicle.findMany({
        select: {
            driverName: true,
            vehicleNo: true,
        },
        orderBy: {
            driverName: 'asc',
        }
    });

    const drivers = vehicles.map(v => decode(v.driverName)).filter(Boolean);

    return {
        orders,
        drivers: Array.from(new Set(drivers)), // Unique drivers
    };
}

export async function updateOrderDriver(orderId: number, driverName: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                driverName: driverName,
            }
        });
        revalidatePath('/dispatch');
        return { success: true };
    } catch (error) {
        console.error('Update failed:', error);
        return { success: false, message: 'Update failed' };
    }
}
