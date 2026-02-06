'use client';

import { useState, useEffect } from 'react';
import { deleteUser, resetUserPassword } from './server-action';
import { Trash2, ShieldCheck, User, Building2, Calendar, Users, RotateCcw, Loader2 } from 'lucide-react';

interface UserData {
    id: number;
    username: string;
    role: string;
    companyName: string | null;
    createdAt: Date;
}

export default function UserList({ initialUsers }: { initialUsers: any[] }) {
    const [users, setUsers] = useState<UserData[]>(initialUsers);
    const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});

    // 모달 상태
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'delete' | 'reset';
        id: number;
        username: string;
    }>({ isOpen: false, type: 'delete', id: 0, username: '' });

    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    async function executeDelete(id: number) {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setLoadingIds(prev => ({ ...prev, [id]: true }));
        const originalUsers = [...users];
        setUsers(users.filter(u => u.id !== id));

        try {
            const result = await deleteUser(id);
            if (result?.error) {
                alert(result.error);
                setUsers(originalUsers);
            }
        } catch (e: any) {
            alert('🚨 삭제 중 시스템 오류: ' + e.message);
            setUsers(originalUsers);
        } finally {
            setLoadingIds(prev => ({ ...prev, [id]: false }));
        }
    }

    async function executeReset(id: number, username: string) {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setLoadingIds(prev => ({ ...prev, [id]: true }));
        try {
            const result = await resetUserPassword(id);
            if (result?.error) {
                alert(result.error);
            } else {
                alert('비밀번호가 1234로 초기화되었습니다.');
            }
        } catch (e: any) {
            alert('🚨 초기화 중 시스템 오류: ' + e.message);
        } finally {
            setLoadingIds(prev => ({ ...prev, [id]: false }));
        }
    }

    return (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md relative">
            {/* 커스텀 컨펌 모달 */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${confirmModal.type === 'delete' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                            {confirmModal.type === 'delete' ? <Trash2 className="h-8 w-8" /> : <RotateCcw className="h-8 w-8" />}
                        </div>
                        <h3 className="text-xl font-black text-slate-800 text-center mb-2">
                            {confirmModal.type === 'delete' ? '계정 삭제' : '비밀번호 초기화'}
                        </h3>
                        <p className="text-slate-500 text-center text-sm font-medium mb-8 leading-relaxed">
                            {confirmModal.type === 'delete' ?
                                <><span className="text-red-600 font-bold">[{confirmModal.username}]</span> 계정을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</> :
                                <><span className="text-amber-600 font-bold">[{confirmModal.username}]</span> 계정의 비밀번호를 <span className="font-bold underline">1234</span>로 초기화하시겠습니까?</>
                            }
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => confirmModal.type === 'delete' ? executeDelete(confirmModal.id) : executeReset(confirmModal.id, confirmModal.username)}
                                className={`py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'delete' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                        user.role === 'staff' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            user.role === 'transport' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-slate-50 text-slate-600 border border-slate-100'
                                        }`}>
                                        <ShieldCheck className="h-3 w-3" />
                                        {user.role === 'admin' ? '시스템 관리자' :
                                            user.role === 'staff' ? '직원' :
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
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setConfirmModal({ isOpen: true, type: 'reset', id: user.id, username: user.username })}
                                                disabled={loadingIds[user.id]}
                                                className={`p-2.5 rounded-xl transition-all active:scale-95 ${loadingIds[user.id] ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
                                                title="비밀번호 초기화 (1234)"
                                            >
                                                {loadingIds[user.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
                                            </button>
                                            <button
                                                onClick={() => setConfirmModal({ isOpen: true, type: 'delete', id: user.id, username: user.username })}
                                                disabled={loadingIds[user.id]}
                                                className={`p-2.5 rounded-xl transition-all active:scale-95 ${loadingIds[user.id] ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                                                title="계정 삭제"
                                            >
                                                {loadingIds[user.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                            </button>
                                        </div>
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
