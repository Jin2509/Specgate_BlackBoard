// Trang gốc: điều hướng theo phiên khi proxy chưa xử lý (ví dụ sau server action).
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { homePath } from "@/lib/home-path";
import { getSession } from "@/lib/session";

export default function Home() {
  return (
    <Suspense>
      <HomeRedirect />
    </Suspense>
  );
}

async function HomeRedirect() {
  const session = await getSession();
  redirect(session ? homePath(session.user.id, await cookies()) : "/login");
  return null;
}
