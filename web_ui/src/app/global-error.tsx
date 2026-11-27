"use client";
// Replaces the whole document when the root layout itself fails, with a plain reload action.
import { t } from "@/lib/i18n";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body>
        <main style={{ fontFamily: "sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
          <h1>{t.common.brand}</h1>
          <p>{t.common.pageErrorBody}</p>
          <button type="button" onClick={reset}>
            {t.common.pageErrorRetry}
          </button>
        </main>
      </body>
    </html>
  );
}
