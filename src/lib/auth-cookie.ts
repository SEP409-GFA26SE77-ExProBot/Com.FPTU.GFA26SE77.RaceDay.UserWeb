import Cookies from "js-cookie";

/** Chuẩn: `access_token`. Fallback `accessToken` (cookie cũ). */
export function getAccessToken(): string {
  return Cookies.get("access_token") || Cookies.get("accessToken") || "";
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}
