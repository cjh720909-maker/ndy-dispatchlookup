'use server';

import { authDb } from '../../lib/db';
import { getSession } from '../../lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

/**
 * 현재 로그인한 사용자의 비밀번호를 업데이트합니다.
 */
export async function updatePassword(formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    const session = await getSession();
    if (!session || !session.username) {
        return { error: '로그인이 필요합니다.' };
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: '모든 필드를 입력해 주세요.' };
    }

    if (newPassword !== confirmPassword) {
        return { error: '새 비밀번호가 일치하지 않습니다.' };
    }

    try {
        // 1. 현재 사용자 정보 로드
        const user = await authDb.user.findUnique({
            where: { username: session.username }
        });

        if (!user) {
            return { error: '사용자를 찾을 수 없습니다.' };
        }

        // 2. 현재 비밀번호 확인
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return { error: '현재 비밀번호가 올바르지 않습니다.' };
        }

        // 3. 새 비밀번호 해싱 및 업데이트
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await authDb.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword }
        });

        return { success: '비밀번호가 성공적으로 변경되었습니다.' };
    } catch (error) {
        console.error('[updatePassword Error]', error);
        return { error: '비밀번호 변경 중 오류가 발생했습니다.' };
    }
}
