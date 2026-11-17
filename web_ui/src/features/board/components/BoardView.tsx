"use client";
// Renders the idea board page: four status columns, notes, the add dialog and the decision dialog.
import { FileText, KanbanSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PageBody } from "@/components/PageBody";
import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/Button";
import { useQueryParam } from "@/hooks/use-query-param";
import { format, t } from "@/lib/i18n";
import type { BoardCard, Decision } from "@/types/board";
import { IDEA_COLUMNS } from "@/utils/status-meta";

import { AddItemDialog } from "./AddItemDialog";
import { BoardColumn } from "./BoardColumn";
import { BoardFooter } from "./BoardFooter";
import { DecideDialog } from "./DecideDialog";
import { updateIdeaDecision, updateIdeaToDiscussing } from "../api/board-actions";

/** Only the owner moves ideas from Proposed to Discussing. */
export function BoardView({ workspaceId, cards, isOwner }: { workspaceId: string; cards: BoardCard[]; isOwner: boolean }) {
  const router = useRouter();
  const decideFlag = useQueryParam("decide");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFlagDismissed, setIsFlagDismissed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const openId = selectedId ?? (isFlagDismissed ? null : decideFlag);
  const openCard = cards.find((card) => card.id === openId);
  const ideas = cards.filter((card) => card.kind === "idea");
  const notes = cards.filter((card) => card.kind === "note");

  function runUpdate(update: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const outcome = await update();
      if (outcome.ok) router.refresh();
      else setErrorMessage(outcome.error ?? null);
    });
  }

  return (
    <PageLayout>
      <PageHeader
        icon={<KanbanSquare />}
        title={t.board.pageTitle}
        meta={format(t.board.pageMeta, { ideas: ideas.length, notes: notes.length })}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
              <Plus /> <span className="@max-2xl/header:sr-only">{t.board.addIdea}</span>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/w/${workspaceId}/brief`}>
                <FileText /> <span className="@max-2xl/header:sr-only">{t.board.briefLink}</span>
              </Link>
            </Button>
          </>
        }
      />

      <PageBody className="flex flex-col gap-6">
        {errorMessage ? (
          <p role="alert" className="rounded-lg bg-rejected-soft px-4 py-2.5 text-sm text-foreground">
            {errorMessage}
          </p>
        ) : null}
        <div className="grid content-start gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
          {IDEA_COLUMNS.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              cards={ideas.filter((card) => card.status === status)}
              onSelect={setSelectedId}
            />
          ))}
        </div>
        <BoardFooter notes={notes} />
      </PageBody>

      <AddItemDialog
        workspaceId={workspaceId}
        isOpen={isAdding}
        onOpenChange={setIsAdding}
        onAdd={() => {
          setIsAdding(false);
          router.refresh();
        }}
      />

      <DecideDialog
        key={openCard?.id}
        card={openCard}
        isOpen={Boolean(openCard)}
        onOpenChange={(isOpen) => {
          if (isOpen) return;
          setSelectedId(null);
          setIsFlagDismissed(true);
        }}
        onDiscuss={
          isOwner && openCard?.status === "proposed"
            ? () => runUpdate(() => updateIdeaToDiscussing(workspaceId, openCard.number))
            : undefined
        }
        onConfirm={(decision: Decision, reason: string) => {
          if (!openCard) return;
          runUpdate(() => updateIdeaDecision({ workspaceId, number: openCard.number, decision, reason }));
        }}
      />
    </PageLayout>
  );
}
