import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAccountById } from "@/lib/repo/accounts";
import { countLearners } from "@/lib/repo/learners";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const account = await getAccountById(session.accountId);
  if (!account) redirect("/login");

  const learnerCount = await countLearners(account.id);

  return (
    <div className="flex flex-1 flex-col" style={{ background: "var(--surface-page)" }}>
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            ニホンゴマスター
          </Link>
          <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span>
              学習者 {learnerCount}/{account.max_learners}
            </span>
            <Link href="/billing" className="hover:underline">
              プラン・請求
            </Link>
            <span className="hidden sm:inline">{account.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
