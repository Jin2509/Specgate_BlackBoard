// Khung "Agent đang đọc" cạnh hội thoại riêng: cho thấy đúng phần ngữ cảnh nhóm gửi kèm mỗi lời gọi mô hình.
// Gồm vai của bạn (sửa được), đội và agent của từng người, ý đã chốt/loại, tin của bạn (tự đọc) và các đoạn bạn highlight.
import Link from "next/link";
import { Hash, Highlighter, KanbanSquare, MessageSquareText, Trash2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { ActorAvatar } from "@/components/common/actor-avatar";
import { HighlightQuote } from "@/features/highlight/highlight-quote";
import { updateTeamRole } from "@/lib/channel-actions";
import type { AgentContext } from "@/lib/mock/queries";
import { sharedHome } from "@/lib/paths";
import { deleteHighlight } from "@/lib/private-actions";

export function AgentContextPanel({ ctx, userId }: { ctx: AgentContext | undefined; userId: string }) {
  if (!ctx) {
    return (
      <aside className="flex w-full flex-col gap-3 border-l border-sidebar-border bg-sidebar p-4 text-[13px] leading-relaxed text-muted-foreground">
        <h2 className="text-[13px] font-semibold text-sidebar-accent-foreground">Agent đang đọc</h2>
        <p>Chỉ hội thoại này. Agent chưa biết gì về nhóm của bạn.</p>
        <p className="text-subtle">
          Chọn một workspace chung ở ô &quot;Ngữ cảnh nhóm&quot; phía trên để agent đọc được đội, bảng ý tưởng, tin của bạn và các
          đoạn bạn highlight trong kênh.
        </p>
      </aside>
    );
  }

  const me = ctx.team.find((m) => m.profile.id === userId);
  const channelsHref = sharedHome(ctx.ws.id);

  return (
    <aside className="flex w-full flex-col border-l border-sidebar-border bg-sidebar">
      <div className="flex h-12 shrink-0 items-center border-b border-sidebar-border px-4">
        <h2 className="truncate text-[13px] font-semibold text-sidebar-accent-foreground">Agent đang đọc: {ctx.ws.name}</h2>
      </div>
      <div className="flex-1 scrollbar-thin space-y-5 overflow-y-auto p-4 text-[13px]">
        <Section icon={<Users />} title="Vai của bạn trong nhóm">
          <form action={updateTeamRole} className="flex gap-1.5">
            <input type="hidden" name="workspaceId" value={ctx.ws.id} />
            <label htmlFor="team-role" className="sr-only">
              Vai của bạn trong nhóm
            </label>
            <input
              id="team-role"
              name="teamRole"
              defaultValue={me?.teamRole ?? ""}
              placeholder="Ví dụ: Dựng khung"
              maxLength={40}
              className="h-8 min-w-0 flex-1 rounded-md border border-border bg-input px-2 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className="h-8 rounded-md border border-border px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Lưu
            </button>
          </form>
          <p className="mt-1 text-xs text-subtle">Agent của mọi thành viên đọc được vai này.</p>
        </Section>

        <Section icon={<Users />} title={`Đội (${ctx.team.length})`}>
          <ul className="space-y-2">
            {ctx.team.map((m) => (
              <li key={m.profile.id} className="flex items-start gap-2">
                <ActorAvatar kind="human" initial={m.profile.initial} size="xs" className="mt-0.5" />
                <div className="min-w-0 leading-snug">
                  <p className="text-foreground">
                    {m.profile.displayName}
                    {m.profile.id === userId ? <span className="text-subtle"> (bạn)</span> : null}
                    {m.teamRole ? <span className="text-muted-foreground">: {m.teamRole}</span> : null}
                  </p>
                  <p className="truncate font-mono text-[11.5px] text-agent">{m.agent?.model ?? "chưa có agent"}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={<KanbanSquare />} title="Bảng ý tưởng">
          <p className="text-muted-foreground">
            {ctx.decided.length} ý đã chốt, {ctx.rejected.length} ý đã loại (kèm lý do). Agent không đề xuất lại ý đã loại.
          </p>
        </Section>

        <Section icon={<MessageSquareText />} title={`Tin của bạn trong kênh (${ctx.ownMessages.length})`}>
          <p className="text-xs text-subtle">Tự đọc, không cần highlight. Gồm cả tin agent của bạn đã gửi.</p>
          <ul className="mt-1.5 space-y-1">
            {ctx.ownMessages.slice(-3).map((m, i) => (
              <li key={i} className="line-clamp-2 text-muted-foreground">
                <span className="text-subtle">#{m.channelName} · </span>
                {m.text}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={<Highlighter />} title={`Đoạn bạn highlight (${ctx.highlights.length})`}>
          {ctx.highlights.length === 0 ? (
            <p className="text-subtle">
              Chưa có. Mở{" "}
              <Link href={channelsHref} className="text-primary-strong underline-offset-2 hover:underline">
                kênh của nhóm
              </Link>{" "}
              và bôi đen đoạn bạn muốn agent đọc.
            </p>
          ) : (
            <ul className="space-y-2">
              {ctx.highlights.map((h) => (
                <li key={h.id}>
                  <HighlightQuote
                    className="max-w-none"
                    text={h.text}
                    label={h.label}
                    byline={
                      <>
                        <span className="font-medium text-muted-foreground">{h.speaker}</span> nói ·{" "}
                        <Link href={`/w/${ctx.ws.id}/c/${h.channelId}`} className="inline-flex items-center hover:underline">
                          <Hash className="size-3" />
                          {h.channelName}
                        </Link>
                      </>
                    }
                    actions={
                      <form action={deleteHighlight}>
                        <input type="hidden" name="highlightId" value={h.id} />
                        <button
                          type="submit"
                          aria-label="Bỏ highlight khỏi ngữ cảnh"
                          className="inline-flex size-6 items-center justify-center rounded text-subtle hover:bg-hover hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </form>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <p className="border-t border-sidebar-border pt-3 text-xs leading-relaxed text-subtle">
          Agent không đọc tin của người khác trừ khi bạn highlight. Không ai trong nhóm đọc được hội thoại này.
        </p>
      </div>
    </aside>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-subtle [&_svg]:size-3.5">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
