// Explains the marks of the six criteria grid.
import { t } from "@/lib/i18n";

export function CriteriaLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 w-0.75 rounded-full bg-foreground/60" /> {t.metrics.legendEstimate}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-3 border-l border-dashed border-foreground/60" /> {t.metrics.legendThreshold}
      </span>
      <span>
        <span className="font-medium text-insufficient">{t.metrics.legendInsufficient}</span> {t.metrics.legendInsufficientNote}
      </span>
    </p>
  );
}
