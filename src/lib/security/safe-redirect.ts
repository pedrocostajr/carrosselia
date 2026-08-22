/**
 * Guards against open-redirect abuse of "next" style query params: only a
 * same-origin, relative path is accepted (must start with a single "/",
 * never "//" or "/\" which browsers can interpret as protocol-relative
 * URLs pointing at an attacker-controlled host).
 */
export function safeRedirectPath(path: string | null | undefined, fallback = "/dashboard"): string {
  if (!path) return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  return path;
}
