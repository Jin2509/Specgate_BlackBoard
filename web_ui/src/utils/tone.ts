// Maps semantic tones to their Tailwind token classes.
export type Tone = "proposed" | "discussing" | "decided" | "rejected" | "data" | "insufficient" | "agent" | "neutral";

export const TONE_CLASSES: Record<Tone, { text: string; soft: string; line: string; bar: string }> = {
  proposed: { text: "text-proposed", soft: "bg-proposed-soft", line: "border-proposed-line", bar: "bg-proposed" },
  discussing: { text: "text-discussing", soft: "bg-discussing-soft", line: "border-discussing-line", bar: "bg-discussing" },
  decided: { text: "text-decided", soft: "bg-decided-soft", line: "border-decided-line", bar: "bg-decided" },
  rejected: { text: "text-rejected", soft: "bg-rejected-soft", line: "border-rejected-line", bar: "bg-rejected" },
  data: { text: "text-data", soft: "bg-data-soft", line: "border-data-line", bar: "bg-data" },
  insufficient: {
    text: "text-insufficient",
    soft: "bg-insufficient-soft",
    line: "border-insufficient-line",
    bar: "bg-insufficient",
  },
  agent: { text: "text-agent", soft: "bg-agent-soft", line: "border-agent-line", bar: "bg-agent" },
  neutral: { text: "text-muted-foreground", soft: "bg-muted", line: "border-border", bar: "bg-subtle" },
};
