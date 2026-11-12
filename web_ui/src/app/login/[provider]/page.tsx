// Bước của nhà cung cấp OAuth (giả lập trang Google/GitHub cho tới khi có Supabase Auth):
// chọn tài khoản đã đăng ký để đăng nhập, hoặc ?intent=signup để tạo tài khoản mới.
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { AuthScreen } from "@/features/login/auth-screen";
import { AccountChooser } from "@/features/login/account-chooser";
import { AUTH_PROVIDERS, isAuthProvider, providerMeta } from "@/features/login/providers";
import { SignUpForm } from "@/features/login/signup-form";
import { getOAuthAccounts } from "@/lib/mock/queries";

export const metadata: Metadata = { title: "Google hoặc GitHub" };

export function generateStaticParams() {
  return AUTH_PROVIDERS.map((provider) => ({ provider }));
}

export default function ProviderPage({ params, searchParams }: PageProps<"/login/[provider]">) {
  return (
    <AuthScreen className="max-w-110">
      <Suspense fallback={<div className="h-80" />}>
        <ProviderStep params={params} searchParams={searchParams} />
      </Suspense>
    </AuthScreen>
  );
}

async function ProviderStep({
  params,
  searchParams,
}: {
  params: Promise<{ provider: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { provider } = await params;
  if (!isAuthProvider(provider)) notFound();
  const query = await searchParams;
  const signup = query.intent === "signup";
  const next = typeof query.next === "string" ? query.next : "";
  const withNext = (extra: string) => {
    const p = new URLSearchParams(extra);
    if (next) p.set("next", next);
    const q = p.toString();
    return q ? `?${q}` : "";
  };
  const meta = providerMeta[provider];

  if (signup) {
    return (
      <>
        <Header
          icon={meta.icon("size-6")}
          title={`Đăng ký bằng ${meta.label}`}
          lead={
            provider === "github"
              ? "SpecGate sẽ dùng tên GitHub và tên hiển thị của bạn."
              : "SpecGate sẽ dùng email Google và tên hiển thị của bạn."
          }
        />
        <SignUpForm provider={provider} />
        <Footer label={meta.label}>
          Đã có tài khoản?{" "}
          <Link href={`/login/${provider}${withNext("")}`} className="text-primary-strong hover:underline">
            Đăng nhập
          </Link>
        </Footer>
      </>
    );
  }

  const accounts = getOAuthAccounts(provider).map((a) => ({
    userId: a.userId,
    login: a.login,
    displayName: a.profile.displayName,
    initial: a.profile.initial,
  }));

  return (
    <>
      <Header icon={meta.icon("size-6")} title={`Đăng nhập bằng ${meta.label}`} lead="Chọn tài khoản để tiếp tục tới SpecGate" />
      <AccountChooser provider={provider} accounts={accounts} />
      <Link
        href={`/login/${provider}${withNext("intent=signup")}`}
        className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <UserPlus className="size-4 shrink-0" />
        Dùng tài khoản {meta.label} khác, chưa đăng ký
      </Link>
      <Footer label={meta.label}>
        <Link href="/login" className="text-primary-strong hover:underline">
          Đổi cách đăng nhập
        </Link>
      </Footer>
    </>
  );
}

function Header({ icon, title, lead }: { icon: ReactNode; title: string; lead: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">{icon}</span>
      <h1 className="mt-4 text-xl font-semibold text-sidebar-accent-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{lead}</p>
    </div>
  );
}

function Footer({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="mt-5 text-center text-xs leading-relaxed text-subtle">
      {children}
      <br />
      Màn giả lập: khi nối Supabase Auth, bước này là trang thật của {label}.
    </p>
  );
}
