'use server';

import { authDb } from '../../../lib/db';
import { getSession } from '../../../lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

/**
 * 모든 사용자 목록을 가져옵니다. (아이디 기준 오름차순)
 */
export async function getUsers() {
    const session = await getSession();
    if (!session || (session.username !== 'admin' && session.role !== 'admin')) {
        return { error: '관리자 권한이 필요합니다.' };
    }
    try {
        const users = await authDb.user.findMany({
            orderBy: { username: 'asc' },
            select: {
                id: true,
                username: true,
                role: true,
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
    const session = await getSession();
    if (!session || (session.username !== 'admin' && session.role !== 'admin')) {
        return { error: '관리자 권한이 필요합니다.' };
    }

    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    const companyName = formData.get('companyName') as string;

    console.log(`[addUser] Attempting to create user: ${username}, Role: ${role}`);

    if (!username || !password) {
        console.warn('[addUser] Missing username or password');
        return { error: '아이디와 비밀번호를 모두 입력해 주세요.' };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('[addUser] Password hashed successfully');

        const finalRole = companyName === '관리자' ? 'admin' : (role || 'customer');

        const newUser = await authDb.user.create({
            data: {
                username,
                password: hashedPassword,
                role: finalRole,
                companyName: companyName || null,
            }
        });

        console.log(`[addUser] User created successfully: ID ${newUser.id}`);

        try {
            revalidatePath('/admin/users');
        } catch (revalidateError) {
            console.warn('[addUser] revalidatePath failed (can be ignored in dev):', revalidateError);
        }

        return { success: true };
    } catch (error: any) {
        console.error('[addUser Exception]', error);

        if (error.code === 'P2002') {
            return { error: '이미 존재하는 아이디입니다.' };
        }

        return {
            error: `사용자 생성 중 오류가 발생했습니다: ${error.message || '알 수 없는 DB 오류'}`
        };
    }
}

/**
 * 사용자를 삭제합니다.
 */
export async function deleteUser(id: number) {
    const session = await getSession();
    console.log(`[deleteUser] Action called by session: ${JSON.stringify(session)}, ID: ${id}`);

    if (!session || (session.username !== 'admin' && session.role !== 'admin')) {
        const sessionInfo = session ? ` (User: ${session.username}, Role: ${session.role})` : ' (No Session Found)';
        console.log(`[deleteUser] Permission denied.${sessionInfo}`);
        return { error: `관리자 권한이 필요합니다.${sessionInfo}` };
    }

    try {
        const targetId = Number(id);
        if (isNaN(targetId)) throw new Error('Invalid User ID');

        const user = await authDb.user.findUnique({ where: { id: targetId } });
        if (!user) {
            console.log(`[deleteUser] User not found with ID: ${targetId}`);
            return { error: '사용자를 찾을 수 없습니다.' };
        }

        if (user.username === 'admin') {
            console.log('[deleteUser] Attempted to delete admin account');
            return { error: '기본 관리자 계정은 삭제할 수 없습니다.' };
        }

        await authDb.user.delete({ where: { id: targetId } });
        console.log(`[deleteUser] Successfully deleted user: ${user.username}`);

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.log(`[deleteUser Error] ${error.message}`);
        return { error: `사용자 삭제 중 오류가 발생했습니다: ${error.message}` };
    }
}

/**
 * 사용자의 비밀번호를 '1234'로 초기화합니다.
 */
export async function resetUserPassword(id: number) {
    const session = await getSession();
    console.log(`[resetUserPassword] Starting reset for User ID: ${id}. Session: ${JSON.stringify(session)}`);

    if (!session || (session.username !== 'admin' && session.role !== 'admin')) {
        const sessionInfo = session ? ` (User: ${session.username}, Role: ${session.role})` : ' (No Session Found)';
        console.log(`[resetUserPassword] Permission denied.${sessionInfo}`);
        return { error: `관리자 권한이 필요합니다.${sessionInfo}` };
    }

    try {
        const targetId = Number(id);
        if (isNaN(targetId)) throw new Error('Invalid User ID');

        const user = await authDb.user.findUnique({ where: { id: targetId } });
        if (!user) {
            console.log(`[resetUserPassword] User not found with ID: ${targetId}`);
            return { error: '사용자를 찾을 수 없습니다.' };
        }

        const hashedPassword = await bcrypt.hash('1234', 10);
        console.log('[resetUserPassword] New password hashed successfully');

        const updatedUser = await authDb.user.update({
            where: { id: targetId },
            data: { password: hashedPassword }
        });
        console.log(`[resetUserPassword] Successfully reset password for: ${updatedUser.username}`);

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.log(`[resetUserPassword Error] ${error.message}`);
        return { error: `비밀번호 초기화 중 오류가 발생했습니다: ${error.message}` };
    }
}
