import type { BrandKitRow } from "@/lib/data/brand-kits";
import { DEFAULT_BRAND_CONTEXT, type BrandContext } from "@/lib/templates/types";

export function brandKitToContext(kit: BrandKitRow | null): BrandContext {
  if (!kit) return DEFAULT_BRAND_CONTEXT;

  return {
    displayName: kit.display_name,
    instagramHandle: kit.instagram_handle,
    avatarUrl: kit.avatar_url,
    logoUrl: kit.logo_url,
    logoAltUrl: kit.logo_alt_url,
    colorPrimary: kit.color_primary,
    colorSecondary: kit.color_secondary,
    colorAccent: kit.color_accent,
    colorBackground: kit.color_background,
    colorText: kit.color_text,
    fontHeading: kit.font_heading,
    fontBody: kit.font_body,
    cornerRadius: kit.corner_radius,
    footerText: kit.footer_text,
    siteOrHandle: kit.site_or_handle,
  };
}
