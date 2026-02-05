import React from 'react';
import Link from 'next/link';
import { Truck, Users, Calculator, FileText, Home } from 'lucide-react';
import { getSession } from '../../lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.username !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 shrink-0">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Truck className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl tracking-tight">NDY Logistics</span>
        </div>

        <nav className="space-y-1">
          <Link href="/mobile/dispatch" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium">
            <Home className="h-4 w-4" /> 모바일 홈
          </Link>
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">사용자 관리</div>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium">
            <Users className="h-4 w-4" /> 계정 관리
          </Link>
          
          <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">배차 및 정산</div>
          <Link href="/admin/vehicles" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium">
            <Truck className="h-4 w-4" /> 용차/기사 관리
          </Link>
          <Link href="/admin/vehicle-rates" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium">
            <Calculator className="h-4 w-4" /> 용차 단가 설정
          </Link>
          <Link href="/admin/dispatch-report" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium">
            <FileText className="h-4 w-4" /> 용차 정산 리포트
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
