// Hộp thoại lưu highlight: xem và sửa đoạn đã chọn, chọn nhãn, lưu vào "Highlight của tôi".
"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/common/segmented-control";
import { saveHighlight } from "@/lib/private-actions";
import { highlightLabelMeta } from "@/lib/status";
import type { HighlightLabel } from "@/lib/types";

export interface HighlightDraft {
  conversationId: string;
  turnId: string;
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
        {draft ? <DraftForm key={`${draft.turnId}:${draft.text}`} draft={draft} onClose={onClose} onSaved={onSaved} /> : null}
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
      const result = await saveHighlight({ ...draft, text, label });
      if (result.ok) onSaved();
      else setError("Không lưu được highlight. Đoạn trống hoặc hội thoại đã bị xóa.");
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Lưu highlight</DialogTitle>
        <DialogDescription>
          Highlight chỉ đánh dấu đoạn này là đáng bàn, chưa phải ý đã chốt. Bạn gửi nó vào workspace chung bằng @ trong kênh.
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
