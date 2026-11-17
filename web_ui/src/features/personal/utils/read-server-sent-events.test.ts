// Tests parsing of server-sent events split across network chunks.
import { describe, expect, it } from "vitest";

import { readServerSentEvents } from "./read-server-sent-events";

function toStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream);
}

describe("readServerSentEvents", () => {
  it("should emit each event once even when it spans several chunks", async () => {
    const events: Array<[string, string]> = [];
    const response = toStreamResponse(['event: delta\ndata: {"text":"He', 'llo"}\n\nevent: done\n', "data: {}\n\n"]);
    await readServerSentEvents(response, (event, data) => events.push([event, data]));
    expect(events).toEqual([
      ["delta", '{"text":"Hello"}'],
      ["done", "{}"],
    ]);
  });

  it("should default the event name to message and flush a trailing event", async () => {
    const events: Array<[string, string]> = [];
    await readServerSentEvents(toStreamResponse(["data: tail"]), (event, data) => events.push([event, data]));
    expect(events).toEqual([["message", "tail"]]);
  });
});
