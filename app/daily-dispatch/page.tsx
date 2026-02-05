'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Truck, Calendar, AlertTriangle, CheckCircle2,
    Search, User, Phone, Plus, Loader2, LogOut,
    FileText, UserCog, Settings, Trash2, X, Check,
    ChevronDown, ChevronUp, MapPin, Package, Scale, Navigation2
} from 'lucide-react';
import {
    getDailyDispatchData,
    addDriverToPool,
    deleteDriverFromPool,
    matchDriver,
    updateDeliverySequence,
    type DailyDispatchInfo,
    type TransportDriver,
    type DetailedDispatch
} from './server-action';
import { logoutAction } from '../mobile/dispatch/server-action';
import Link from 'next/link';

export default function DailyDispatchPage() {
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 60 * 60 * 1000));
        return kstNow.toISOString().split('T')[0];
    });

    const [data, setData] = useState<DailyDispatchInfo[]>([]);
    const [driverPool, setDriverPool] = useState<TransportDriver[]>([]);
    const [user, setUser] = useState<{ username: string; role: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState<DailyDispatchInfo | null>(null);
    const [showPoolManager, setShowPoolManager] = useState(false);
    const [isActionPending, setIsActionPending] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const res = await getDailyDispatchData(selectedDate);
        if (res.data) {
            setData(res.data);
            if (res.driverPool) setDriverPool(res.driverPool);
            if (res.user) setUser(res.user);
        } else if (res.error) {
            alert(res.error);
        }
        setIsLoading(false);
    }, [selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddDriverToPool = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        setIsActionPending(true);
        const formData = new FormData(form);
        const res = await addDriverToPool(formData);
        if (res.success) {
            form.reset();
            fetchData();
        } else {
            alert(res.error);
        }
        setIsActionPending(false);
    };

    const handleDeleteDriverFromPool = async (id: number) => {
        if (!confirm('이 기사 정보를 삭제하시겠습니까?')) return;
        setIsActionPending(true);
        const res = await deleteDriverFromPool(id);
        if (res.success) {
            fetchData();
        } else {
            alert(res.error);
        }
        setIsActionPending(false);
    };

    const handleMatchDriver = async (poolDriverId: number) => {
        if (!isRegistering) return;
        setIsActionPending(true);
        const res = await matchDriver(selectedDate, isRegistering.driverName, poolDriverId);
        if (res.success) {
            setIsRegistering(null);
            fetchData();
        } else {
            alert(res.error);
        }
        setIsActionPending(false);
    };

    const handleUpdateSequence = async (driverName: string, cbCode: string, sequence: number) => {
        // 낙관적 UI 업데이트: 서버 응답을 기다리지 않고 로컬 상태를 즉시 갱신
        setData(prevData => {
            return prevData.map(driver => {
                if (driver.driverName === driverName) {
                    const updatedDetails = driver.details.map(d =>
                        d.cbCode === cbCode ? { ...d, sequence } : d
                    ).sort((a, b) => {
                        if (a.sequence !== b.sequence) return a.sequence - b.sequence;
                        return a.customerName.localeCompare(b.customerName);
                    });
                    return { ...driver, details: updatedDetails };
                }
                return driver;
            });
        });

        // 백그라운드에서 서버 저장 수행
        const res = await updateDeliverySequence(selectedDate, driverName, cbCode, sequence);
        if (!res.success) {
            alert('순서 저장 실패: ' + res.error);
            fetchData(); // 에러 발생 시에만 서버 데이터로 롤백
        }
    };


    const toggleRow = (driverName: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [driverName]: !prev[driverName]
        }));
    };

    const unregisteredCount = data.filter(d => !d.isRegistered).length;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-900 text-white p-4 sticky top-0 z-30 shadow-lg">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Truck className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-tight">용차 배차 대시보드</h1>
                            <p className="text-slate-400 text-xs font-medium">당일 기사 정보 관리 시스템</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
                            <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-black shadow-lg shadow-blue-500/20">용차 배차</button>
                            <Link
                                href="/mobile/dispatch"
                                className="text-slate-400 px-4 py-1.5 rounded-lg text-xs font-bold hover:text-slate-200 transition-colors"
                            >
                                결품 조회
                            </Link>
                        </div>

                        <div className="hidden sm:flex items-center bg-slate-800 rounded-full px-4 py-1.5 border border-slate-700">
                            <Calendar className="h-4 w-4 text-blue-400 mr-2" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent text-sm font-bold border-none focus:ring-0 cursor-pointer text-slate-200"
                            />
                        </div>

                        <button
                            onClick={() => setShowPoolManager(true)}
                            disabled={user?.role === 'staff'}
                            className={`p-2 rounded-full text-slate-400 transition-colors ${user?.role === 'staff' ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'}`}
                            title={user?.role === 'staff' ? "권한이 없습니다" : "기사 목록 관리"}
                        >
                            <UserCog className="h-5 w-5" />
                        </button>


                        {user?.username === 'admin' && (
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Plus className="h-3.5 w-3.5" /> 계정 생성
                            </Link>
                        )}

                        <form action={logoutAction}>
                            <button type="submit" className="p-2 hover:bg-slate-800 rounded-full transition-colors" title="로그아웃">
                                <LogOut className="h-5 w-5 text-slate-400" />
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
                {/* Warning Banner */}
                {unregisteredCount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-red-900 font-bold text-sm">기사 정보 미등록 경고</h2>
                            <p className="text-red-700 text-xs">
                                용차 중 <span className="font-black">{unregisteredCount}건</span>이 매칭되지 않았습니다.
                            </p>
                        </div>
                    </div>
                )}

                {/* List Body */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Driver Matching Status</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-bold">{selectedDate} 배차 내역</span>
                            <button onClick={fetchData} className="text-xs font-bold text-blue-600 hover:underline">새로고침</button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-20 text-center">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-200" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 py-20 rounded-3xl text-center text-slate-400">
                            <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">배차된 용차 내역이 없습니다.</p>
                        </div>
                    ) : (
                        data.map((item) => (
                            <div key={item.driverName} className="flex flex-col">
                                <div
                                    onClick={() => toggleRow(item.driverName)}
                                    className={`bg-white border cursor-pointer active:bg-slate-50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${item.isRegistered ? 'border-slate-200' : 'border-red-200 bg-red-50/20'} ${!expandedRows[item.driverName] ? 'rounded-2xl mb-1' : 'rounded-t-2xl'}`}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-slate-800 text-base leading-none truncate">{item.realDriverName}</h4>
                                                {!item.isRegistered && (
                                                    <span className="text-[9px] font-black px-1 py-0.5 rounded border bg-amber-50 text-amber-600 border-amber-100 uppercase shrink-0">OUTSOURCED</span>
                                                )}
                                            </div>
                                            <p className="text-slate-500 text-[11px] mt-1.5 font-bold flex items-center gap-1">
                                                <Truck className="h-3 w-3 text-slate-400" /> {item.vehicleNo}
                                            </p>
                                        </div>
                                        <div className="sm:hidden">
                                            {expandedRows[item.driverName] ? <ChevronUp className="h-5 w-5 text-slate-300" /> : <ChevronDown className="h-5 w-5 text-slate-300" />}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-4">
                                        <div className="hidden sm:block text-right pr-4 border-r border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">배차</p>
                                            <p className="text-sm font-black text-slate-700">{item.dispatchCount}건</p>
                                        </div>

                                        {!item.isRegistered ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsRegistering(item);
                                                }}
                                                disabled={user?.role === 'staff'}
                                                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 active:scale-95 transition-all ${user?.role === 'staff'
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/10'
                                                    }`}
                                            >
                                                <UserCog className="h-3.5 w-3.5" /> 매칭
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1 text-green-600 font-bold text-[11px]">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        매칭완료
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold">{item.phoneNumber}</p>
                                                </div>
                                                {item.phoneNumber && (
                                                    <a
                                                        href={`tel:${item.phoneNumber}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md shadow-green-500/10 transition-all active:scale-95"
                                                    >
                                                        <Phone className="h-3.5 w-3.5 fill-white" />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {expandedRows[item.driverName] && (
                                    <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl p-3 sm:p-4 mb-3 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <div className="min-w-[300px]">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-200">
                                                            <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 w-[40%]">순서 / 거래처 / 연락처</th>
                                                            <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[40%]">주소</th>
                                                            <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-1 w-[20%]">실적</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {item.details.map((detail, idx) => (
                                                            <tr key={idx} className="group transition-colors">
                                                                <td className="py-3 pl-1 align-top">
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="flex flex-col items-center gap-1">
                                                                            <input
                                                                                type="number"
                                                                                defaultValue={detail.sequence === 999 ? '' : detail.sequence}
                                                                                onBlur={(e) => {
                                                                                    const val = parseInt(e.target.value);
                                                                                    if (!isNaN(val) && val !== detail.sequence) {
                                                                                        handleUpdateSequence(item.driverName, detail.cbCode || '', val);
                                                                                    }
                                                                                }}
                                                                                className="w-10 h-7 text-center text-xs font-black border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all"
                                                                                placeholder="-"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[13px] font-black text-slate-800 leading-tight mb-1 truncate">{detail.customerName}</p>
                                                                            {detail.customerPhone ? (
                                                                                <a href={`tel:${detail.customerPhone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-xs text-blue-600 font-extrabold hover:underline">
                                                                                    <Phone className="h-3 w-3 fill-blue-600" /> {detail.customerPhone}
                                                                                </a>
                                                                            ) : (
                                                                                <p className="text-[10px] text-slate-300 font-bold">연락처 미등록</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 align-top text-left pr-2">
                                                                    <p className="text-[11px] text-slate-600 leading-normal break-keep font-semibold">{detail.address || '-'}</p>
                                                                </td>
                                                                <td className="py-3 text-right pr-1 align-top">
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <p className="text-xs font-black text-slate-700">{detail.weight.toLocaleString()}<span className="text-[10px] text-slate-400 ml-0.5">kg</span></p>
                                                                        <p className="text-xs font-black text-slate-700">{detail.qty.toLocaleString()}<span className="text-[10px] text-slate-400 ml-0.5">ea</span></p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="border-t border-slate-200 bg-slate-100/30">
                                                        <tr>
                                                            <td className="py-2 pl-2 text-[10px] font-black text-slate-500">합계</td>
                                                            <td className="py-2 text-right text-xs font-black text-slate-800">{item.totalWeight.toLocaleString()} kg</td>
                                                            <td className="py-2 text-right pr-2 text-xs font-black text-slate-800">{item.totalQty.toLocaleString()} ea</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>

            <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-slate-400 border-t border-slate-200/50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">© {(new Date()).getFullYear()} (주) 엔디와이 ndy-dispatchlookup</p>
                <p className="text-[9px] font-bold text-slate-300 mt-1 uppercase">Logistics Dispatch Management System</p>
            </footer>

            {/* Pool Manager Overlay */}
            {showPoolManager && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                                    <UserCog className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 leading-tight">용차 기사 풀 관리</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Master Driver List</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPoolManager(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8 flex-1">
                            {/* Add Section */}
                            <section>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">New Master Registration</h4>
                                <form onSubmit={handleAddDriverToPool} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-3xl">
                                    <div className="sm:col-span-1">
                                        <input name="name" placeholder="기사 성함" required className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <input name="phoneNumber" placeholder="연락처 (010-...)" required className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <input name="vehicleNumber" placeholder="차량번호 (선택)" className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isActionPending}
                                        className="bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                                    >
                                        {isActionPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Register'}
                                    </button>
                                </form>
                            </section>

                            {/* Pool List */}
                            <section>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active Pool ({driverPool.length})</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {driverPool.map(driver => (
                                        <div key={driver.id} className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center justify-between group hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                    {driver.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800">{driver.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{driver.phoneNumber}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteDriverFromPool(driver.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="h-4.5 w-4.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {driverPool.length === 0 && (
                                        <div className="col-span-2 py-10 text-center text-slate-300 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                            <p className="text-sm font-bold italic">등록된 기사 풀이 없습니다. 기사님을 먼저 등록해 주세요.</p>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-6 text-[10px] text-slate-400 text-center font-bold">전담 기사님 정보를 등록해두면 매일 편리하게 매칭할 수 있습니다.</p>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* Matcher Modal Overlay */}
            {isRegistering && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-red-500 p-8 text-white relative">
                            <button onClick={() => setIsRegistering(null)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                            <h3 className="text-2xl font-black flex items-center gap-3">
                                <UserCog className="h-7 w-7" /> 당일 기사 매칭
                            </h3>
                            <div className="mt-4 flex items-center gap-3 bg-black/10 p-4 rounded-3xl">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Dispatched Vehicle</p>
                                    <p className="text-lg font-black leading-tight">{isRegistering.vehicleNo}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Select Driver from Pool</h4>
                            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {driverPool.map(driver => (
                                    <button
                                        key={driver.id}
                                        onClick={() => handleMatchDriver(driver.id)}
                                        disabled={isActionPending}
                                        className="w-full group bg-slate-50 hover:bg-blue-600 p-4 rounded-3xl flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 font-black transition-colors">
                                                {driver.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 group-hover:text-white transition-colors">{driver.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 transition-colors">{driver.phoneNumber}</p>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white/50 group-hover:bg-white text-slate-300 group-hover:text-blue-600 rounded-xl transition-all">
                                            <Check className="h-4 w-4" />
                                        </div>
                                    </button>
                                ))}
                                {driverPool.length === 0 && (
                                    <div className="py-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                        <p className="text-sm font-black text-slate-300">POOL IS EMPTY</p>
                                        <button
                                            onClick={() => {
                                                setIsRegistering(null);
                                                setShowPoolManager(true);
                                            }}
                                            className="mt-3 text-xs font-black text-blue-500 hover:underline"
                                        >
                                            + 먼저 기사를 등록하세요
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsRegistering(null)}
                                className="w-full mt-6 py-4 rounded-3xl text-sm font-black text-slate-400 hover:bg-slate-50 transition-colors uppercase tracking-[0.2em]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
