import { NextRequest, NextResponse } from "next/server";
import { Role } from "./interfaces/role";
import { mapAppRole } from "./lib/role";
import { extractRoleFromToken } from "./lib/jwt";

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
    '/register-event': '*',
};

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // Chuẩn cookie: access_token (fallback accessToken phiên cũ)
    const token =
        request.cookies.get('access_token')?.value ||
        request.cookies.get('accessToken')?.value;
    const rawRole = request.cookies.get('role')?.value;
    const tokenRole = extractRoleFromToken(token);
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
    } else if (/^\/events\/create\/package-return(\/|$)/.test(pathname)) {
        // Return URL sau thanh toán gói tổ chức
        allowedRoles = '*';
    } else if (pathname === '/organizer' || pathname.startsWith('/organizer/')) {
        // Khớp BE: /api/v1/event/organizer dùng PublicUser (mọi user đã login),
        // không bắt cookie role ORGANIZER — ownership check ở API.
        // (Mua gói tạo draft trước khi JWT/cookie kịp có ORGANIZER.)
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
            (Boolean(role) &&
                allowedRoles.some(
                    (allowed) =>
                        allowed.toString().toUpperCase() === role.toUpperCase()
                ));

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