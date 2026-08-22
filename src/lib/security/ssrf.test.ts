import { describe, expect, it } from "vitest";

import { isBlockedIp, resolveSafeUrl, SsrfBlockedError } from "@/lib/security/ssrf";

describe("isBlockedIp", () => {
  it("blocks IPv4 loopback and private ranges", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.0.0.5")).toBe(true);
    expect(isBlockedIp("172.16.0.1")).toBe(true);
    expect(isBlockedIp("172.31.255.255")).toBe(true);
    expect(isBlockedIp("192.168.1.1")).toBe(true);
  });

  it("blocks the cloud metadata address", () => {
    expect(isBlockedIp("169.254.169.254")).toBe(true);
  });

  it("blocks IPv6 loopback and unique-local ranges", () => {
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("fc00::1")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
  });

  it("allows plausible public IPv4 addresses", () => {
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("93.184.216.34")).toBe(false);
  });
});

describe("resolveSafeUrl", () => {
  it("rejects non-http(s) protocols", async () => {
    await expect(resolveSafeUrl("ftp://example.com")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(resolveSafeUrl("file:///etc/passwd")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("rejects localhost by hostname", async () => {
    await expect(resolveSafeUrl("http://localhost:3000")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("rejects invalid URLs", async () => {
    await expect(resolveSafeUrl("not-a-url")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("rejects direct private IP literals", async () => {
    await expect(resolveSafeUrl("http://127.0.0.1/admin")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(resolveSafeUrl("http://169.254.169.254/latest/meta-data")).rejects.toBeInstanceOf(
      SsrfBlockedError
    );
  });
});
