'use client';

import { addUser } from './server-action';
import { UserPlus, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="h-[46px] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold transition-all text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 px-6"
        >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : '계정 생성'}
        </button>
    );
}

export default function AddUserForm() {
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    async function actionHandler(formData: FormData) {
        setMsg(null);
        try {
            const result = await addUser(formData);
            if (result?.success) {
                window.alert('✅ 계정이 성공적으로 생성되었습니다!');
                window.location.reload();
            } else if (result?.error) {
                window.alert('❌ 실패: ' + result.error);
                setMsg({ type: 'error', text: result.error });
            }
        } catch (e: any) {
            window.alert('🚨 시스템 오류: ' + e.message);
        }
    }

    return (
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8 transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <UserPlus className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">신규 계정 추가</h2>
            </div>

            <form action={actionHandler} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">아이디</label>
                    <input
                        name="username"
                        type="text"
                        placeholder="아이디"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">비밀번호</label>
                    <input
                        name="password"
                        type="password"
                        placeholder="비밀번호"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">역할</label>
                    <select
                        name="role"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium appearance-none"
                    >
                        <option value="customer">고객사 (모바일 배차조회)</option>
                        <option value="staff">직원 (당일 용차배차)</option>
                        <option value="transport">운수업체 (기사등록/배차)</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">회사명 (선택)</label>
                    <input
                        name="companyName"
                        type="text"
                        placeholder="회사명"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                    />
                </div>

                <SubmitButton />
            </form>

            {msg && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                    {msg.text}
                </div>
            )}
        </section>
    );
}
