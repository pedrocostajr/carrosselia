import { AnthropicProvider } from "@/lib/ai/anthropic-provider";
import { DemoProvider } from "@/lib/ai/demo-provider";
import type { AIProvider } from "@/lib/ai/provider";

export function isDemoMode(): boolean {
  return !process.env.ANTHROPIC_API_KEY;
}

let cachedProvider: AIProvider | null = null;

/** Server-only factory. Never import this from client components. */
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  cachedProvider = apiKey
    ? new AnthropicProvider(apiKey, process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5")
    : new DemoProvider();

  return cachedProvider;
}

export type { AIProvider } from "@/lib/ai/provider";
