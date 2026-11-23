// Draws the SpecGate robot's head as a small avatar, frowning for errors and smiling otherwise.
export function MascotAvatar({ mood, className }: { mood: "worried" | "happy"; className?: string }) {
  const mouthPath = mood === "worried" ? "M26 39 q6 -5 12 0" : "M26 36 q6 5 12 0";
  return (
    <svg viewBox="0 0 64 56" aria-hidden className={className}>
      <line x1="32" y1="12" x2="32" y2="5" stroke="var(--subtle)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="4.5" r="3.5" fill={mood === "worried" ? "var(--rejected)" : "var(--hl-yellow-solid)"} />
      <rect x="8" y="12" width="48" height="38" rx="14" fill="var(--primary)" />
      <rect x="14" y="18" width="36" height="26" rx="10" fill="var(--card)" />
      <circle cx="24" cy="29" r="3.5" fill="var(--foreground)" />
      <circle cx="40" cy="29" r="3.5" fill="var(--foreground)" />
      <path d={mouthPath} fill="none" stroke="var(--foreground)" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="3" y="24" width="6" height="14" rx="3" fill="var(--primary-strong)" />
      <rect x="55" y="24" width="6" height="14" rx="3" fill="var(--primary-strong)" />
    </svg>
  );
}
