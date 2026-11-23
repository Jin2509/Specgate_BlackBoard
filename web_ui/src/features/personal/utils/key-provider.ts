// Recognises an API key's provider from its prefix so the key form can fill the address by itself.
import type { ProviderKind } from "@/types/agent";

export interface KeyProviderMatch {
  provider: ProviderKind;
  name: string;
  baseUrl: string | null;
}

const OPENAI_BASE_URL = "https://api.openai.com/v1";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

// Order matters: the specific prefixes come before the generic OpenAI "sk-".
const KEY_PROVIDERS: ReadonlyArray<KeyProviderMatch & { pattern: RegExp }> = [
  { pattern: /^sk-ant-/, provider: "anthropic", name: "Anthropic", baseUrl: null },
  { pattern: /^sk-or-/, provider: "openai-compatible", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
  { pattern: /^(AIza|AQ\.)/, provider: "openai-compatible", name: "Google Gemini", baseUrl: GEMINI_BASE_URL },
  { pattern: /^gsk_/, provider: "openai-compatible", name: "Groq", baseUrl: "https://api.groq.com/openai/v1" },
  { pattern: /^xai-/, provider: "openai-compatible", name: "xAI", baseUrl: "https://api.x.ai/v1" },
  { pattern: /^sk-[0-9a-f]{32}$/, provider: "openai-compatible", name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1" },
  { pattern: /^sk-/, provider: "openai-compatible", name: "OpenAI", baseUrl: OPENAI_BASE_URL },
];

export const BASE_URL_SUGGESTIONS: ReadonlyArray<{ url: string; label: string }> = [
  { url: OPENAI_BASE_URL, label: "OpenAI" },
  { url: GEMINI_BASE_URL, label: "Google Gemini" },
  { url: "https://openrouter.ai/api/v1", label: "OpenRouter" },
  { url: "https://api.deepseek.com/v1", label: "DeepSeek" },
  { url: "https://api.groq.com/openai/v1", label: "Groq" },
  { url: "http://localhost:11434/v1", label: "Ollama" },
];

export const DEFAULT_BASE_URL = OPENAI_BASE_URL;

/** Return the provider a key belongs to, or null when its prefix is not distinctive. */
export function detectKeyProvider(apiKey: string): KeyProviderMatch | null {
  const key = apiKey.trim();
  const match = KEY_PROVIDERS.find((candidate) => candidate.pattern.test(key));
  return match ? { provider: match.provider, name: match.name, baseUrl: match.baseUrl } : null;
}
