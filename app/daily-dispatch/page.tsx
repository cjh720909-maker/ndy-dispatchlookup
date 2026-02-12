'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Truck, Calendar, AlertTriangle, CheckCircle2,
    Search, User, Phone, Plus, Loader2, LogOut,
    FileText, UserCog, Settings, Trash2, X, Check,
    ChevronDown, ChevronUp, MapPin, Package, Scale, Navigation2,
    Edit2, ChevronLeft, ChevronRight, ShieldCheck, Users
} from 'lucide-react';
import {
    getDailyDispatchData,
    addDriverToPool,
    deleteDriverFromPool,
    updateDriverInPool,
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
    const [user, setUser] = useState<{ username: string; role: string; companyName: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState<DailyDispatchInfo | null>(null);
    const [showPoolManager, setShowPoolManager] = useState(false);
    const [isActionPending, setIsActionPending] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [editingDriver, setEditingDriver] = useState<TransportDriver | null>(null);
    const [confirmDeleteDriver, setConfirmDeleteDriver] = useState<TransportDriver | null>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);

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

    const executeDeleteDriver = async () => {
        if (!confirmDeleteDriver) return;
        const targetId = confirmDeleteDriver.id;
        setConfirmDeleteDriver(null);
        setIsActionPending(true);
        const res = await deleteDriverFromPool(targetId);
        if (res.success) {
            fetchData();
        } else {
            alert(res.error);
        }
        setIsActionPending(false);
    };

    const handleUpdateDriverInPool = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingDriver) return;
        setIsActionPending(true);
        const formData = new FormData(e.currentTarget);
        const res = await updateDriverInPool(editingDriver.id, formData);
        if (res.success) {
            setEditingDriver(null);
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


    const unregisteredCount = data.filter(d => !d.isRegistered).length;

    // 권한 체크 로직 (4단계 그룹화)
    const isAdmin = user?.role === 'admin';
    const isNDY = user?.role === 'staff' && (!user?.companyName || user?.companyName === 'NDY' || user?.companyName === '관리자') && !isAdmin;
    const isCustomer = user?.role === 'customer';
    const isLogistics = !isAdmin && !isNDY && !isCustomer && !!user?.companyName;

    // 결품 조회 버튼 노출: 어드민, NDY팀, 고객사
    const canSeeShortage = isAdmin || isNDY || isCustomer;
    // 기사 관리/매칭 권한: 어드민, 운수회사
    const canManagePool = isAdmin || isLogistics;

    const changeDate = (days: number) => {
        const target = new Date(selectedDate);
        target.setDate(target.getDate() + days);
        const newDate = target.toISOString().split('T')[0];
        setSelectedDate(newDate);
    };

    const toggleRow = (driverName: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [driverName]: !prev[driverName]
        }));
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-lg">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Truck className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold leading-tight">용차 배차</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Logistics</p>
                                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                    <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/30">
                                        <p className="text-blue-400 text-[9px] font-black uppercase tracking-tighter">
                                            {isAdmin ? 'Admin' : isNDY ? 'NDY Staff' : isCustomer ? 'Customer' : 'Logistics'}
                                        </p>
                                        <p className="text-slate-300 text-[9px] font-bold">
                                            {user?.companyName || user?.username}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {canSeeShortage && (
                                <Link
                                    href="/mobile/dispatch"
                                    className="mr-1 sm:mr-2 bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-[11px] font-bold hover:bg-slate-700 transition-colors border border-slate-700/50"
                                >
                                    결품 조회
                                </Link>
                            )}

                            {isAdmin && (
                                <Link
                                    href="/admin/users"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">계정 생성</span>
                                </Link>
                            )}

                            <button
                                onClick={() => setShowPoolManager(true)}
                                disabled={!canManagePool}
                                className={`p-1.5 sm:p-2 rounded-full text-slate-400 transition-colors ${!canManagePool ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'}`}
                                title={!canManagePool ? "권한이 없습니다" : "기사 목록 관리"}
                            >
                                <UserCog className="h-5 w-5" />
                            </button>

                            <Link
                                href="/settings"
                                className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                                title="설정"
                            >
                                <Settings className="h-5 w-5" />
                            </Link>

                            <form action={logoutAction}>
                                <button type="submit" className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-full transition-colors" title="로그아웃">
                                    <LogOut className="h-5 w-5 text-slate-400" />
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <div className="flex items-center bg-slate-800 rounded-xl px-2 py-2 border border-slate-700/50 w-full sm:w-auto sm:min-w-[200px] justify-center">
                            <button onClick={() => changeDate(-1)} className="p-2 text-slate-400 hover:text-white transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div
                                className="flex items-center px-4 cursor-pointer active:scale-95 transition-transform"
                                onClick={() => dateInputRef.current?.showPicker()}
                            >
                                <Calendar className="h-4 w-4 text-blue-400 mr-2.5" />
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent text-base font-bold border-none focus:ring-0 cursor-pointer text-slate-200 p-0 w-[125px]"
                                />
                            </div>
                            <button onClick={() => changeDate(1)} className="p-2 text-slate-400 hover:text-white transition-colors">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
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
                                                <h4 className="font-black text-slate-800 text-base leading-none truncate shrink-0">{item.realDriverName}</h4>
                                                {!item.isRegistered && (
                                                    <span className="text-[9px] font-black px-1 py-0.5 rounded border bg-amber-50 text-amber-600 border-amber-100 uppercase shrink-0">OUTSOURCED</span>
                                                )}
                                                <span className="text-[11px] text-slate-400 truncate ml-1 hidden sm:inline-block">
                                                    {item.details.map(d => d.customerName).join(', ')}
                                                </span>
                                                <span className="text-[11px] text-slate-400 truncate ml-1 sm:hidden">
                                                    {item.details.length > 0 ? (item.details.length > 1 ? `${item.details[0].customerName} 외 ${item.details.length - 1}건` : item.details[0].customerName) : ''}
                                                </span>
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
                                                disabled={!canManagePool}
                                                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 active:scale-95 transition-all ${!canManagePool
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/10'
                                                    }`}
                                            >
                                                <UserCog className="h-3.5 w-3.5" /> 매칭
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1 text-green-600 font-bold text-[11px]">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            매칭완료
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-bold">{item.phoneNumber}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsRegistering(item);
                                                        }}
                                                        disabled={!canManagePool}
                                                        className={`p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-500 transition-colors ${!canManagePool ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                        title={!canManagePool ? "권한이 없습니다" : "매칭 수정"}
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
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

                                {
                                    expandedRows[item.driverName] && (
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
                                                                                    readOnly={!canManagePool}
                                                                                    className={`w-10 h-7 text-center text-xs font-black border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all ${!canManagePool ? 'opacity-50 cursor-default' : ''}`}
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
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                        소속: <span className="text-blue-600">{user?.companyName || 'NDY'}</span>
                                    </p>
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
                                <form onSubmit={handleAddDriverToPool} className="flex flex-col gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Name</label>
                                            <input name="name" placeholder="기사 성함" required className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Phone</label>
                                            <input name="phoneNumber" placeholder="연락처 (010-...)" required className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Vehicle No (Optional)</label>
                                            <input name="vehicleNumber" placeholder="차량번호" className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase">Company Affiliation</label>
                                            <div className="relative">
                                                <input
                                                    name="transportCompany"
                                                    defaultValue={user?.companyName || 'NDY'}
                                                    readOnly={isAdmin ? false : true}
                                                    required
                                                    className={`w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all ${isAdmin ? 'bg-white focus:ring-2 focus:ring-blue-500' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`}
                                                    placeholder="소속 회사명"
                                                />
                                                {!isAdmin && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <ShieldCheck className="h-4 w-4 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isActionPending}
                                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {isActionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Register New Driver</>}
                                    </button>
                                </form>
                            </section>

                            {/* Pool List */}
                            <section>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active Pool ({driverPool.length})</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {driverPool.map(driver => (
                                        <div key={driver.id} className="bg-white border border-slate-100 rounded-3xl p-5 group hover:border-blue-200 transition-all">
                                            {editingDriver?.id === driver.id ? (
                                                <form onSubmit={handleUpdateDriverInPool} className="flex flex-col gap-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Name</label>
                                                            <input name="name" defaultValue={driver.name} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Phone</label>
                                                            <input name="phoneNumber" defaultValue={driver.phoneNumber} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Vehicle</label>
                                                            <input name="vehicleNumber" defaultValue={driver.vehicleNumber || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-blue-500" placeholder="차량번호" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Company</label>
                                                            <input
                                                                name="transportCompany"
                                                                defaultValue={driver.transportCompany}
                                                                readOnly={isAdmin ? false : true}
                                                                required
                                                                className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none ${isAdmin ? 'bg-slate-50 focus:ring-1 focus:ring-blue-500' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button type="button" onClick={() => setEditingDriver(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                                                        <button type="submit" disabled={isActionPending} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 active:scale-95">Save Changes</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-blue-50 group-hover:text-blue-600 transition-all text-lg">
                                                            {driver.name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-black text-slate-800">{driver.name}</p>
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black border border-slate-200 uppercase tracking-tighter">
                                                                    {driver.transportCompany}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" /> {driver.phoneNumber}
                                                                </p>
                                                                {driver.vehicleNumber && (
                                                                    <p className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
                                                                        <Truck className="h-3 w-3" /> {driver.vehicleNumber}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setEditingDriver(driver)}
                                                            className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                            title="수정"
                                                        >
                                                            <Edit2 className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDeleteDriver(driver)}
                                                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="삭제"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {driverPool.length === 0 && (
                                        <div className="py-20 text-center text-slate-300 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                            <Users className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                            <p className="text-sm font-bold italic">등록된 기사 풀이 없습니다. 기사님을 먼저 등록해 주세요.</p>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-8 text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">Master Driver Pool Management System</p>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* Driver Delete Confirmation Modal */}
            {confirmDeleteDriver && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 text-center mb-2">기사 정보 삭제</h3>
                        <p className="text-slate-500 text-center text-sm font-medium mb-8 leading-relaxed">
                            <span className="text-red-600 font-bold">[{confirmDeleteDriver.name}]</span> 기사님 정보를 풀에서 삭제하시겠습니까?<br />
                            <span className="text-[11px] opacity-70">이 작업은 되돌릴 수 없으며 향후 매칭 시 다시 등록해야 합니다.</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setConfirmDeleteDriver(null)}
                                className="py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={executeDeleteDriver}
                                className="py-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                            >
                                삭제하기
                            </button>
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
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">배정 차량</p>
                                    <p className="text-lg font-black leading-tight">{isRegistering.vehicleNo}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">기사 풀에서 선택</h4>
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
                                        <p className="text-sm font-black text-slate-300">등록된 기사가 없습니다</p>
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
                                취소
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
        </div >
    );
}
