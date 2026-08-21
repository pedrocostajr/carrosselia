import dns from "node:dns/promises";
import net from "node:net";

/**
 * Blocks SSRF attempts: private/loopback/link-local ranges, cloud metadata
 * IPs, and non-http(s) schemes. Every hostname is resolved and every
 * resulting address is checked - this defeats DNS-rebinding attempts where a
 * hostname resolves to a public IP during validation but a private one is
 * actually used, because we pass the resolved IP (not the hostname) to the
 * fetch call.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
]);

// Cloud metadata endpoints (AWS/GCP/Azure/DigitalOcean all use 169.254.169.254).
const METADATA_IP = "169.254.169.254";

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;

  if (a === 127) return true; // loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local / metadata
  if (a === 0) return true; // "this" network
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1") return true; // loopback
  if (normalized.startsWith("fe80:")) return true; // link-local
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local
  if (normalized.startsWith("::ffff:")) {
    const v4 = normalized.split(":").pop();
    if (v4 && net.isIPv4(v4)) return isPrivateIPv4(v4);
  }
  return false;
}

export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip) || ip === METADATA_IP;
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true;
}

export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfBlockedError";
  }
}

export interface SafeUrlResolution {
  url: URL;
  resolvedIp: string;
}

/**
 * Validates a user-supplied URL is safe to fetch server-side and resolves
 * its hostname, rejecting any address that points to a private, loopback,
 * link-local, or cloud-metadata range.
 */
export async function resolveSafeUrl(rawUrl: string): Promise<SafeUrlResolution> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError("URL inválida.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfBlockedError("Apenas URLs HTTP ou HTTPS são permitidas.");
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new SsrfBlockedError("Este endereço não pode ser acessado.");
  }

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new SsrfBlockedError("Este endereço não pode ser acessado.");
    }
    return { url, resolvedIp: hostname };
  }

  let addresses: string[];
  try {
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    addresses = records.map((r) => r.address);
  } catch {
    throw new SsrfBlockedError("Não foi possível resolver este endereço.");
  }

  if (addresses.length === 0) {
    throw new SsrfBlockedError("Não foi possível resolver este endereço.");
  }

  for (const address of addresses) {
    if (isBlockedIp(address)) {
      throw new SsrfBlockedError("Este endereço não pode ser acessado.");
    }
  }

  return { url, resolvedIp: addresses[0] };
}
