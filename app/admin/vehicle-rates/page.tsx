import React from 'react';
import { getVehicleRates, updateRate } from './server-action';
import { Calculator, Save } from 'lucide-react';

export default async function VehicleRatesPage() {
    const { data: rates, error } = await getVehicleRates();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Calculator className="h-6 w-6 text-blue-600" /> 용차 단가 설정
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    용차(Outsourced) 기사별 기본 배송 단가를 설정합니다. 정산 시 기본값으로 사용됩니다.
                </p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {!rates || rates.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">용차로 등록된 기사가 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-2">'용차/기사 관리' 메뉴에서 타입을 '용차'로 변경해 주세요.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {rates.map((v) => (
                        <div key={v.driverId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-800">{v.driverId}</h3>
                                <p className="text-xs text-slate-400 mt-1 italic">용차 운송료 설정</p>
                            </div>

                            <form action={async (formData) => {
                                'use server';
                                const price = parseInt(formData.get('price') as string) || 0;
                                const desc = formData.get('description') as string;
                                await updateRate(v.driverId, price, desc);
                            }} className="flex flex-col md:flex-row items-end md:items-center gap-3">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">기본 단가 (₩)</label>
                                    <input
                                        name="price"
                                        type="number"
                                        defaultValue={v.basePrice}
                                        className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-blue-600 w-32"
                                    />
                                </div>
                                <div className="space-y-1 flex-1 min-w-[200px]">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">설명/비고</label>
                                    <input
                                        name="description"
                                        type="text"
                                        defaultValue={v.description}
                                        placeholder="단가 적용 기준 등..."
                                        className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm w-full"
                                    />
                                </div>
                                <button type="submit" className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-100 flex items-center gap-2 active:scale-95 transition-all">
                                    <Save className="h-4 w-4" /> 저장
                                </button>
                            </form>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
