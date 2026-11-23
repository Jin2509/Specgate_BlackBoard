"use client";
// Picks a PDF or Word file and posts its text to the channel.
import { LoaderCircle, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";

import { t } from "@/lib/i18n";
import { showErrorToast } from "@/stores/toast-store";

import { uploadChannelDocument } from "../api/document-upload";

const DOCUMENT_ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function ChannelDocumentButton({ workspaceId, channelId }: { workspaceId: string; channelId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    const failureMessage = await uploadChannelDocument(workspaceId, channelId, file);
    setIsUploading(false);
    if (failureMessage) return showErrorToast(failureMessage);
    router.refresh();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        onChange={(event) => void handleChange(event)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <button
        type="button"
        aria-label={t.documents.attach}
        title={t.documents.attach}
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded text-subtle transition-colors hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default"
      >
        {isUploading ? <LoaderCircle className="size-5 animate-spin" /> : <Paperclip className="size-5" />}
      </button>
    </>
  );
}
