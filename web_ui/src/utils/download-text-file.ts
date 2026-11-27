// Saves text the page already holds as a file, in a way every browser completes.

/** Long enough for the browser to start reading the blob after the click returns. */
const REVOKE_DELAY_MS = 60_000;

export function downloadTextFile(fileName: string, text: string, mediaType: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mediaType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  // Firefox ignores a click on a link outside the document, and revoking at once cancels the download in Safari.
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
