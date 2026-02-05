import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 보호된 경로 확인
    if (request.nextUrl.pathname.startsWith('/mobile') || request.nextUrl.pathname.startsWith('/daily-dispatch')) {
        const session = request.cookies.get('logistics_session');

        if (!session) {
            // 세션이 없으면 로그인 페이지로 리다이렉트
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
    matcher: ['/mobile/:path*', '/daily-dispatch/:path*'],
};
