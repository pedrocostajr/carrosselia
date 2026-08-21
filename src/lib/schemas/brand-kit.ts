import { z } from "zod";

export const VISUAL_STYLES = [
  "minimalista",
  "elegante",
  "forte",
  "editorial",
  "descontraido",
] as const;
export const visualStyleSchema = z.enum(VISUAL_STYLES);
export type VisualStyle = z.infer<typeof visualStyleSchema>;

export const BUTTON_STYLES = ["solid", "outline", "soft", "ghost"] as const;
export const buttonStyleSchema = z.enum(BUTTON_STYLES);

export const brandKitSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, "Informe um nome para o kit"),
  displayName: z.string().min(1, "Informe o nome de exibição"),
  instagramHandle: z
    .string()
    .regex(/^@?[a-zA-Z0-9._]{1,30}$/, "Usuário do Instagram inválido")
    .transform((v) => (v.startsWith("@") ? v : `@${v}`)),
  avatarUrl: z.string().nullable().default(null),
  logoUrl: z.string().nullable().default(null),
  logoAltUrl: z.string().nullable().default(null),
  colorPrimary: z.string().default("#111111"),
  colorSecondary: z.string().default("#4B5563"),
  colorAccent: z.string().default("#2563EB"),
  colorBackground: z.string().default("#FFFFFF"),
  colorText: z.string().default("#111111"),
  fontHeading: z.string().default("Playfair Display"),
  fontBody: z.string().default("Inter"),
  buttonStyle: buttonStyleSchema.default("solid"),
  cornerRadius: z.number().min(0).max(48).default(16),
  visualStyle: visualStyleSchema.default("minimalista"),
  footerText: z.string().nullable().default(null),
  defaultCta: z.string().nullable().default(null),
  siteOrHandle: z.string().nullable().default(null),
  isPreset: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BrandKit = z.infer<typeof brandKitSchema>;

export const brandKitInputSchema = brandKitSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  isPreset: true,
});
export type BrandKitInput = z.infer<typeof brandKitInputSchema>;

export const GOOGLE_FONT_OPTIONS = [
  { family: "Inter", category: "sans" },
  { family: "Poppins", category: "sans" },
  { family: "Montserrat", category: "sans" },
  { family: "Space Grotesk", category: "sans" },
  { family: "Playfair Display", category: "serif" },
  { family: "Merriweather", category: "serif" },
  { family: "DM Serif Display", category: "serif" },
  { family: "Lora", category: "serif" },
  { family: "Bebas Neue", category: "display" },
  { family: "Oswald", category: "display" },
] as const;

export type GoogleFontOption = (typeof GOOGLE_FONT_OPTIONS)[number]["family"];
