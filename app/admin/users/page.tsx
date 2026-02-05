import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/auth';
import { getUsers } from './server-action';
import AddUserForm from './AddUserForm';
import UserList from './UserList';
import { Users, Truck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function AdminUsersPage() {
    const session = await getSession();

    // Admin 권한 확인 (admin 아이디만 접근 가능)
    if (!session || session.username !== 'admin') {
        redirect('/login');
    }

    const { data: users, error } = await getUsers();

    return (
        <div className="min-h-screen bg-slate-50 relative pb-20">
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-lg">
                <div className="max-w-5xl mx-auto p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/daily-dispatch" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-white leading-tight">사용자 관리</h1>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Admin Control Panel</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {error && (
                    <div className="p-4 bg-red-50 border-2 border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
                        <div className="bg-red-100 p-1.5 rounded-lg">!</div>
                        {error}
                    </div>
                )}

                {/* 계정 추가 폼 (Client Component) */}
                <AddUserForm />

                {/* 사용자 목록 (Client Component for immediate delete feedback) */}
                <UserList initialUsers={users || []} />
            </main>

            <footer className="max-w-5xl mx-auto px-6 py-8 text-center text-slate-400">
                <p className="text-xs font-bold uppercase tracking-tighter">© {(new Date()).getFullYear()} (주) 엔디와이 ndy-dispatchlookup</p>
            </footer>
        </div>
    );
}
