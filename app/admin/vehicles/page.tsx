import React from 'react';
import { getVehicles, updateVehicleType, updateVehicleMemo } from './server-action';
import { Truck, Search, Info } from 'lucide-react';

export default async function VehiclesPage() {
    const { data: vehicles, error } = await getVehicles();

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Truck className="h-6 w-6 text-blue-600" /> 용차/기사 관리
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    배차 시스템에 등록된 기사의 정산 타입(고정/용차)을 설정합니다.
                </p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm italic">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">기사명/코드</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">차량번호</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">연락처</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">정산 타입</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">비고</th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {vehicles?.map((v) => (
                                <tr key={v.driverId} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-800">{v.driverName}</div>
                                        <div className="text-[10px] text-slate-400 font-mono italic">{v.driverId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {v.vehicleNo || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {v.driverPhone || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <form action={async (formData) => {
                                            'use server';
                                            const type = formData.get('type') as string;
                                            await updateVehicleType(v.driverId, type);
                                        }}>
                                            <input type="hidden" name="driverId" value={v.driverId} />
                                            <select
                                                name="type"
                                                defaultValue={v.type}
                                                onBlur={(e) => e.target.form?.requestSubmit()}
                                                className={`text-[11px] font-bold px-2 py-1 rounded-md border transition-all outline-none ${v.type === 'outsourced'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}
                                            >
                                                <option value="fixed">고정 (Fixed)</option>
                                                <option value="outsourced">용차 (Outsourced)</option>
                                            </select>
                                        </form>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <form action={async (formData) => {
                                            'use server';
                                            const memo = formData.get('memo') as string;
                                            await updateVehicleMemo(v.driverId, memo);
                                        }}>
                                            <input
                                                name="memo"
                                                type="text"
                                                defaultValue={v.memo}
                                                placeholder="메모 입력..."
                                                onBlur={(e) => e.target.form?.requestSubmit()}
                                                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 w-40 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </form>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button className="text-slate-300 hover:text-blue-500 transition-colors">
                                            <Info className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
