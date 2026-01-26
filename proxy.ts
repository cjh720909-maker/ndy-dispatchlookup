import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    // Mobile dispatch protection
    if (request.nextUrl.pathname.startsWith('/mobile')) {
        const session = request.cookies.get('logistics_session');

        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/mobile/:path*'],
};
