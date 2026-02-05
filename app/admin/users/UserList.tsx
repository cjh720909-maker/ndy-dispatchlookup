'use client';

import { useState, useEffect } from 'react';
import { deleteUser } from './server-action';
import { Trash2, ShieldCheck, User, Building2, Calendar, Users } from 'lucide-react';

interface UserData {
    id: number;
    username: string;
    role: string;
    companyName: string | null;
    createdAt: Date;
}

export default function UserList({ initialUsers }: { initialUsers: any[] }) {
    const [users, setUsers] = useState(initialUsers);

    // 서버 사이드 데이터가 업데이트될 때(revalidatePath 등) 클라이언트 상태도 동기화
    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    async function handleDelete(id: number) {
        if (!confirm('이 계정을 정말 삭제하시겠습니까?')) return;

        // Optimistic delete
        const originalUsers = [...users];
        setUsers(users.filter(u => u.id !== id));

        const result = await deleteUser(id);
        if (result?.error) {
            alert(result.error);
            setUsers(originalUsers);
        }
    }

    return (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">등록된 계정 목록</h2>
                    <p className="text-slate-400 text-xs font-medium mt-1">현재 시스템에 등록된 모든 사용자 계정입니다.</p>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500">총 <span className="text-blue-600">{users.length}</span>명</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Account Info</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Role Status</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Affiliation</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Created At</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{user.username}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight ${user.role === 'staff' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        user.role === 'transport' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-slate-50 text-slate-600 border border-slate-100'
                                        }`}>
                                        <ShieldCheck className="h-3 w-3" />
                                        {user.role === 'staff' ? '직원' :
                                            user.role === 'transport' ? '운수업체' : '고객사'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap shadow-none border-none">
                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                        <Building2 className="h-3.5 w-3.5 opacity-50" />
                                        {user.companyName ? (
                                            <span className="text-slate-700 font-bold">{user.companyName}</span>
                                        ) : (
                                            <span className="text-slate-300 italic text-xs">관리부서</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                                        <Calendar className="h-3.5 w-3.5 opacity-50" />
                                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                                    </div>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-right">
                                    {user.username !== 'admin' ? (
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest px-3">System</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-slate-300">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-bold">등록된 사용자가 없습니다.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
