import { minimalTemplate } from "@/lib/templates/minimal";
import { editorialTemplate } from "@/lib/templates/editorial";
import { socialPostTemplate } from "@/lib/templates/social-post";
import { photoOverlayTemplate } from "@/lib/templates/photo-overlay";
import type { TemplateDefinition } from "@/lib/templates/types";

export const TEMPLATES: TemplateDefinition[] = [
  minimalTemplate,
  editorialTemplate,
  socialPostTemplate,
  photoOverlayTemplate,
];

export const TEMPLATE_MAP: Record<string, TemplateDefinition> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
);

export function getTemplate(id: string): TemplateDefinition {
  return TEMPLATE_MAP[id] ?? minimalTemplate;
}
