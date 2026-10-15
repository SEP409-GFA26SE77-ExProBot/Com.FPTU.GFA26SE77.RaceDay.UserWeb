import { JwtPayload, jwtPayloadSchema } from "@/dto/jwt.dto";

export function extractRoleFromToken(token?: string): string | undefined {
  if (!token) return undefined;
  try {
    const payload = parseJwt(token);
    if (!payload) return undefined;
    return (
      normalizeRole(payload.role) ||
      normalizeRole(
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
      ) ||
      normalizeRole(
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"],
      )
    );
  } catch {
    return undefined;
  }
}

export function extractExpirationFromToken(token?: string): number | undefined {
  if (!token) return undefined;
  try {
    const payload = parseJwt(token);
    if (!payload) return undefined;
    return payload.exp;
  } catch {
    return undefined;
  }
}

export function normalizeRole(raw: unknown): string | undefined {
  if (Array.isArray(raw) && raw.length > 0) return normalizeRole(raw[0]);
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  return raw
    .replace(/^ROLE_/i, "")
    .trim()
    .toUpperCase();
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  // Hỗ trợ UTF-8 (tên tiếng Việt)
  return new TextDecoder().decode(
    Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)),
  );
}

/** Giải mã thô, chưa kiểm tra cấu trúc */
export function jwtDecode(token?: string): unknown {
  if (!token) return undefined;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return undefined;
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return undefined;
  }
}

/** Giải mã + validate bằng zod. Trả về undefined nếu token sai cấu trúc */
export function parseJwt(token?: string): JwtPayload | undefined {
  const raw = jwtDecode(token);
  if (raw === undefined) return undefined;

  const result = jwtPayloadSchema.safeParse(raw);
  if (!result.success) {
    console.error("JWT payload không hợp lệ:", result.error.issues);
    return undefined;
  }
  return result.data;
}
