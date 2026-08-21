const WEIGHTS = "400;500;600;700;800";

export function buildGoogleFontsHref(families: string[]): string {
  const unique = Array.from(new Set(families.filter(Boolean)));
  const families_ = unique
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@${WEIGHTS}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families_}&display=swap`;
}

/**
 * Ensures the given Google Fonts are requested via a <link> tag and that the
 * browser has actually finished loading them (document.fonts) before
 * resolving. Used before both editor canvas paints and PNG export so what
 * renders always matches the fonts actually available.
 */
export async function ensureFontsLoaded(families: string[]): Promise<void> {
  if (typeof document === "undefined") return;
  const unique = Array.from(new Set(families.filter(Boolean)));
  if (unique.length === 0) return;

  const href = buildGoogleFontsHref(unique);
  const existing = document.querySelector<HTMLLinkElement>(`link[data-google-fonts="${href}"]`);

  if (!existing) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.googleFonts = href;
    document.head.appendChild(link);
  }

  const loaders = unique.flatMap((family) => [
    document.fonts.load(`400 16px "${family}"`),
    document.fonts.load(`600 16px "${family}"`),
    document.fonts.load(`700 16px "${family}"`),
  ]);

  await Promise.all(loaders).catch(() => undefined);
  await document.fonts.ready;
}
