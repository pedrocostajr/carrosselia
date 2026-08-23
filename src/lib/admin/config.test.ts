import { describe, expect, it } from "vitest";

import { isAdminEmail, ADMIN_EMAIL } from "@/lib/admin/config";

describe("isAdminEmail", () => {
  it("matches the fixed admin email", () => {
    expect(isAdminEmail(ADMIN_EMAIL)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAdminEmail(ADMIN_EMAIL.toUpperCase())).toBe(true);
  });

  it("rejects any other email", () => {
    expect(isAdminEmail("someone.else@gmail.com")).toBe(false);
  });

  it("rejects null/undefined without throwing", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});
