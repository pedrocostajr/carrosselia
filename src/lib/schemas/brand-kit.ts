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
  avatarUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  logoAltUrl: z.string().nullable(),
  colorPrimary: z.string(),
  colorSecondary: z.string(),
  colorAccent: z.string(),
  colorBackground: z.string(),
  colorText: z.string(),
  fontHeading: z.string(),
  fontBody: z.string(),
  buttonStyle: buttonStyleSchema,
  cornerRadius: z.number().min(0).max(48),
  visualStyle: visualStyleSchema,
  footerText: z.string().nullable(),
  defaultCta: z.string().nullable(),
  siteOrHandle: z.string().nullable(),
  isPreset: z.boolean(),
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
