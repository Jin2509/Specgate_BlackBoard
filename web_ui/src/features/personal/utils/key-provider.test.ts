// Tests recognising an API key's provider and address from its prefix.
import { describe, expect, it } from "vitest";

import { detectKeyProvider } from "./key-provider";

describe("detectKeyProvider", () => {
  it("should recognise an Anthropic key without an address", () => {
    expect(detectKeyProvider("sk-ant-api03-abc")).toEqual({ provider: "anthropic", name: "Anthropic", baseUrl: null });
  });

  it("should recognise both Google AI Studio key formats", () => {
    expect(detectKeyProvider("AIzaSyExample")?.name).toBe("Google Gemini");
    expect(detectKeyProvider(" AQ.Ab8Example ")?.baseUrl).toBe("https://generativelanguage.googleapis.com/v1beta/openai");
  });

  it("should tell a DeepSeek key from an OpenAI key", () => {
    expect(detectKeyProvider(`sk-${"a1".repeat(16)}`)?.name).toBe("DeepSeek");
    expect(detectKeyProvider("sk-proj-Example")?.name).toBe("OpenAI");
  });

  it("should prefer OpenRouter over the generic OpenAI prefix", () => {
    expect(detectKeyProvider("sk-or-v1-example")?.name).toBe("OpenRouter");
  });

  it("should return null for a key without a known prefix", () => {
    expect(detectKeyProvider("ollama")).toBeNull();
  });
});
