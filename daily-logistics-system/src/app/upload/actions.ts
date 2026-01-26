'use server';

import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { revalidatePath } from 'next/cache';

// Define the shape of mapped data
export interface ParsedOrder {
    date: string;       // B_DATE
    customerName: string; // B_C_NAME
    productName: string;  // B_P_NAME
    qty: number;        // B_QTY
    weight: number;     // B_KG
    // Enriched Data
    deliveryPointId?: number | null; // CB_IDX
    driverName?: string | null;      // CB_DRIVER
    status: 'READY' | 'MISSING_MASTER';
}

export async function uploadOrders(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, message: 'No file uploaded' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // 1. Fetch Master Data (All Delivery Points) for matching
        // Optimization: Fetch only needed columns
        const deliveryPoints = await prisma.deliveryPoint.findMany({
            select: {
                id: true,
                name: true,  // Match target
                defaultDriver: true, // Enrichment target
            }
        });

        // Create a Lookup Map for O(1) matching
        // Normalize names (trim, spaces) for better matching
        const dpMap = new Map();
        deliveryPoints.forEach(dp => {
            if (dp.name) {
                dpMap.set(dp.name.trim(), dp);
            }
        });

        const toInsert = [];
        let matchCount = 0;

        // 2. Process Rows
        for (const row of jsonData as any[]) {
            // Map Excel Columns (Assuming standard headers or aggressive guessing)
            // Adjust these keys based on User's actual Excel headers
            const date = row['일자'] || row['Date'] || new Date().toISOString().split('T')[0];
            const customerName = row['거래처명'] || row['현장명'] || row['Customer'] || '';
            const productName = row['품명'] || row['Product'] || '';
            const qty = parseInt(row['수량'] || row['Qty'] || '0');
            const weight = parseFloat(row['중량'] || row['Weight'] || '0');

            // 3. The "Magic": Auto-Matching
            const match = dpMap.get(customerName.trim());

            const orderData: any = {
                date: String(date),
                customerName: customerName,
                productName: productName,
                qty: qty,
                weight: weight,
                // Enriched:
                deliveryPointId: match ? match.id : null,
                driverName: match ? match.defaultDriver : null,
            };

            if (match) matchCount++;

            toInsert.push(orderData);
        }

        // 4. Batch Insert
        if (toInsert.length > 0) {
            await prisma.order.createMany({
                data: toInsert.map(item => ({
                    date: item.date,
                    customerName: item.customerName,
                    productName: item.productName,
                    qty: item.qty,
                    weight: item.weight,
                    deliveryPointId: item.deliveryPointId,
                    driverName: item.driverName,

                    // Default fields
                    outQty: 0,
                }))
            });
        }

        revalidatePath('/upload');
        return {
            success: true,
            count: toInsert.length,
            matched: matchCount,
            message: `${toInsert.length} Orders Uploaded. (${matchCount} Auto-Matched)`
        };

    } catch (error) {
        console.error(error);
        return { success: false, message: 'Upload Failed: ' + String(error) };
    }
}
