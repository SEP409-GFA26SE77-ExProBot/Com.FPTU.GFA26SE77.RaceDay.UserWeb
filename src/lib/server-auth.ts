import { NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "@/dto/auth.dto";
import { BASE_URL } from "@/config/global-config";

export const SESSION_COOKIE = "raceday_user_session";
export const LEGACY_COOKIES = ["jwt", "accessToken", "access_token", "role", "username", "userId", "user_id", "avatar_url", "raceday_role"];
export const backendOrigin = () => (process.env.NEXT_PUBLIC_API_URL || BASE_URL).replace(new RegExp("/$"), "");
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

export function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  for (const name of LEGACY_COOKIES) response.cookies.set(name, "", { path: "/", maxAge: 0 });
}

export async function verifiedUser(token?: string): Promise<AuthUser | null> {
  if (!token) return null;
  const response = await fetch(backendOrigin() + "/api/v1/iam/me", {
    headers: { Authorization: "Bearer " + token }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Authentication service unavailable");
  return response.json();
}

export async function userForRequest(request: NextRequest) {
  return verifiedUser(request.cookies.get(SESSION_COOKIE)?.value);
}

export function sameOriginMutation(request: NextRequest) {
  const origin = process.env.AUTH_APP_ORIGIN || request.nextUrl.origin;
  return request.headers.get("origin") === origin && request.headers.get("sec-fetch-site") !== "cross-site";
}
