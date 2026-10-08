import { NextRequest, NextResponse } from "next/server";
import { ALL_ROLES, Role } from "./interfaces/role";

const ROLE_PERMISSIONS: Record<string, (Role | string)[] | '*'> = {
    '/profile': ALL_ROLES,
    '/event-admin': [Role.ADMIN, Role.COORDINATOR],
    '/staff-admin': [Role.ADMIN, Role.COORDINATOR],
    '/scan-qr': [Role.COORDINATOR, Role.STAFF],
    '/register-event': '*',
};

const authRoutes = ['/login', '/register', '/forgot-password'];

function extractRoleFromJwt(token?: string): string | undefined {
    if (!token) return undefined;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return undefined;
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {
            base64 += '=';
        }
        let jsonStr = '';
        if (typeof atob === 'function') {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            jsonStr = new TextDecoder('utf-8').decode(bytes);
        } else if (typeof Buffer !== 'undefined') {
            jsonStr = Buffer.from(base64, 'base64').toString('utf8');
        } else {
            return undefined;
        }
        const payload = JSON.parse(jsonStr);
        const role =
            payload.role ||
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'] ||
            payload.roles?.[0] ||
            (Array.isArray(payload.role) ? payload.role[0] : undefined) ||
            payload.userRole ||
            payload.Role;
        if (typeof role === 'string') {
            return role.replace(/^ROLE_/i, '').trim().toUpperCase();
        }
    } catch {
        return undefined;
    }
    return undefined;
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('access_token')?.value;
    const rawRole = request.cookies.get('role')?.value;
    const tokenRole = extractRoleFromJwt(token);
    const role = (rawRole || tokenRole || '').replace(/^ROLE_/i, '').trim().toUpperCase();

    const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

    // Đã có token mà vào trang login/register -> đá sang home
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    let allowedRoles: (Role | string)[] | '*' | undefined;

    const matchedRoute = Object.keys(ROLE_PERMISSIONS).find((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    if (matchedRoute) {
        allowedRoles = ROLE_PERMISSIONS[matchedRoute];
    } else if (/^\/events\/[^/]+\/(register|payment|confirmation)(\/|$)/.test(pathname)) {
        // Tuyến đăng ký giải chạy (/events/:id/register, payment, confirmation) cho người dùng đã đăng nhập
        allowedRoles = '*';
    }

    if (allowedRoles) {
        // 2.1. Chưa đăng nhập
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // 2.2. Đã đăng nhập nhưng Role không nằm trong danh sách cho phép
        const isAllowed =
            allowedRoles === '*' ||
            (Boolean(role) && allowedRoles.some((allowed) => allowed.toString().toUpperCase() === role));

        if (!isAllowed) {
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