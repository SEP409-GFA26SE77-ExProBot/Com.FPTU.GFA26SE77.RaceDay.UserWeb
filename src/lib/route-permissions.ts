/** Routes yêu cầu đã đăng nhập (mọi role). */
const authenticated = [
  "/profile",
  "/my-registrations",
  "/registered-events",
  "/my-events",
  "/payments",
  "/wallet",
  "/certificates",
  "/disputes",
  "/race-day",
  "/events/create",
  "/register-event",
];

/**
 * null = public (không gate)
 * "*" = bất kỳ user đã login
 * Role[] = phải thuộc một trong các role
 *
 * Organizer paths: "*" — khớp BE PublicUser + ownership ở API
 * (runner mua gói tạo draft trước khi JWT kịp có ORGANIZER).
 */
export function routePermission(path: string): string[] | "*" | null {
  if (path === "/organizer" || path.startsWith("/organizer/")) return "*";
  if (authenticated.some((base) => path === base || path.startsWith(`${base}/`))) {
    return "*";
  }
  if (/^\/events\/[^/]+\/(register|payment|confirmation|pending)(\/|$)/.test(path)) {
    return "*";
  }
  if (/^\/events\/create\/package-return(\/|$)/.test(path)) {
    return "*";
  }
  return null;
}
