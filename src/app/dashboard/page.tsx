import { getSession } from "@/lib/auth";
import { listLearners } from "@/lib/repo/learners";
import { getAccountById } from "@/lib/repo/accounts";
import LearnerGrid from "@/components/LearnerGrid";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null; // layout already redirects

  const account = await getAccountById(session.accountId);
  const learners = await listLearners(session.accountId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          誰が学習しますか？
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          このアカウントでは最大{account?.max_learners ?? 20}人の学習者プロフィールを作成できます。
        </p>
      </div>
      <LearnerGrid initialLearners={learners} maxLearners={account?.max_learners ?? 20} />
    </div>
  );
}
