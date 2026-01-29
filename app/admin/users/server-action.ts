'use server';

import { authDb } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

/**
 * 모든 사용자 목록을 가져옵니다. (아이디 기준 오름차순)
 */
export async function getUsers() {
    try {
        const users = await authDb.user.findMany({
            orderBy: { username: 'asc' },
            select: {
                id: true,
                username: true,
                companyName: true,
                createdAt: true,
            }
        });
        return { data: users };
    } catch (error) {
        console.error('[getUsers Error]', error);
        return { error: '사용자 목록을 불러오는 중 오류가 발생했습니다.' };
    }
}

/**
 * 신규 사용자를 생성합니다.
 */
export async function addUser(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const companyName = formData.get('companyName') as string;

    if (!username || !password) {
        return { error: '아이디와 비밀번호를 모두 입력해 주세요.' };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await authDb.user.create({
            data: {
                username,
                password: hashedPassword,
                companyName: companyName || null,
            }
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: '이미 존재하는 아이디입니다.' };
        }
        console.error('[addUser Error]', error);
        return { error: '사용자 생성 중 오류가 발생했습니다.' };
    }
}

/**
 * 사용자를 삭제합니다.
 */
export async function deleteUser(id: number) {
    try {
        // admin 계정은 삭제 방지 (필요 시)
        const user = await authDb.user.findUnique({ where: { id } });
        if (user?.username === 'admin') {
            return { error: '기본 관리자 계정은 삭제할 수 없습니다.' };
        }

        await authDb.user.delete({ where: { id } });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('[deleteUser Error]', error);
        return { error: '사용자 삭제 중 오류가 발생했습니다.' };
    }
}
