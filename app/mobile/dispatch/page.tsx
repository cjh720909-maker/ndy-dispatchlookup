'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Phone, Search, Truck, User, MapPin, ChevronRight, Package, Calendar, X, Loader2, ChevronLeft, Box, Scale, AlertCircle, ArrowLeft
} from 'lucide-react';
import { getRealDispatchData, getUserInfo, type DispatchGroup, logoutAction } from './server-action';
import Link from 'next/link';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<string | null>(null);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    getUserInfo().then(info => {
      setCurrentUser(info.username);
      setUserRole(info.role);
    });
  }, []);

  // 날짜 설정 (KST 기준 오늘 날짜)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    // KST 시간 계산 (UTC + 9시간)
    const kstNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 60 * 60 * 1000));

    // 오후 6시(18시) 이후면 다음 날짜로 설정
    if (kstNow.getHours() >= 18) {
      kstNow.setDate(kstNow.getDate() + 1);
    }

    const y = kstNow.getFullYear();
    const m = String(kstNow.getMonth() + 1).padStart(2, '0');
    const d = String(kstNow.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [dispatchList, setDispatchList] = useState<DispatchGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0); // [New] 전체 개수 상태
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 데이터 조회 함수
  const fetchData = useCallback(async (term: string, date: string) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await getRealDispatchData(term, date);
      if (response.error) {
        alert(`[치명적 오류 발생]\n서버가 DB에 연결하지 못했습니다.\n\n${response.error}`);
        return;
      }
      setDispatchList(response.data);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error("데이터 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 자동 조회
  useEffect(() => {
    fetchData(searchTerm, selectedDate);
  }, [fetchData, selectedDate]);

  const changeDate = (days: number) => {
    const target = new Date(selectedDate);
    target.setDate(target.getDate() + days);
    const newDate = target.toISOString().split('T')[0];
    setSelectedDate(newDate);
  };

  const handleSearch = () => {
    fetchData(searchTerm, selectedDate);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  // --- 2. 상세 화면 ---
  if (selectedDispatch) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 animate-in slide-in-from-right duration-200">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm p-2 flex items-center gap-2">
          <button onClick={() => setSelectedDispatch(null)} className="p-1 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 truncate leading-tight">{selectedDispatch.customerName}</h1>
            <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{selectedDispatch.customerCode}</p>
          </div>
        </header>

        <main className="p-2 space-y-2 pb-20">
          <section className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 rounded flex items-center justify-center text-blue-600 font-bold text-sm">
                  {selectedDispatch.driverName[0] || '기'}
                </div>
                <div>
                  <p className="font-bold text-base text-slate-800 leading-none">
                    {selectedDispatch.driverName} <span className="text-xs font-normal text-slate-500">기사</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 leading-none">
                    {selectedDispatch.vehicleNo} {selectedDispatch.dockNo && <span className="ml-1 text-blue-500 border border-blue-100 px-1 rounded-[2px] bg-blue-50/50">DOCK:{selectedDispatch.dockNo}</span>}
                  </p>
                </div>
              </div>
              {selectedDispatch.driverPhone && (
                <a
                  href={`tel:${selectedDispatch.driverPhone.replace(/-/g, '')}`}
                  className="flex items-center gap-2 bg-green-500 text-white px-3 h-9 rounded-xl shadow active:scale-95 transition-transform"
                >
                  <Phone className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold">{selectedDispatch.driverPhone}</span>
                </a>
              )}
            </div>
          </section>

          <section className="bg-white rounded-lg p-2 border border-slate-200 flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 leading-tight">{selectedDispatch.address || '주소 정보 없음'}</p>
          </section>

          <section className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            {/* 테이블 헤더 */}
            <div className="grid grid-cols-[50px_1fr_40px_40px_40px_45px] gap-1 px-2 py-1.5 bg-slate-100 border-b border-slate-200 text-center items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase">코드</span>
              <span className="text-[9px] font-black text-slate-400 uppercase text-left">제품명</span>
              <span className="text-[9px] font-black text-slate-400 uppercase">주문</span>
              <span className="text-[9px] font-black text-slate-400 uppercase text-blue-500">출고</span>
              <span className="text-[9px] font-black text-slate-400 uppercase text-red-500">결품</span>
              <span className="text-[9px] font-black text-slate-400 uppercase">중량</span>
            </div>

            <div className="divide-y divide-slate-100">
              {selectedDispatch.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[50px_1fr_40px_40px_40px_45px] gap-1 px-2 py-2 text-center items-center hover:bg-slate-50/50 transition-colors">
                  <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50/50 rounded py-0.5 border border-blue-100/50 leading-none">
                    {item.productCode}
                  </span>
                  <p className="text-[11px] font-bold text-slate-800 text-left leading-tight break-all">
                    {item.productName}
                  </p>
                  <span className="text-xs font-bold text-slate-600">{item.qty}</span>
                  <span className="text-xs font-black text-blue-600">{item.outQty}</span>
                  <span className={`text-xs font-bold ${item.missingQty > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                    {item.missingQty}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">{item.weight}kg</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --- 1. 메인 화면 ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-black flex items-center gap-2 leading-none">
              <Truck className="h-5 w-5" /> 배차 조회
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-blue-700 px-2.5 py-1 rounded-full">{selectedDate}</span>
              {(userRole === 'admin' || userRole === 'staff' || currentUser === 'admin') && (
                <Link
                  href="/daily-dispatch"
                  className="text-xs bg-amber-500 hover:bg-amber-400 text-white px-2.5 py-1 rounded-full font-black shadow-lg shadow-amber-500/20 transition-all border border-amber-400"
                >
                  용차 배차
                </Link>
              )}
              {currentUser === 'admin' && (
                <Link
                  href="/admin/users"
                  className="text-xs bg-white text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-full font-bold transition-colors"
                >
                  아이디 관리
                </Link>
              )}
              <Link
                href="/settings"
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded-full font-bold transition-colors border border-slate-600"
              >
                설정
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="text-xs bg-blue-800 hover:bg-blue-700 text-blue-100 px-2.5 py-1 rounded-full font-bold transition-colors md:ml-2">
                  로그아웃
                </button>
              </form>
            </div>
          </div>

          <div className="bg-blue-700/40 p-1 rounded-xl flex items-center justify-between mb-3 border border-blue-500/20">
            <button onClick={() => changeDate(-1)} className="p-1.5 text-blue-100 hover:text-white transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="relative flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-200" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-bold text-base border-none focus:ring-0 cursor-pointer p-0"
              />
            </div>
            <button onClick={() => changeDate(1)} className="p-1.5 text-blue-100 hover:text-white transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300" />
            <input
              type="text"
              placeholder="납품처명 또는 코드 검색..."
              className="w-full pl-10 pr-14 py-2.5 rounded-xl bg-blue-700/40 border border-blue-500 text-white placeholder:text-blue-300 focus:outline-none focus:bg-blue-700 text-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSearch} className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-xs font-bold text-white shadow-sm transition-all">
              조회
            </button>
            {isLoading && <Loader2 className="absolute right-16 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-200 animate-spin" />}
          </div>
        </div>
      </header>

      {/* 리스트 본문 */}
      <main className="p-2 max-w-md mx-auto pb-20 space-y-1.5">
        <div className="flex justify-between items-center px-1 mb-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">List Status</span>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 leading-none">{totalCount} 건</span>
        </div>

        {isLoading && dispatchList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <Loader2 className="h-10 w-10 animate-spin mb-3" />
            <p className="text-xs font-bold">서버에서 데이터를 가져오고 있습니다...</p>
          </div>
        ) : !isLoading && dispatchList.length === 0 ? (
          <div className="text-center py-24 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 shadow-inner">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold tracking-tight">배차 내역이 없습니다.</p>
            <p className="text-[10px] mt-1 opacity-60 italic">날짜를 바꾸거나 검색어를 입력해 보세요.</p>
          </div>
        ) : (
          dispatchList.map((item) => {
            const hasMissing = item.items.some((i) => i.missingQty > 0);
            return (
              <div
                key={item.groupKey}
                onClick={() => setSelectedDispatch(item)}
                className={`rounded-xl p-3 border shadow-sm cursor-pointer active:scale-[0.98] transition-all hover:border-blue-300 ${hasMissing
                  ? 'bg-red-50 border-red-200 hover:bg-red-100'
                  : 'bg-white border-slate-200'
                  }`}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-1.5 rounded leading-none py-0.5 border border-blue-100 flex-shrink-0">
                        {item.customerCode}
                      </span>
                      <h2 className="text-base font-bold text-slate-800 truncate leading-none">
                        {item.customerName}
                      </h2>
                    </div>
                  </div>
                  {hasMissing && (
                    <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse">
                      결품
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <div className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    <User className="h-3 w-3 text-slate-400" /> {item.driverName}
                  </div>
                  {item.vehicleNo && (
                    <div className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      <Truck className="h-3 w-3 text-slate-400" /> {item.vehicleNo}
                    </div>
                  )}
                  <div className="ml-auto text-[10px] font-bold text-slate-400">
                    {item.items.length}개 품목
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}