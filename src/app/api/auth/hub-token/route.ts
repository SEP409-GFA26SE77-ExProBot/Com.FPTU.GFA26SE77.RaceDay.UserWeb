import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/server-auth";

/**
 * SignalR cần JWT trên query/header; cookie session là httpOnly nên
 * browser không đọc được. Route same-origin này trả token cho hub client.
 */
export async function GET() {
  const jar = await cookies();
  const accessToken = jar.get(SESSION_COOKIE)?.value;
  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ accessToken });
}
