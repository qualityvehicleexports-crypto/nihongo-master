import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAccountById } from "@/lib/repo/accounts";
import { countLearners, getLearner } from "@/lib/repo/learners";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const account = await getAccountById(session.accountId);
  if (!account) redirect("/login");

  const isOwner = session.role === "owner";
  const homeHref = isOwner ? "/dashboard" : `/dashboard/learner/${session.learnerId}`;
  const learnerCount = isOwner ? await countLearners(account.id) : null;
  // Owner-only header info (plan, billing link, everyone's headcount) never
  // renders for a learner session — a learner's header shows only their own
  // name, nothing about the account they belong to.
  const currentLearner = isOwner ? null : await getLearner(session.learnerId);

  return (
    <div className="flex flex-1 flex-col" style={{ background: "var(--surface-page)" }}>
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href={homeHref} className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            ニホンゴマスター
          </Link>
          <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            {isOwner ? (
              <>
                <span>
                  学習者 {learnerCount}/{account.max_learners}
                </span>
                <Link href="/billing" className="hover:underline">
                  プラン・請求
                </Link>
                <span className="hidden sm:inline">{account.email}</span>
              </>
            ) : (
              currentLearner && <span className="hidden sm:inline">{currentLearner.display_name}</span>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
