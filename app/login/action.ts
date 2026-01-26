'use server';

import { redirect } from 'next/navigation';
import { setSession } from '../../lib/auth';

export async function login(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Hardcoded authentication for MVP/Test
    // 1. 하회 (User)
    if (username === 'has' && password === '1234') {
        await setSession({ username: 'has', companyName: '하회' });
    }
    // 2. 대상 (User) -> das
    else if (username === 'das' && password === '1234') {
        await setSession({ username: 'das', companyName: '대상' });
    }
    // 3. Admin (Superuser)
    else if (username === 'admin' && password === '1234') {
        await setSession({ username: 'admin', companyName: null });
    }
    else {
        return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }

    redirect('/mobile/dispatch');
}
