'use server';

import { redirect } from 'next/navigation';
import { setSession } from '../../lib/auth';
import { authDb as prisma } from '../../lib/db';
import bcrypt from 'bcryptjs';

export async function login(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { error: '아이디와 비밀번호를 모두 입력해 주세요.' };
    }

    try {
        // 1. DB에서 사용자 조회
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
        }

        // 2. 비밀번호 검증 (bcrypt 해싱 비교)
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        // [참고] 초기 전환 단계를 위해 평문 비교도 허용하고 싶다면 아래 주석 처리를 활용할 수 있습니다.
        // const isPasswordMatch = (password === user.password) || await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
        }

        // 3. 세션 설정
        await setSession({
            username: user.username,
            companyName: user.companyName
        });

    } catch (error) {
        console.error('[Login Error]', error);
        return { error: '로그인 도중 서버 오류가 발생했습니다.' };
    }

    redirect('/mobile/dispatch');
}
