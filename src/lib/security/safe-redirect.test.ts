import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/security/safe-redirect";

describe("safeRedirectPath", () => {
  it("accepts a plain relative path", () => {
    expect(safeRedirectPath("/dashboard/marca")).toBe("/dashboard/marca");
  });

  it("falls back for missing input", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined, "/entrar")).toBe("/entrar");
  });

  it("rejects protocol-relative URLs (open redirect)", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
  });

  it("rejects absolute URLs to other origins", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("http://evil.com/phish")).toBe("/dashboard");
  });

  it("rejects backslash tricks", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
  });
});
