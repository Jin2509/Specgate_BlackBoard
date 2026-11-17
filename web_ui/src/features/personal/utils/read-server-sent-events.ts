// Reads a server-sent event stream from a fetch Response, since a POST cannot use EventSource.
const EVENT_SEPARATOR = "\n\n";
const DEFAULT_EVENT = "message";

function readEventChunk(chunk: string, onEvent: (event: string, data: string) => void): void {
  let event = DEFAULT_EVENT;
  const dataLines: string[] = [];
  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) event = line.slice("event:".length).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice("data:".length).trimStart());
  }
  if (dataLines.length) onEvent(event, dataLines.join("\n"));
}

export async function readServerSentEvents(response: Response, onEvent: (event: string, data: string) => void): Promise<void> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let end = buffer.indexOf(EVENT_SEPARATOR);
    while (end >= 0) {
      readEventChunk(buffer.slice(0, end), onEvent);
      buffer = buffer.slice(end + EVENT_SEPARATOR.length);
      end = buffer.indexOf(EVENT_SEPARATOR);
    }
  }
  if (buffer.trim()) readEventChunk(buffer, onEvent);
}
