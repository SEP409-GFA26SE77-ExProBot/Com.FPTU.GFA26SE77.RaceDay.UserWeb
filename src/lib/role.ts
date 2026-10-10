import { Role } from "@/interfaces/role";

/**
 * BE/IAM đôi khi trả "USER" cho account runner — map về Role app.
 */
export function mapAppRole(raw: string | null | undefined): string {
  if (!raw || !String(raw).trim()) return Role.RUNNER;
  const r = String(raw)
    .replace(/^ROLE_/i, "")
    .trim()
    .toUpperCase();
  if (r === "USER" || r === "CUSTOMER" || r === "MEMBER") return Role.RUNNER;
  return r;
}

export function isRunnerRole(role: string | null | undefined): boolean {
  const r = mapAppRole(role);
  return r === Role.RUNNER;
}
