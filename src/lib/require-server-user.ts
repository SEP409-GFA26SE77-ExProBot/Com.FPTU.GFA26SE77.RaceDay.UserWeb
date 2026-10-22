import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifiedUser } from "./server-auth";
import { mapAppRole } from "./role";
export async function requireServerUser(roles?: string[]) {
  const jar = await cookies();
  const user = await verifiedUser(jar.get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  if (roles && !roles.includes(mapAppRole(user.roleName))) redirect("/403");
  return user;
}
