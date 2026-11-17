// Draws the home page robot waving and holding a highlighted page, using colour tokens so it follows the theme.
import { t } from "@/lib/i18n";

export function RobotIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" role="img" aria-label={t.home.robotLabel} className={className}>
      <ellipse cx="120" cy="186" rx="70" ry="8" fill="var(--muted)" />
      <line x1="120" y1="34" x2="120" y2="18" stroke="var(--subtle)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="120" cy="14" r="7" fill="var(--hl-yellow-solid)">
        <animate attributeName="r" values="7;8.5;7" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <rect x="72" y="34" width="96" height="70" rx="26" fill="var(--primary)" />
      <rect x="84" y="46" width="72" height="46" rx="18" fill="var(--card)" />
      <circle cx="104" cy="68" r="7" fill="var(--foreground)" />
      <circle cx="136" cy="68" r="7" fill="var(--foreground)" />
      <circle cx="106.5" cy="65.5" r="2.2" fill="var(--card)" />
      <circle cx="138.5" cy="65.5" r="2.2" fill="var(--card)" />
      <path d="M108 80 q12 9 24 0" fill="none" stroke="var(--foreground)" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="93" cy="80" r="5" fill="var(--hl-pink)" />
      <circle cx="147" cy="80" r="5" fill="var(--hl-pink)" />
      <rect x="62" y="56" width="12" height="26" rx="6" fill="var(--primary-strong)" />
      <rect x="166" y="56" width="12" height="26" rx="6" fill="var(--primary-strong)" />
      <rect x="86" y="108" width="68" height="58" rx="20" fill="var(--primary)" />
      <rect x="102" y="120" width="36" height="22" rx="7" fill="var(--primary-soft)" />
      <circle cx="112" cy="131" r="3.5" fill="var(--hl-green-solid)" />
      <circle cx="128" cy="131" r="3.5" fill="var(--hl-yellow-solid)" />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 154 118;-14 154 118;0 154 118"
          dur="1.6s"
          repeatCount="indefinite"
        />
        <path d="M152 120 q22 -6 30 -30" fill="none" stroke="var(--primary-strong)" strokeWidth="10" strokeLinecap="round" />
        <circle cx="184" cy="86" r="9" fill="var(--primary-strong)" />
      </g>
      <path d="M88 122 q-18 8 -24 26" fill="none" stroke="var(--primary-strong)" strokeWidth="10" strokeLinecap="round" />
      <g transform="rotate(-8 52 158)">
        <rect x="30" y="140" width="44" height="34" rx="4" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
        <rect x="36" y="148" width="30" height="5" rx="2" fill="var(--hl-yellow)" />
        <rect x="36" y="157" width="22" height="3" rx="1.5" fill="var(--input)" />
        <rect x="36" y="164" width="27" height="3" rx="1.5" fill="var(--input)" />
      </g>
      <rect x="98" y="164" width="14" height="18" rx="6" fill="var(--primary-strong)" />
      <rect x="128" y="164" width="14" height="18" rx="6" fill="var(--primary-strong)" />
    </svg>
  );
}
