import { z } from "zod";

export const apiKeyInputSchema = z.object({
  anthropicApiKey: z
    .string()
    .trim()
    .min(10, "Chave inválida.")
    .max(200, "Chave inválida.")
    .regex(/^sk-ant-/, "Uma chave da Anthropic começa com \"sk-ant-\"."),
});

export type ApiKeyInput = z.infer<typeof apiKeyInputSchema>;
