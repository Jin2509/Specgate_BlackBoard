// Tests the realtime client: lazy connect, channel replay after reconnect, backoff and permanent closes.
import { describe, expect, it } from "vitest";

import { RealtimeClient, type SocketHandlers } from "./realtime-client";

interface FakeSocket {
  handlers: SocketHandlers;
  sent: Array<Record<string, unknown>>;
  isOpen: boolean;
  isClosed: boolean;
}

function createHarness() {
  const sockets: FakeSocket[] = [];
  const timers = new Map<number, { callback: () => void; delayMs: number }>();
  let nextTimerId = 1;
  const client = new RealtimeClient({
    createSocket: (_url, handlers) => {
      const socket: FakeSocket = { handlers, sent: [], isOpen: false, isClosed: false };
      sockets.push(socket);
      return {
        isOpen: () => socket.isOpen,
        send: (data) => socket.sent.push(JSON.parse(data) as Record<string, unknown>),
        close: () => {
          socket.isClosed = true;
        },
      };
    },
    toUrl: () => "ws://test/api/v1/realtime",
    setTimer: (callback, delayMs) => {
      timers.set(nextTimerId, { callback, delayMs });
      return nextTimerId++;
    },
    clearTimer: (timerId) => timers.delete(timerId),
    random: () => 1,
  });
  const open = (socket: FakeSocket) => {
    socket.isOpen = true;
    socket.handlers.onOpen();
  };
  const runTimers = () => {
    const pending = [...timers.entries()];
    timers.clear();
    for (const [, timer] of pending) timer.callback();
    return pending.map(([, timer]) => timer.delayMs);
  };
  return { client, sockets, open, runTimers };
}

describe("RealtimeClient", () => {
  it("should connect only once something listens", () => {
    const { client, sockets } = createHarness();
    expect(sockets).toHaveLength(0);
    client.listen(() => undefined);
    expect(sockets).toHaveLength(1);
    expect(client.status).toBe("connecting");
  });

  it("should subscribe to a channel once open and pass pushed events to listeners", () => {
    const { client, sockets, open } = createHarness();
    const received: string[] = [];
    client.listen((event) => received.push(event.type));
    client.subscribeChannel("w1", "c1", 4);
    open(sockets[0]);
    expect(sockets[0].sent).toEqual([{ type: "subscribe", workspaceId: "w1", channelId: "c1", after: 4 }]);
    sockets[0].handlers.onMessage(JSON.stringify({ type: "workspace.channel.updated", workspaceId: "w1", channelId: "c1" }));
    expect(received).toEqual(["workspace.channel.updated"]);
  });

  it("should replay from the last seen message after a reconnect", () => {
    const { client, sockets, open, runTimers } = createHarness();
    client.listen(() => undefined);
    client.subscribeChannel("w1", "c1", 4);
    open(sockets[0]);
    sockets[0].handlers.onMessage(
      JSON.stringify({ type: "channel.message.created", message: { workspaceId: "w1", channelId: "c1", seq: 9 } }),
    );
    sockets[0].handlers.onClose(1006);
    expect(client.status).toBe("closed");
    runTimers();
    open(sockets[1]);
    expect(sockets[1].sent).toEqual([{ type: "subscribe", workspaceId: "w1", channelId: "c1", after: 9 }]);
  });

  it("should wait longer after each failed attempt, up to a ceiling", () => {
    const { client, sockets, runTimers } = createHarness();
    client.listen(() => undefined);
    const delays: number[] = [];
    for (let attempt = 0; attempt < 7; attempt++) {
      sockets[attempt].handlers.onClose(1006);
      delays.push(...runTimers());
    }
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);
  });

  it("should not reconnect once the backend refuses the session", () => {
    const { client, sockets, runTimers } = createHarness();
    client.listen(() => undefined);
    sockets[0].handlers.onClose(4401);
    expect(runTimers()).toEqual([]);
    expect(client.status).toBe("unauthenticated");
    expect(sockets).toHaveLength(1);
  });

  it("should close the socket a while after the last listener leaves", () => {
    const { client, sockets, open, runTimers } = createHarness();
    const stop = client.listen(() => undefined);
    open(sockets[0]);
    stop();
    expect(sockets[0].isClosed).toBe(false);
    runTimers();
    expect(sockets[0].isClosed).toBe(true);
    expect(client.status).toBe("closed");
  });

  it("should tell the backend when the last view of a channel goes away", () => {
    const { client, sockets, open } = createHarness();
    client.listen(() => undefined);
    open(sockets[0]);
    const leaveFirst = client.subscribeChannel("w1", "c1", 0);
    const leaveSecond = client.subscribeChannel("w1", "c1", 0);
    leaveFirst();
    expect(sockets[0].sent).toHaveLength(1);
    leaveSecond();
    expect(sockets[0].sent.at(-1)).toEqual({ type: "unsubscribe", channelId: "c1" });
  });
});
