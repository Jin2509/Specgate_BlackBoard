// Shows a join code as one tile per character.
import { format, t } from "@/lib/i18n";

import { toCodeCharacters } from "../utils/join-code";

export function JoinCodeDisplay({ code }: { code: string }) {
  const characters = toCodeCharacters(code);
  return (
    <p
      aria-label={format(t.join.codeAriaLabel, { code: characters.join(" ") })}
      className="flex justify-center gap-1.5 rounded-lg bg-input p-3"
    >
      {characters.map((character, index) => (
        <span
          key={index}
          aria-hidden
          className="flex h-11 w-9 items-center justify-center rounded-md bg-card font-mono text-xl font-bold text-sidebar-accent-foreground"
        >
          {character}
        </span>
      ))}
    </p>
  );
}
