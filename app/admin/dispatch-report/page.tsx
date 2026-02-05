import React from 'react';
import { getSettlementData, saveReport } from './server-action';
import { FileText, Calendar, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import ExcelDownloadButton from './DownloadButton';

export default async function DispatchReportPage({
    searchParams
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const params = await searchParams;
    const selectedDate = params.date || new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: reports, error } = await getSettlementData(selectedDate);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" /> 용차 정산 리포트
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        날짜별 용차 배송 실적을 집계하고 비용을 확정합니다.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <Calendar className="h-4 w-4 text-slate-400 ml-2" />
                    <form className="flex items-center gap-2">
                        <input
                            type="date"
                            name="date"
                            defaultValue={selectedDate}
                            className="text-sm font-bold text-slate-700 outline-none border-none focus:ring-0"
                            onBlur={(e) => e.target.form?.requestSubmit()}
                        />
                        <button type="submit" className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors">
                            조회
                        </button>
                    </form>
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm italic">
                    {error}
                </div>
            )}

            {!reports || reports.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200 shadow-inner">
                    <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">정산할 용차 데이터가 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-2">해당 날짜에 '용차' 타입으로 배차된 내역이 있는지 확인해 주세요.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                        <th className="px-6 py-4 text-left">기사명</th>
                                        <th className="px-4 py-4">집계 박스</th>
                                        <th className="px-4 py-4">확정 박스</th>
                                        <th className="px-4 py-4">반품 여부</th>
                                        <th className="px-4 py-4">기본 단가</th>
                                        <th className="px-4 py-4 text-blue-600">최종 금액</th>
                                        <th className="px-6 py-4">비고</th>
                                        <th className="px-6 py-4 text-right">상태/실행</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {reports.map((r) => (
                                        <tr key={r.driverId} className={`hover:bg-slate-50/50 transition-colors ${r.isSaved ? 'bg-blue-50/20' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-800">{r.driverName}</div>
                                                <div className="text-[10px] text-slate-400 font-mono italic">{r.driverId}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-slate-400">
                                                {r.calculatedBox}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <form action={async (formData) => {
                                                    'use server';
                                                    const box = parseInt(formData.get('boxCount') as string);
                                                    const price = parseInt(formData.get('price') as string);
                                                    const isRet = formData.get('isReturn') === 'true';
                                                    const rem = formData.get('remarks') as string;
                                                    await saveReport({
                                                        date: selectedDate,
                                                        driverName: r.driverId,
                                                        boxCount: box,
                                                        isReturn: isRet,
                                                        price: price,
                                                        remarks: rem
                                                    });
                                                }} className="flex items-center justify-center gap-2" id={`form-${r.driverId}`}>
                                                    <input
                                                        type="number"
                                                        name="boxCount"
                                                        defaultValue={r.savedBox !== undefined ? r.savedBox : r.calculatedBox}
                                                        className="w-16 h-8 text-center bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                                                    />
                                                    <input type="hidden" name="isReturn" value={String(r.isReturn)} id={`ret-${r.driverId}`} />
                                                    <input type="hidden" name="remarks" value={r.remarks} id={`rem-${r.driverId}`} />
                                                    <input type="hidden" name="price" value={r.finalPrice} id={`prc-${r.driverId}`} />
                                                </form>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const el = document.getElementById(`ret-${r.driverId}`) as HTMLInputElement;
                                                        el.value = el.value === 'true' ? 'false' : 'true';
                                                        // Toggle UI manually or just submit
                                                        (document.getElementById(`form-${r.driverId}`) as HTMLFormElement).requestSubmit();
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${r.isReturn ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-slate-100 text-slate-400'
                                                        }`}
                                                >
                                                    {r.isReturn ? 'Return' : 'None'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-center text-slate-400 font-medium">
                                                ₩{r.basePrice.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="number"
                                                    name="price_input"
                                                    defaultValue={r.finalPrice}
                                                    onChange={(e) => {
                                                        const el = document.getElementById(`prc-${r.driverId}`) as HTMLInputElement;
                                                        el.value = e.target.value;
                                                    }}
                                                    onBlur={() => (document.getElementById(`form-${r.driverId}`) as HTMLFormElement).requestSubmit()}
                                                    className="w-24 h-8 text-center bg-blue-50 text-blue-700 border border-blue-100 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    name="remarks_input"
                                                    defaultValue={r.remarks}
                                                    placeholder="참고 사항..."
                                                    onChange={(e) => {
                                                        const el = document.getElementById(`rem-${r.driverId}`) as HTMLInputElement;
                                                        el.value = e.target.value;
                                                    }}
                                                    onBlur={() => (document.getElementById(`form-${r.driverId}`) as HTMLFormElement).requestSubmit()}
                                                    className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {r.isSaved ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => (document.getElementById(`form-${r.driverId}`) as HTMLFormElement).requestSubmit()}
                                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                                        >
                                                            저장
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <ExcelDownloadButton date={selectedDate} />
                    </div>
                </div>
            )}
        </div>
    );
}
