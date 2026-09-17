/**
 * Which pages each role may open.
 *
 * This is the single source of truth for both halves of access control: the
 * sidebar, bottom bar and search palette use it to decide what to *show*, and
 * the root layout uses it to decide what to *render*. Keeping one table means a
 * page hidden from a role is also blocked for that role — previously the two
 * lived apart, and hiding a link did nothing to stop someone typing the URL.
 */

export type UserRole = "Admin" | "Accountant" | "Staff" | string;

/** Pages an Accountant may not open. Everything else is allowed. */
const ACCOUNTANT_BLOCKED = new Set(["/", "/owners", "/reports", "/settings"]);

/** The only pages Staff may open. Everything else is blocked. */
const STAFF_ALLOWED = new Set(["/rentals", "/payments", "/returns"]);

/** "/customers/" and "/customers" are the same page. */
function normalizePath(pathname: string): string {
  const path = (pathname || "/").split(/[?#]/)[0];
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : "/";
}

export function canAccessPath(pathname: string, role: UserRole): boolean {
  const path = normalizePath(pathname);

  if (role === "Admin") return true;
  if (role === "Accountant") return !ACCOUNTANT_BLOCKED.has(path);
  // Staff is an allow-list, so a page added later stays closed to Staff until
  // someone deliberately opens it.
  if (role === "Staff") return STAFF_ALLOWED.has(path);

  // Unknown or missing role: never expose Settings.
  return path !== "/settings";
}

/** Where to send a role that lands on a page it may not open. */
export function getHomePathForRole(role: UserRole): string {
  return role === "Staff" || role === "Accountant" ? "/rentals" : "/";
}

export function getStoredRole(): UserRole {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("medirent-user-role") || "";
  } catch {
    return "";
  }
}
