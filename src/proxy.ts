import { NextRequest, NextResponse } from "next/server";
import { Role } from "./interfaces/role";

const ROLE_PERMISSIONS: Record<string, string[]> = {
    '/profile': [Role.ADMIN, Role.PHOTOGRAPHER, Role.RUNNER, Role.ORGANIZER, Role.STAFF, Role.COORDINATOR],
    '/event-admin': [Role.ADMIN, Role.COORDINATOR],
    '/staff-admin': [Role.ADMIN, Role.COORDINATOR],
    '/scan-qr': [Role.COORDINATOR, Role.STAFF],
    '/register-event': [Role.RUNNER]
};

const authRoutes = ['/login', '/register', '/forgot-password'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('access_token')?.value;
    const role = request.cookies.get('role')?.value;

    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Đã có token mà vào trang login/register -> đá sang dashboard
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const matchedRoute = Object.keys(ROLE_PERMISSIONS).find((route) =>
        pathname.startsWith(route)
    );

    if (matchedRoute) {
        // 2.1. Chưa đăng nhập
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // 2.2. Đã đăng nhập nhưng Role không nằm trong danh sách cho phép
        const allowedRoles = ROLE_PERMISSIONS[matchedRoute];
        if (!role || !allowedRoles.includes(role)) {
            // Đá sang trang báo lỗi 403 Forbidden hoặc về trang chủ của role đó
            return NextResponse.redirect(new URL('/403', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|.*\\.png$).*)',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}