// Formats a file size for a glance next to an uploaded file.
import { locale } from "@/lib/i18n";

const BYTES_PER_KILOBYTE = 1024;
const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024;

/** "820 KB", "2.4 MB": rounded for a glance, not exact. */
export function toFileSizeLabel(sizeBytes: number): string {
  if (sizeBytes >= BYTES_PER_MEGABYTE)
    return `${(sizeBytes / BYTES_PER_MEGABYTE).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(sizeBytes / BYTES_PER_KILOBYTE)).toLocaleString(locale)} KB`;
}
