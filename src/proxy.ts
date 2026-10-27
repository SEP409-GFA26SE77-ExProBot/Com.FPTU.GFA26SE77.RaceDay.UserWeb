import { NextRequest, NextResponse } from "next/server";
import { userForRequest } from "@/lib/server-auth";
import { routePermission } from "@/lib/route-permissions";
import { mapAppRole } from "@/lib/role";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const permission = routePermission(pathname);
  const authPage = ["/login", "/register"].includes(pathname);
  if (permission === null && !authPage) return NextResponse.next();
  try {
    const user = await userForRequest(request);
    if (!user && permission !== null) {
      const login = new URL("/login", request.url);
      login.searchParams.set("from", pathname + search);
      return NextResponse.redirect(login);
    }
    if (user && authPage) return NextResponse.redirect(new URL("/", request.url));
    if (
      user &&
      permission !== null &&
      permission !== "*" &&
      !permission.includes(mapAppRole(user.roleName))
    ) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
    return NextResponse.next();
  } catch {
    return new NextResponse("Authentication service unavailable", { status: 503 });
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
