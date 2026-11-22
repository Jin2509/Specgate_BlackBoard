"use client";
// Chats privately with the user's agent: streamed Markdown answers with stop and regenerate, and selection to highlight.
import { LoaderCircle, Paperclip, SendHorizontal, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { useDraft } from "@/hooks/use-draft";
import { useOnline } from "@/hooks/use-online";
import { toApiPath } from "@/lib/api/api-base-path";
import { toApiError } from "@/lib/api/http-client";
import { format, t } from "@/lib/i18n";
import type { ConversationDocument, Turn } from "@/types/conversation";
import { cn } from "@/utils/cn";
import { toContentWidthClassName } from "@/utils/content-width";
import { toClock } from "@/utils/date-format";

import { ChatEmptyState } from "./ChatEmptyState";
import { ChatSelectionBar, type SelectionTip } from "./ChatSelectionBar";
import { ChatTurnRow } from "./ChatTurnRow";
import { DocumentChips } from "./DocumentChips";
import { NewChatContextSelect } from "./NewChatContextSelect";
import { createConversation, type HighlightDisposal } from "../api/conversation-actions";
import { uploadDocument } from "../api/document-upload";
import { createPrivateHighlight } from "../api/private-highlight-actions";
import { usePaintHighlights, type PaintMark } from "../hooks/use-paint-highlights";
import { readServerSentEvents } from "../utils/read-server-sent-events";
import type { WorkspaceOption } from "../utils/workspace-option";

const UNAUTHORIZED_STATUS = 401;
const REFRESH_AFTER_STREAM_MS = 400;
const TIP_OFFSET_TOP_PX = 48;
const TIP_HALF_WIDTH_PX = 150;
const TIP_MAX_RIGHT_PX = 320;
const TIP_MIN_LEFT_PX = 8;
const STOPPED_TURN_PREFIX = "stopped-";
const DOCUMENT_ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function toElement(node: Node): Element | null {
  return node instanceof Element ? node : node.parentElement;
}

export function ChatScreen({
  home,
  conversationId,
  turns: serverTurns,
  model,
  linkName,
  linkOptions = [],
  marks = [],
  documents = [],
}: {
  /** Path of the personal workspace, to open a new conversation or the key page. */
  home: string;
  conversationId?: string;
  /** Saved turns, with `at` already formatted on the server. */
  turns: Turn[];
  model: string;
  /** Name of the shared workspace serving as this conversation's team context. */
  linkName?: string;
  /** For a new conversation: the shared workspaces to pick a team context from before the first question. */
  linkOptions?: WorkspaceOption[];
  /** The conversation's private highlights, painted over the text. */
  marks?: PaintMark[];
  /** Files attached to the conversation; the agent reads their text with every question. */
  documents?: ConversationDocument[];
}) {
  const router = useRouter();
  const isOnline = useOnline();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // A new conversation created to hold a file whose upload failed; the next question or file reuses it.
  const createdConversationId = useRef<string | null>(null);
  const stoppedTurnCount = useRef(0);
  // Turns streamed in this session; after a refresh the server returns the same ids, so duplicates are dropped.
  const [localTurns, setLocalTurns] = useState<Turn[]>([]);
  const [hiddenTurnIds, setHiddenTurnIds] = useState<string[]>([]);
  const turns = [...serverTurns, ...localTurns.filter((local) => !serverTurns.some((server) => server.id === local.id))].filter(
    (turn) => !hiddenTurnIds.includes(turn.id),
  );
  const [isPending, setIsPending] = useState(false);
  const [askedText, setAskedText] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useDraft(`chat:${conversationId ?? "new"}`);
  const [tip, setTip] = useState<SelectionTip | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [newLinkId, setNewLinkId] = useState("");
  const [turnToRegenerate, setTurnToRegenerate] = useState<Turn | null>(null);
  const [localMarks, setLocalMarks] = useState<PaintMark[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const allMarks = useMemo(() => [...marks, ...localMarks], [marks, localMarks]);
  usePaintHighlights(scrollRef, allMarks, `${turns.length}:${streamedText === null}`);

  useEffect(() => {
    const scrollBox = scrollRef.current;
    if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
  }, [turns.length, isPending, streamedText]);

  const lastAnswer = [...turns].reverse().find((turn) => turn.role === "assistant");
  const isBusy = isPending || isUploading || !isOnline;

  function fail(message: string, text?: string) {
    setError(message);
    if (text) setQuestion(text);
    setAskedText(null);
    setIsPending(false);
  }

  async function readAnswerStream(response: Response, streamConversationId: string, isNewConversation: boolean) {
    let answer = "";
    const appendTurn = (turn: Turn) => setLocalTurns((current) => [...current, { ...turn, at: toClock(turn.at) }]);
    try {
      await readServerSentEvents(response, (event, raw) => {
        const data = JSON.parse(raw) as { turn?: Turn; text?: string };
        if (event === "user" && data.turn) {
          appendTurn(data.turn);
          setAskedText(null);
        } else if (event === "delta") {
          answer += data.text ?? "";
          setStreamedText(answer);
        } else if ((event === "done" || event === "error") && data.turn) {
          appendTurn(data.turn);
          setStreamedText(null);
        }
      });
    } catch (streamError) {
      // Stop or a lost connection: the server keeps what was written, so show that part right away.
      if (answer) {
        stoppedTurnCount.current += 1;
        appendTurn({
          id: `${STOPPED_TURN_PREFIX}${stoppedTurnCount.current}`,
          role: "assistant",
          text: answer,
          at: "",
          model,
          stopped: true,
        });
      }
      if (!isAbortError(streamError)) setError(t.personal.streamInterrupted);
    }
    abortRef.current = null;
    setStreamedText(null);
    setAskedText(null);
    // A new conversation stays pending until its own page replaces this screen.
    if (isNewConversation) return router.push(`${home}/${streamConversationId}`);
    setIsPending(false);
    window.setTimeout(() => router.refresh(), REFRESH_AFTER_STREAM_MS);
  }

  async function openAnswerStream(resourcePath: string, body?: unknown): Promise<Response | null> {
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch(toApiPath(resourcePath), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (response.ok) return response;
      const apiError = await toApiError(response);
      if (response.status === UNAUTHORIZED_STATUS) router.push("/login");
      else if (apiError.code === "NO_KEY") router.push(`${home}/key`);
      else fail(apiError.message || t.personal.askFailed);
      return null;
    } catch (requestError) {
      if (isAbortError(requestError)) setIsPending(false);
      else fail(t.errors.backendUnreachable);
      return null;
    }
  }

  async function ask(text: string) {
    setIsPending(true);
    setError(null);
    setAskedText(text);
    setQuestion("");
    const targetId = await ensureConversation();
    if (!targetId) return fail(t.personal.conversationCreateFailed, text);
    const response = await openAnswerStream(`/conversations/${encodeURIComponent(targetId)}/turns`, { text });
    if (response) await readAnswerStream(response, targetId, !conversationId);
  }

  /** The open conversation, or a new one with the team context picked for it; null when it cannot be created. */
  async function ensureConversation(): Promise<string | null> {
    if (conversationId) return conversationId;
    if (createdConversationId.current) return createdConversationId.current;
    const created = await createConversation(newLinkId || undefined);
    if (!created.ok) return null;
    createdConversationId.current = created.value.id;
    return created.value.id;
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setIsUploading(true);
    const targetId = await ensureConversation();
    const message = targetId ? await uploadDocument(targetId, file) : t.personal.conversationCreateFailed;
    setIsUploading(false);
    if (message) return setError(message);
    if (!conversationId && targetId) return router.push(`${home}/${targetId}`);
    router.refresh();
  }

  async function regenerate(turn: Turn, highlights: HighlightDisposal) {
    if (!conversationId) return;
    setTurnToRegenerate(null);
    setIsPending(true);
    setError(null);
    setHiddenTurnIds((hidden) => [...hidden, turn.id]);
    if (highlights === "delete") setLocalMarks([]);
    const response = await openAnswerStream(
      `/conversations/${encodeURIComponent(conversationId)}/turns/${encodeURIComponent(turn.id)}/regenerate?highlights=${highlights}`,
    );
    if (response) await readAnswerStream(response, conversationId, false);
    else setHiddenTurnIds((hidden) => hidden.filter((id) => id !== turn.id));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  /** A selection inside one saved turn (an answer or the user's own question) shows the highlight bar. */
  function handleSelectionEnd() {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!selection || !text || selection.rangeCount === 0 || !conversationId) return setTip(null);
    const range = selection.getRangeAt(0);
    const startTurn = toElement(range.startContainer)?.closest<HTMLElement>("[data-turn-id]");
    const endTurn = toElement(range.endContainer)?.closest<HTMLElement>("[data-turn-id]");
    const scrollBox = scrollRef.current;
    if (!startTurn || startTurn !== endTurn || !scrollBox || startTurn.dataset.error || startTurn.dataset.local)
      return setTip(null);
    const rect = range.getBoundingClientRect();
    const outer = scrollBox.getBoundingClientRect();
    setTip({
      turnId: startTurn.dataset.turnId!,
      text,
      top: rect.top - outer.top + scrollBox.scrollTop - TIP_OFFSET_TOP_PX,
      left: Math.max(
        TIP_MIN_LEFT_PX,
        Math.min(rect.left - outer.left + rect.width / 2 - TIP_HALF_WIDTH_PX, outer.width - TIP_MAX_RIGHT_PX),
      ),
    });
  }

  async function handleSaveSelection(selectionTip: SelectionTip, color: PaintMark["color"], note?: string) {
    if (!conversationId) return t.personal.noConversation;
    const outcome = await createPrivateHighlight({
      conversationId,
      turnId: selectionTip.turnId,
      text: selectionTip.text,
      color,
      note,
    });
    if (!outcome.ok) return outcome.error;
    setLocalMarks((current) => [...current, { turnId: selectionTip.turnId, text: selectionTip.text, color }]);
    setTip(null);
    setSavedNotice(t.personal.savedPrivate);
    window.getSelection()?.removeAllRanges();
    router.refresh();
    return null;
  }

  function toHintText(): string {
    if (!isOnline) return t.personal.offline;
    if (isUploading) return t.personal.readingDocument;
    return linkName ? format(t.personal.linkedHint, { name: linkName }) : t.personal.defaultHint;
  }

  return (
    <div className="@container flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onMouseUp={handleSelectionEnd}
        onKeyUp={(event) => (event.shiftKey ? handleSelectionEnd() : null)}
        className="relative flex-1 scrollbar-thin overflow-y-auto"
      >
        <div className={cn(toContentWidthClassName("reading"), "flex min-h-full flex-col px-4 pt-8 pb-6 sm:px-8")}>
          {turns.length === 0 && !askedText ? <ChatEmptyState model={model} /> : null}
          <ol className="space-y-7">
            {turns.map((turn) => {
              const isStopped = turn.id.startsWith(STOPPED_TURN_PREFIX);
              return (
                <ChatTurnRow
                  key={turn.id}
                  turn={turn}
                  isLocal={isStopped}
                  canRegenerate={!isBusy && turn.id === lastAnswer?.id && !isStopped}
                  onRegenerate={() =>
                    allMarks.some((mark) => mark.turnId === turn.id) ? setTurnToRegenerate(turn) : void regenerate(turn, "keep")
                  }
                />
              );
            })}
            {askedText ? <ChatTurnRow turn={{ id: "pending-question", role: "user", text: askedText, at: "" }} isLocal /> : null}
            {isPending ? (
              streamedText !== null ? (
                <ChatTurnRow turn={{ id: "streaming", role: "assistant", text: streamedText, at: "", model }} isLocal isTyping />
              ) : (
                <li className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4 @max-xl:grid-cols-1 @max-xl:gap-1">
                  <span className="truncate pt-0.5 font-mono text-xs text-agent">{model}</span>
                  <span className="text-[15px] text-subtle">
                    {t.personal.answering}
                    <span className="stream-caret" aria-hidden />
                  </span>
                </li>
              )
            ) : null}
          </ol>
        </div>

        {tip ? (
          <ChatSelectionBar
            tip={tip}
            onCancel={() => setTip(null)}
            onSave={(color, note) => handleSaveSelection(tip, color, note)}
          />
        ) : null}
      </div>

      <div className={cn(toContentWidthClassName("reading"), "px-4 pb-3 sm:px-8")}>
        {savedNotice ? (
          <p role="status" className="mb-2 text-[13px] text-muted-foreground">
            {savedNotice}{" "}
            <Link href={`${home}/highlights`} className="text-primary-strong underline-offset-2 hover:underline">
              {t.personal.openList}
            </Link>
          </p>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const text = question.trim();
            if (text && !isBusy) void ask(text);
          }}
          data-conversation-id={conversationId ?? ""}
          className="rounded-lg border border-border bg-composer focus-within:border-subtle"
        >
          {conversationId ? <DocumentChips conversationId={conversationId} documents={documents} onError={setError} /> : null}
          <label htmlFor="ask" className="sr-only">
            {t.personal.questionLabel}
          </label>
          <textarea
            id="ask"
            name="text"
            rows={2}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={format(t.personal.askPlaceholder, { model })}
            className="block max-h-48 min-h-14 w-full resize-none bg-transparent px-3 pt-3 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-subtle"
          />
          <div className="flex items-center gap-2 px-2 pb-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={DOCUMENT_ACCEPT}
              onChange={(event) => void handleFileChange(event)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
            />
            <button
              type="button"
              aria-label={t.personal.attachDocument}
              title={t.personal.attachDocument}
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-subtle hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-35"
            >
              {isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
            </button>
            {!conversationId && linkOptions.length > 0 ? (
              <NewChatContextSelect value={newLinkId} onChange={setNewLinkId} options={linkOptions} />
            ) : null}
            <p className="flex-1 truncate px-1 text-xs text-subtle">{toHintText()}</p>
            {isPending ? (
              <button
                type="button"
                aria-label={t.personal.stop}
                title={t.personal.stopTitle}
                onClick={() => abortRef.current?.abort()}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[13px] font-medium text-foreground hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Square className="size-3.5 fill-current" /> {t.personal.stop}
              </button>
            ) : null}
            <button
              type="submit"
              aria-label={t.personal.sendQuestion}
              disabled={isBusy || !question.trim()}
              className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-composer focus-visible:outline-none disabled:opacity-35"
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
            </button>
          </div>
        </form>
        {error ? (
          <p role="alert" className="mt-1.5 text-[13px] text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <Dialog open={turnToRegenerate !== null} onOpenChange={(isOpen) => (isOpen ? null : setTurnToRegenerate(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.personal.regenerateTitle}</DialogTitle>
            <DialogDescription>{t.personal.regenerateDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => turnToRegenerate && void regenerate(turnToRegenerate, "delete")}>
              {t.personal.deleteHighlights}
            </Button>
            <Button onClick={() => turnToRegenerate && void regenerate(turnToRegenerate, "keep")}>
              {t.personal.keepHighlights}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
