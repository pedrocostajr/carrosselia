import { AnthropicProvider } from "@/lib/ai/anthropic-provider";
import { DemoProvider } from "@/lib/ai/demo-provider";
import type { AIProvider } from "@/lib/ai/provider";

export function isDemoMode(): boolean {
  return !process.env.ANTHROPIC_API_KEY;
}

let cachedSystemProvider: AIProvider | null = null;

/**
 * Server-only factory. Never import this from client components.
 *
 * When `userApiKey` is set (the caller brought their own Anthropic key via
 * "Configurações"), it always wins and a fresh provider is built for it -
 * per-user keys are never cached across requests. Otherwise falls back to
 * the shared system key (ANTHROPIC_API_KEY), or demo mode if neither is
 * configured.
 */
export function getAIProvider(userApiKey?: string | null): AIProvider {
  if (userApiKey) {
    return new AnthropicProvider(userApiKey, process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5");
  }

  if (cachedSystemProvider) return cachedSystemProvider;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  cachedSystemProvider = apiKey
    ? new AnthropicProvider(apiKey, process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5")
    : new DemoProvider();

  return cachedSystemProvider;
}

export type { AIProvider } from "@/lib/ai/provider";
