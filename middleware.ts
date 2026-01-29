import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // 모바일 배차 페이지 보호
    if (request.nextUrl.pathname.startsWith('/mobile')) {
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
    matcher: ['/mobile/:path*'],
};
