// Màn nhập API key và chọn mô hình của workspace riêng.
import type { Metadata } from "next";
import { CircleCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader, PageLayout } from "@/components/common/page-header";
import { Panel } from "@/components/common/panel";
import { KeyForm } from "@/features/personal/key-form";
import { ModelPicker } from "@/features/personal/model-picker";
import { getProviderKey } from "@/lib/mock/queries";
import { forgetKey } from "@/lib/private-actions";
import { requireSession } from "@/lib/session";
import { requirePersonalWorkspace } from "@/lib/workspace-route";

export const metadata: Metadata = { title: "Key và mô hình" };

const PROVIDER_LABEL = { anthropic: "Anthropic", "openai-compatible": "Kiểu OpenAI" } as const;

export default async function KeyPage({ params, searchParams }: PageProps<"/w/[ws]/chat/key">) {
  await requirePersonalWorkspace(params);
  const { welcome } = await searchParams;
  const provider = welcome === "github" ? "GitHub" : welcome === "google" ? "Google" : null;
  const { user } = await requireSession();
  const key = getProviderKey(user.id);

  return (
    <PageLayout>
      <PageHeader icon={<KeyRound />} title="Key và mô hình" />
      <PageBody>
        <div className="mx-auto grid max-w-2xl gap-4">
          {provider && !key ? (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg border border-decided-line bg-decided-soft px-4 py-3 text-sm text-foreground"
            >
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-decided" />
              <span>
                Đã tạo tài khoản bằng {provider}, chào {user.displayName}. Workspace riêng của bạn đã sẵn sàng; bước còn lại là
                nhập API key.
              </span>
            </p>
          ) : null}
          {key ? (
            <Panel title="Key đang dùng">
              <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-y-2 text-sm">
                <dt className="text-subtle">Nhà cung cấp</dt>
                <dd>{PROVIDER_LABEL[key.provider]}</dd>
                {key.baseUrl ? (
                  <>
                    <dt className="text-subtle">Địa chỉ API</dt>
                    <dd className="truncate font-mono text-[13px]">{key.baseUrl}</dd>
                  </>
                ) : null}
                <dt className="text-subtle">Key</dt>
                <dd className="font-mono text-[13px]">
                  <span aria-hidden>••••••••</span>
                  <span className="sr-only">kết thúc bằng</span>
                  {key.keyLast4}
                </dd>
                <dt className="text-subtle">Lưu lúc</dt>
                <dd>{key.savedAt}</dd>
              </dl>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
                <ModelPicker models={key.models} value={key.model} />
                <form action={forgetKey}>
                  <Button type="submit" variant="ghost" size="sm" className="text-subtle hover:text-destructive">
                    Xóa key
                  </Button>
                </form>
              </div>
            </Panel>
          ) : (
            <div className="pt-2">
              <h2 className="text-xl font-semibold text-sidebar-accent-foreground">Nhập API key để bắt đầu</h2>
              <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Workspace riêng là chỗ bạn chat một mình với agent, bằng key của chính bạn. Chi phí tính vào tài khoản của bạn ở
                nhà cung cấp.
              </p>
            </div>
          )}

          <Panel title={key ? "Thay key khác" : undefined}>
            <KeyForm hasKey={Boolean(key)} defaultProvider={key?.provider ?? "anthropic"} />
          </Panel>
        </div>
      </PageBody>
    </PageLayout>
  );
}
