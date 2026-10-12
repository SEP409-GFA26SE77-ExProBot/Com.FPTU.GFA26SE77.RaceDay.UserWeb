import { NextRequest, NextResponse } from "next/server";
import { Role } from "./interfaces/role";

function mapAppRole(raw: string): string {
    const r = raw.replace(/^ROLE_/i, "").trim().toUpperCase();
    if (!r) return Role.RUNNER;
    if (r === "USER" || r === "CUSTOMER" || r === "MEMBER") return Role.RUNNER;
    return r;
}

const ROLE_PERMISSIONS: Record<string, (Role | string)[] | '*'> = {
    // Bất kỳ user đã login (account mới có thể chưa có cookie role)
    '/profile': '*',
    '/my-registrations': '*',
    '/registered-events': '*',
    '/my-events': '*',
    '/payments': '*',
    '/wallet': '*',
    '/certificates': '*',
    '/disputes': '*',
    '/race-day': '*',
    // Tạo giải: đã login. Chi tiết quản lý giải chỉ qua /organizer/events/{id} (xem regex bên dưới)
    '/events/create': '*',
    '/event-admin': [Role.ADMIN, Role.COORDINATOR],
    '/staff-admin': [Role.ADMIN, Role.COORDINATOR],
    '/scan-qr': [Role.COORDINATOR, Role.STAFF, Role.ADMIN],
    '/register-event': '*',
};

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
        const raw =
            payload.role ||
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'] ||
            payload.roles?.[0] ||
            (Array.isArray(payload.role) ? payload.role[0] : undefined) ||
            payload.userRole ||
            payload.Role;
        const role = Array.isArray(raw) ? raw[0] : raw;
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
    // USER (IAM) / trống → RUNNER
    const role = token
        ? mapAppRole(rawRole || tokenRole || Role.RUNNER)
        : '';

    // Đã login: login/register → home; forgot/reset vẫn mở được
    if (
        token &&
        (pathname === '/login' ||
            pathname.startsWith('/login/') ||
            pathname === '/register' ||
            pathname.startsWith('/register/'))
    ) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    let allowedRoles: (Role | string)[] | '*' | undefined;

    const matchedRoute = Object.keys(ROLE_PERMISSIONS).find((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    if (matchedRoute) {
        allowedRoles = ROLE_PERMISSIONS[matchedRoute];
    } else if (/^\/events\/[^/]+\/(register|payment|confirmation|pending)(\/|$)/.test(pathname)) {
        // Tuyến đăng ký giải chạy cho người dùng đã đăng nhập
        allowedRoles = '*';
    } else if (
        /^\/organizer\/events\/[^/]+\/?$/.test(pathname) ||
        /^\/organizer\/events\/[^/]+\/(setup-map|race-simulation|staff|wallet|payout-history)\/?$/.test(
          pathname
        )
    ) {
        // Chi tiết giải + Setup map + Race simulation — vào từ Giải của tôi
        allowedRoles = '*';
    } else if (pathname === '/organizer' || pathname.startsWith('/organizer/')) {
        // Chặn gõ URL portal organizer (approvals, module prototype, …)
        return NextResponse.redirect(new URL('/403', request.url));
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