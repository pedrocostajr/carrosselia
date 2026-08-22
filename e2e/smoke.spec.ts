import { test, expect } from "@playwright/test";

/**
 * These smoke tests cover the routes and flows that work without a live
 * Supabase project (which this sandbox does not have configured). Once
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set to a real
 * project, extend this suite with the full authenticated journey described
 * in README.md ("Fluxo essencial para expandir os testes E2E").
 */

test("landing page shows the product pitch and auth CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("carrosséis inteligentes");
  await expect(page.getByRole("link", { name: /começar agora/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /entrar/i })).toBeVisible();
});

test("sign-in page renders email and password fields", async ({ page }) => {
  await page.goto("/entrar");
  await expect(page.getByLabel(/e-mail/i)).toBeVisible();
  await expect(page.getByLabel(/senha/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
});

test("sign-up page renders the registration form", async ({ page }) => {
  await page.goto("/cadastrar");
  await expect(page.getByLabel(/nome/i)).toBeVisible();
  await expect(page.getByLabel(/e-mail/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /criar conta/i })).toBeVisible();
});

test("protected routes never render raw crashes when Supabase is unconfigured", async ({ page }) => {
  await page.goto("/dashboard");
  // Either a clean redirect to /entrar (Supabase configured) or the friendly
  // configuration-error boundary (Supabase not configured) - never Next.js's
  // raw unstyled error screen.
  await expect(page.locator("body")).not.toContainText("Application error");
  const sawFriendlyMessage =
    (await page.getByText(/configuração pendente/i).count()) > 0 ||
    page.url().includes("/entrar");
  expect(sawFriendlyMessage).toBeTruthy();
});
