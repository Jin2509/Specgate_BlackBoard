// Keeps one WebSocket per tab to the backend, reconnecting with backoff and replaying channel subscriptions.
import { toApiPath } from "@/lib/api/api-base-path";
import type { RealtimeEvent, RealtimeStatus } from "@/types/realtime";

const REALTIME_PATH = toApiPath("/realtime");
const RETRY_BASE_DELAY_MS = 1000;
const RETRY_MAX_DELAY_MS = 30_000;
/** Closing right after the last listener leaves would reconnect on every page change. */
const IDLE_CLOSE_DELAY_MS = 5000;
const CLOSE_UNAUTHENTICATED = 4401;
const CLOSE_FORBIDDEN_ORIGIN = 4403;
const PERMANENT_CLOSE_CODES: ReadonlySet<number> = new Set([CLOSE_UNAUTHENTICATED, CLOSE_FORBIDDEN_ORIGIN]);

export interface SocketHandlers {
  onOpen: () => void;
  onMessage: (data: unknown) => void;
  onClose: (code: number) => void;
}

export interface SocketLike {
  isOpen: () => boolean;
  send: (data: string) => void;
  /** Close without calling `onClose`. */
  close: () => void;
}

export interface RealtimeClientOptions {
  createSocket: (url: string, handlers: SocketHandlers) => SocketLike;
  toUrl: () => string;
  /** Scheduling is injected so tests control time without sleeps. */
  setTimer: (callback: () => void, delayMs: number) => number;
  clearTimer: (timerId: number) => void;
  random: () => number;
}

type EventListener = (event: RealtimeEvent) => void;
type StatusListener = (status: RealtimeStatus) => void;

interface ChannelSubscription {
  workspaceId: string;
  channelId: string;
  lastSeq: number;
  listenerCount: number;
}

function toChannelKey(workspaceId: string, channelId: string): string {
  return `${workspaceId}/${channelId}`;
}

export class RealtimeClient {
  #socket: SocketLike | null = null;
  #status: RealtimeStatus = "closed";
  #retryCount = 0;
  #retryTimerId: number | null = null;
  #idleTimerId: number | null = null;
  readonly #eventListeners = new Set<EventListener>();
  readonly #statusListeners = new Set<StatusListener>();
  readonly #channelsByKey = new Map<string, ChannelSubscription>();
  readonly #options: RealtimeClientOptions;

  constructor(options: RealtimeClientOptions) {
    this.#options = options;
  }

  get status(): RealtimeStatus {
    return this.#status;
  }

  /** Listen to every pushed event; the connection opens with the first listener. */
  listen(listener: EventListener): () => void {
    this.#eventListeners.add(listener);
    this.#retain();
    return () => {
      this.#eventListeners.delete(listener);
      this.#releaseLater();
    };
  }

  listenStatus(listener: StatusListener): () => void {
    this.#statusListeners.add(listener);
    return () => this.#statusListeners.delete(listener);
  }

  /** Receive the channel's new messages; `afterSeq` replays the ones posted since that point. */
  subscribeChannel(workspaceId: string, channelId: string, afterSeq: number): () => void {
    const key = toChannelKey(workspaceId, channelId);
    const existing = this.#channelsByKey.get(key);
    if (existing) {
      existing.listenerCount += 1;
    } else {
      this.#channelsByKey.set(key, { workspaceId, channelId, lastSeq: afterSeq, listenerCount: 1 });
      this.#sendSubscribe(this.#channelsByKey.get(key)!);
    }
    return () => {
      const subscription = this.#channelsByKey.get(key);
      if (!subscription) return;
      subscription.listenerCount -= 1;
      if (subscription.listenerCount > 0) return;
      this.#channelsByKey.delete(key);
      this.#send({ type: "unsubscribe", channelId: subscription.channelId });
    };
  }

  /** Try again now, for instance when the browser comes back online. */
  reconnectNow(): void {
    if (this.#status !== "closed" || this.#eventListeners.size === 0) return;
    this.#clearRetry();
    this.#connect();
  }

  #retain(): void {
    if (this.#idleTimerId !== null) {
      this.#options.clearTimer(this.#idleTimerId);
      this.#idleTimerId = null;
    }
    if (!this.#socket && this.#retryTimerId === null && this.#status !== "unauthenticated") this.#connect();
  }

  #releaseLater(): void {
    if (this.#eventListeners.size > 0 || this.#idleTimerId !== null) return;
    this.#idleTimerId = this.#options.setTimer(() => {
      this.#idleTimerId = null;
      if (this.#eventListeners.size === 0) this.#disconnect();
    }, IDLE_CLOSE_DELAY_MS);
  }

