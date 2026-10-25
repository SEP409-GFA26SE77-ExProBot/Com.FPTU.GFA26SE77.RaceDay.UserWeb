import { NextRequest, NextResponse } from "next/server";
import { clearSession, sameOriginMutation } from "@/lib/server-auth";
export async function POST(request: NextRequest) {
  if (!sameOriginMutation(request)) return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  const response = NextResponse.json({ message: "Signed out" });
  response.headers.set("Cache-Control", "no-store");
  clearSession(response);
  return response;
}
