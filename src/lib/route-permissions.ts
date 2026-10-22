import { Role } from "@/interfaces/role";

const authenticated = ["/profile", "/my-registrations", "/registered-events", "/my-events", "/payments", "/wallet", "/certificates", "/disputes", "/race-day", "/events/create", "/register-event"];
export function routePermission(path: string): string[] | "*" | null {
  if (path === "/organizer" || path.startsWith("/organizer/")) return [Role.ORGANIZER];
  if (authenticated.some((base) => path === base || path.startsWith(base + "/"))) return "*";
  if (/^\/events\/[^/]+\/(register|payment|confirmation|pending)(\/|$)/.test(path)) return "*";
  return null;
}
