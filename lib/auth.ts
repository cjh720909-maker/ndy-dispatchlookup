import { cookies } from 'next/headers';

export async function setSession(data: { username: string; companyName: string | null }) {
    const cookieStore = await cookies();
    cookieStore.set('logistics_session', JSON.stringify(data), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('logistics_session');
    if (!session) return null;
    try {
        return JSON.parse(session.value);
    } catch {
        return null;
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('logistics_session');
}
