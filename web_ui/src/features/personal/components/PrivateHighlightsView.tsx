"use client";
// Lists private highlights with filters by colour, conversation, kind and sent state, and sends a selection to a team.
import { Send, Sparkles, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { format, t } from "@/lib/i18n";
import type { HighlightColor, PrivateHighlightList } from "@/types/conversation";
import { cn } from "@/utils/cn";
import { toContentWidthClassName } from "@/utils/content-width";
import { HIGHLIGHT_COLORS } from "@/utils/highlight-colors";

import { CleanupDialog } from "./CleanupDialog";
import { ColorSwatchButton } from "./ColorSwatchButton";
import { PrivateHighlightRow } from "./PrivateHighlightRow";
import { SendHighlightsDialog } from "./SendHighlightsDialog";
import { FILTER_INPUT_CLASS_NAME, type PrivateHighlightItem, type SendTarget } from "../utils/private-highlight-item";

type KindFilter = "all" | "passage" | "summary";
type SentFilter = "" | "sent" | "unsent";

function isKindMatch(item: PrivateHighlightItem, kind: KindFilter): boolean {
  if (kind === "all") return true;
  return kind === "summary" ? item.kind !== "passage" : item.kind === "passage";
}

export function PrivateHighlightsView({
  home,
  list,
  conversations,
  targets,
  initialKind,
}: {
  home: string;
  list: Omit<PrivateHighlightList, "items"> & { items: PrivateHighlightItem[] };
  conversations: Array<{ id: string; title: string }>;
  targets: SendTarget[];
  initialKind?: string;
}) {
  const [color, setColor] = useState<HighlightColor | "">("");
  const [conversationId, setConversationId] = useState("");
  const [kind, setKind] = useState<KindFilter>(initialKind === "summary" ? "summary" : "all");
  const [sentFilter, setSentFilter] = useState<SentFilter>("");
  const [query, setQuery] = useState("");
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [itemsToSend, setItemsToSend] = useState<PrivateHighlightItem[] | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return list.items.filter(
      (item) =>
        (!color || item.color === color) &&
        (!conversationId || item.conversationId === conversationId) &&
        isKindMatch(item, kind) &&
        (!sentFilter || (sentFilter === "sent") === item.sends.length > 0) &&
        (!normalizedQuery || `${item.text} ${item.note ?? ""}`.toLowerCase().includes(normalizedQuery)),
    );
  }, [list.items, color, conversationId, kind, sentFilter, query]);
  const pickedItems = list.items.filter((item) => pickedIds.includes(item.id));

  return (
    <div className={toContentWidthClassName("reading")}>
      <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{t.privateHighlights.intro}</p>

      {list.nearLimit ? (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 rounded-md bg-proposed-soft px-3 py-2 text-[0.8125rem] text-proposed"
        >
          <TriangleAlert className="size-4" /> {format(t.privateHighlights.nearLimit, { total: list.total, limit: list.limit })}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1" role="group" aria-label={t.privateHighlights.filterByColor}>
          <button
            type="button"
            onClick={() => setColor("")}
            className={cn("h-7 rounded-full px-2.5 text-xs", !color ? "bg-accent font-medium" : "text-subtle hover:bg-hover")}
          >
            {t.privateHighlights.allColors}
          </button>
          {HIGHLIGHT_COLORS.map((option) => (
            <ColorSwatchButton
              key={option.value}
              color={option.value}
              label={format(t.channel.filterColor, { color: option.label })}
              isPressed={color === option.value}
              onClick={() => setColor(color === option.value ? "" : option.value)}
              ringOffsetClassName="ring-offset-canvas"
            />
          ))}
        </div>
        <Select
          aria-label={t.privateHighlights.filterByConversation}
          value={conversationId}
          onValueChange={setConversationId}
          className="max-w-48"
          options={[
            { value: "", label: t.privateHighlights.allConversations },
            ...conversations.map((conversation) => ({ value: conversation.id, label: conversation.title })),
          ]}
        />
        <Select
          aria-label={t.privateHighlights.kind}
          value={kind}
          onValueChange={setKind}
          options={[
            { value: "all", label: t.privateHighlights.allKinds },
            { value: "passage", label: t.privateHighlights.kindPassage },
            { value: "summary", label: t.privateHighlights.kindSummary },
          ]}
        />
        <Select
          aria-label={t.privateHighlights.sentFilter}
          value={sentFilter}
          onValueChange={setSentFilter}
          options={[
            { value: "", label: t.privateHighlights.sentAndUnsent },
            { value: "unsent", label: t.privateHighlights.unsent },
            { value: "sent", label: t.privateHighlights.sentToTeam },
          ]}
        />
        <input
          aria-label={t.privateHighlights.search}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.privateHighlights.searchPlaceholder}
          className={cn(FILTER_INPUT_CLASS_NAME, "min-w-32 flex-1")}
        />
      </div>

      <div className="sticky top-0 z-10 mt-3 flex flex-wrap items-center gap-2 bg-canvas py-2">
        <span className="text-[0.8125rem] text-subtle">
          {pickedIds.length
            ? format(t.privateHighlights.pickedCount, { count: pickedIds.length })
            : format(t.privateHighlights.itemCount, { count: visibleItems.length })}
        </span>
        <Button size="sm" disabled={pickedIds.length === 0 || targets.length === 0} onClick={() => setItemsToSend(pickedItems)}>
          <Send /> {t.privateHighlights.sendToTeam}
        </Button>
        {pickedIds.length ? (
          <Button size="sm" variant="ghost" onClick={() => setPickedIds([])}>
            {t.privateHighlights.clearSelection}
          </Button>
        ) : null}
        <Button size="sm" variant="secondary" className="ml-auto" onClick={() => setIsCleaning(true)}>
          <Sparkles /> {t.privateHighlights.cleanup}
        </Button>
      </div>
      {targets.length === 0 ? <p className="text-xs text-subtle">{t.privateHighlights.noTargets}</p> : null}

      <ul className="mt-2 space-y-3">
        {visibleItems.map((item) => (
          <PrivateHighlightRow
            key={item.id}
            item={item}
            home={home}
            isPicked={pickedIds.includes(item.id)}
            onPickChange={(isPicked) =>
              setPickedIds((current) => (isPicked ? [...current, item.id] : current.filter((id) => id !== item.id)))
            }
            onSend={() => setItemsToSend([item])}
          />
        ))}
      </ul>
      {visibleItems.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-subtle">
          {list.total === 0 ? t.privateHighlights.empty : t.privateHighlights.noMatch}
        </p>
      ) : null}

      <SendHighlightsDialog
        items={itemsToSend}
        targets={targets}
        onClose={() => setItemsToSend(null)}
        onSent={() => {
          setPickedIds([]);
          setItemsToSend(null);
        }}
      />
      <CleanupDialog isOpen={isCleaning} onOpenChange={setIsCleaning} conversations={conversations} />
    </div>
  );
}
