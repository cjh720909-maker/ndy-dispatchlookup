'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from './server-action';
import { LockKeyhole, KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsPending(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const result = await updatePassword(formData);

        setIsPending(false);

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else if (result.success) {
            setMessage({ type: 'success', text: result.success });
            // 폼 초기화
            (event.target as HTMLFormElement).reset();
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight">계정 설정</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-6 space-y-8">
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20">
                            <LockKeyhole className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">비밀번호 변경</h2>
                        <p className="text-slate-400 text-xs font-medium mt-1">보안을 위해 비밀번호를 정기적으로 변경해 주세요.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {message && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                                <p className="text-sm font-bold">{message.text}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">현재 비밀번호</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        name="currentPassword"
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        placeholder="현재 비밀번호 입력"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">새 비밀번호</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        name="newPassword"
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        placeholder="새 비밀번호 입력"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">새 비밀번호 확인</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        placeholder="새 비밀번호 재입력"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    변경 중...
                                </>
                            ) : (
                                '비밀번호 변경하기'
                            )}
                        </button>
                    </form>
                </section>

                <div className="text-center">
                    <p className="text-slate-400 text-xs font-medium">문제가 발생했나요? 관리자에게 문의하세요.</p>
                </div>
            </main>
        </div>
    );
}