  #connect(): void {
    this.#setStatus("connecting");
    const socket = this.#options.createSocket(this.#options.toUrl(), {
      onOpen: () => {
        this.#retryCount = 0;
        this.#setStatus("open");
        for (const subscription of this.#channelsByKey.values()) this.#sendSubscribe(subscription);
      },
      onMessage: (data) => this.#handleMessage(data),
      onClose: (code) => this.#handleClose(socket, code),
    });
    this.#socket = socket;
  }

  #disconnect(): void {
    this.#clearRetry();
    const socket = this.#socket;
    this.#socket = null;
    socket?.close();
    this.#setStatus("closed");
  }

  #handleMessage(data: unknown): void {
    if (typeof data !== "string") return;
    let event: RealtimeEvent;
    try {
      event = JSON.parse(data) as RealtimeEvent;
    } catch {
      // A malformed frame carries nothing to act on; the next event or reconnect brings the page up to date.
      return;
    }
    if (event.type === "channel.message.created") {
      const subscription = this.#channelsByKey.get(toChannelKey(event.message.workspaceId, event.message.channelId));
      if (subscription) subscription.lastSeq = Math.max(subscription.lastSeq, event.message.seq);
    }
    for (const listener of this.#eventListeners) listener(event);
  }

  #handleClose(socket: SocketLike, code: number): void {
    if (this.#socket !== socket) return;
    this.#socket = null;
    if (PERMANENT_CLOSE_CODES.has(code)) return this.#setStatus("unauthenticated");
    this.#setStatus("closed");
    if (this.#eventListeners.size === 0) return;
    const delayMs = Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** this.#retryCount);
    this.#retryCount += 1;
    // Jitter spreads the reconnects of many tabs after a backend restart.
    const jitteredDelayMs = delayMs / 2 + this.#options.random() * (delayMs / 2);
    this.#retryTimerId = this.#options.setTimer(() => {
      this.#retryTimerId = null;
      this.#connect();
    }, jitteredDelayMs);
  }

  #clearRetry(): void {
    if (this.#retryTimerId === null) return;
    this.#options.clearTimer(this.#retryTimerId);
    this.#retryTimerId = null;
  }

  #sendSubscribe(subscription: ChannelSubscription): void {
    this.#send({
      type: "subscribe",
      workspaceId: subscription.workspaceId,
      channelId: subscription.channelId,
      after: subscription.lastSeq,
    });
  }

  #send(request: Record<string, unknown>): void {
    if (this.#socket?.isOpen()) this.#socket.send(JSON.stringify(request));
  }

  #setStatus(status: RealtimeStatus): void {
    if (this.#status === status) return;
    this.#status = status;
    for (const listener of this.#statusListeners) listener(status);
  }
}

function createBrowserSocket(url: string, handlers: SocketHandlers): SocketLike {
  const socket = new WebSocket(url);
  socket.onopen = () => handlers.onOpen();
  socket.onmessage = (event) => handlers.onMessage(event.data);
  socket.onclose = (event) => handlers.onClose(event.code);
  return {
    isOpen: () => socket.readyState === WebSocket.OPEN,
    send: (data) => socket.send(data),
    close: () => {
      socket.onclose = null;
      socket.close();
    },
  };
}

function toBrowserUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${REALTIME_PATH}`;
}

let browserClient: RealtimeClient | null = null;

/** The tab's shared client; created on first use in the browser only. */
export function getRealtimeClient(): RealtimeClient {
  if (browserClient) return browserClient;
  const client = new RealtimeClient({
    createSocket: createBrowserSocket,
    toUrl: toBrowserUrl,
    setTimer: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimer: (timerId) => window.clearTimeout(timerId),
    random: Math.random,
  });
  window.addEventListener("online", () => client.reconnectNow());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") client.reconnectNow();
  });
  browserClient = client;
  return client;
}
