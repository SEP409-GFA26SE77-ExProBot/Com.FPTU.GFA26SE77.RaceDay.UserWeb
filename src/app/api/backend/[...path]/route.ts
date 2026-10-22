import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, LEGACY_COOKIES, backendOrigin, cookieOptions, clearSession, sameOriginMutation, verifiedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: Context) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !sameOriginMutation(request)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }
  const { path } = await context.params;
  if (path.some((segment) => !segment || segment === "." || segment === ".." || /[\\/:%?#]/.test(segment))) {
    return NextResponse.json({ message: "Invalid API path" }, { status: 400 });
  }
  const endpoint = "/" + path.join("/");
  if (!(endpoint.startsWith("/api/v1/") || endpoint.startsWith("/admin/v1/"))) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const isLogin = endpoint.toLowerCase() === "/api/v1/iam/auth/login";
  if (isLogin && request.method !== "POST") return new NextResponse(null, { status: 405 });
  const headers = new Headers();
  for (const name of ["content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && !isLogin) headers.set("Authorization", "Bearer " + token);
  try {
    const upstream = await fetch(backendOrigin() + endpoint + request.nextUrl.search, {
      method: request.method, headers, cache: "no-store", redirect: "manual",
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      signal: AbortSignal.timeout(60000),
    });
    if (isLogin && upstream.ok) {
      const result = await upstream.json();
      if (!result.accessToken || !(await verifiedUser(result.accessToken))) {
        return NextResponse.json({ message: "Unable to establish authenticated session" }, { status: 401 });
      }
      // The backend has validated this JWT. Only its expiration is read here.
      const payload = JSON.parse(Buffer.from(result.accessToken.split(".")[1], "base64url").toString("utf8"));
      if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) {
        return NextResponse.json({ message: "Session expired" }, { status: 401 });
      }
      const response = NextResponse.json({ mustChangePassword: Boolean(result.mustChangePassword) });
      response.cookies.set(SESSION_COOKIE, result.accessToken, { ...cookieOptions, expires: new Date(payload.exp * 1000) });
      for (const name of LEGACY_COOKIES) response.cookies.set(name, "", { path: "/", maxAge: 0 });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    // Do not forward gateway redirects or cookies to the browser.
    if (upstream.status >= 300 && upstream.status < 400) return NextResponse.json({ message: "Unexpected API redirect" }, { status: 502 });
    const response = new NextResponse(upstream.body, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
    for (const name of ["content-type", "content-disposition"]) {
      const value = upstream.headers.get(name);
      if (value) response.headers.set(name, value);
    }
    if (upstream.status === 401 && !isLogin) clearSession(response);
    return response;
  } catch {
    return NextResponse.json({ message: "Backend temporarily unavailable" }, { status: 502 });
  }
}
export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE, forward as HEAD };
