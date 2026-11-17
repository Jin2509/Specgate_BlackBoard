// Defines a person's personal agent: the model they chose, running on their own API key.
export type ProviderKind = "anthropic" | "openai-compatible";

/** `name` is the model family ("Claude"), `label` reads "Claude of Lan" (localized by the backend), `model` is the exact model id. */
export interface PersonalAgent {
  ownerId: string;
  ownerName: string;
  provider: ProviderKind;
  model: string;
  name: string;
  label: string;
}

export interface ProviderKey {
  provider: ProviderKind;
  baseUrl: string | null;
  keyLast4: string;
  model: string;
  models: string[];
  savedAt: string;
}

export interface KeySettings {
  key: ProviderKey | null;
  note: string;
  providers: Array<{ id: string; name: string; needsBaseUrl?: boolean }>;
}
