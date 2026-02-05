'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from './action';
import { Loader2, Truck } from 'lucide-react';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {pending ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin" /> 로그인 중...
                </>
            ) : (
                '로그인'
            )}
        </button>
    );
}

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        const result = await login(formData);
        if (result?.error) {
            setErrorMessage(result.error);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-2 shadow-lg shadow-blue-500/20">
                        <Truck className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tighter">
                        ndy-dispatchlookup
                    </h1>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">아이디</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="아이디를 입력하세요"
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">비밀번호</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="비밀번호를 입력하세요"
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>

                        {errorMessage && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                                {errorMessage}
                            </div>
                        )}

                        <div className="pt-2">
                            <SubmitButton />
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-500 font-black uppercase tracking-widest">
                    (주) 엔디와이 ndy-dispatchlookup
                </p>
            </div>
        </div>
    );
}
