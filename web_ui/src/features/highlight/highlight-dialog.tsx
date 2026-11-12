// Hộp thoại lưu highlight trong kênh chung: xem và sửa đoạn đã chọn, chọn nhãn. Đoạn vào ngữ cảnh của agent riêng.
"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/common/segmented-control";
import { saveHighlight } from "@/lib/channel-actions";
import { highlightLabelMeta } from "@/lib/status";
import type { HighlightLabel } from "@/lib/types";

export interface HighlightDraft {
  workspaceId: string;
  channelId: string;
  messageId: string;
  speaker: string;
  text: string;
}

const LABELS: HighlightLabel[] = ["important", "review"];

export function HighlightDialog({
  draft,
  onClose,
  onSaved,
}: {
  draft: HighlightDraft | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        {draft ? <DraftForm key={`${draft.messageId}:${draft.text}`} draft={draft} onClose={onClose} onSaved={onSaved} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function DraftForm({ draft, onClose, onSaved }: { draft: HighlightDraft; onClose: () => void; onSaved: () => void }) {
  const [text, setText] = useState(draft.text);
  const [label, setLabel] = useState<HighlightLabel>("important");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const { workspaceId, channelId, messageId } = draft;
      const result = await saveHighlight({ workspaceId, channelId, messageId, text, label });
      if (result.ok) onSaved();
      else setError(result.error);
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Highlight cho agent của bạn</DialogTitle>
        <DialogDescription>
          Agent ở workspace riêng của bạn sẽ đọc đoạn này và biết người nói là{" "}
          <span className="font-medium text-foreground">{draft.speaker}</span>. Highlight chỉ để bạn đọc, chưa phải ý đã chốt.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="hl-text" className="text-[13px] font-semibold text-muted-foreground">
          Đoạn được chọn
        </Label>
        <Textarea id="hl-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted-foreground">Nhãn</span>
        <SegmentedControl
          aria-label="Nhãn highlight"
          value={label}
          onChange={setLabel}
          className="inline-flex w-fit gap-0.5 p-0.5"
          itemClassName="px-3 py-1.5 text-sm"
          options={LABELS.map((l) => ({ value: l, label: highlightLabelMeta[l].label }))}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={save} disabled={pending || !text.trim()}>
          {pending ? <LoaderCircle className="animate-spin" /> : null} Lưu highlight
        </Button>
      </DialogFooter>
    </>
  );
}
