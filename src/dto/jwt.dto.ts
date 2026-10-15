import { z } from "zod";

// Tên claim kiểu .NET (key là URL nên phải khai báo bằng const)
const CLAIM_NAMEID =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const CLAIM_NAME =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
const CLAIM_ROLE_MS =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

// role/aud có thể là string hoặc mảng string tùy backend
const stringOrArray = z.union([z.string(), z.array(z.string())]);

export const jwtPayloadSchema = z
  .object({
    sub: z.string().optional(),
    email: z.string().optional(),
    preferred_username: z.string().optional(),
    username: z.string().optional(),
    [CLAIM_NAMEID]: z.string().optional(),
    [CLAIM_NAME]: z.string().optional(),
    [CLAIM_ROLE_MS]: stringOrArray.optional(),
    role: stringOrArray.optional(),
    exp: z.number(),
    iss: z.string().optional(),
    aud: stringOrArray.optional(),
  })
  .passthrough(); // giữ lại các claim khác (roles, userRole, ...) không khai báo

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;