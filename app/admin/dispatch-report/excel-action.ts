'use server';

import * as XLSX from 'xlsx';
import { getSettlementData } from './server-action';

export async function downloadExcelAction(dateStr: string) {
    const { data, error } = await getSettlementData(dateStr);
    if (error || !data) return { error: error || 'No data found' };

    // 엑셀 데이터 형식으로 변환
    const excelData = data.map(r => ({
        '날짜': dateStr,
        '기사ID': r.driverId,
        '기사명': r.driverName,
        '집계박스': r.calculatedBox,
        '확정박스': r.savedBox !== undefined ? r.savedBox : r.calculatedBox,
        '반품여부': r.isReturn ? 'Y' : 'N',
        '기본단가': r.basePrice,
        '최종금액': r.finalPrice,
        '비고': r.remarks,
        '상태': r.isSaved ? '확정' : '미확정'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '용차정산');

    // Buffer로 변환하여 리턴
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Server action에서 direct download는 어려우므로 base64로 보내거나 
    // 클라이언트 컴포넌트에서 처리하도록 유도해야 함.
    // 여기서는 간단하게 클라이언트에서 xlsx를 직접 쓰도록 바꾸는 게 나을 수도 있음.

    // 하지만 일단 데이터만 리턴하고 클라이언트에서 처리하는 방식으로 제안
    return {
        base64: buf.toString('base64'),
        filename: `용차정산리포트_${dateStr}.xlsx`
    };
}
