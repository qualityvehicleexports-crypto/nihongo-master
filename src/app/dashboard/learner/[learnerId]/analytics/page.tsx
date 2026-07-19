import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLearner } from "@/lib/repo/learners";
import { getAnalytics } from "@/lib/ai";
import CategoryBarChart from "@/components/charts/CategoryBarChart";
import ProgressLineChart from "@/components/charts/ProgressLineChart";
import PassProbabilityGauge from "@/components/charts/PassProbabilityGauge";
import RefreshInsightsButton from "@/components/RefreshInsightsButton";

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: "語彙",
  grammar: "文法",
  listening: "聴解",
  reading: "読解",
};
const CATEGORY_ORDER = ["vocabulary", "grammar", "listening", "reading"];

export default async function AnalyticsPage({ params }: { params: Promise<{ learnerId: string }> }) {
  const { learnerId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const learner = await getLearner(learnerId);
  if (!learner || learner.account_id !== session.accountId) notFound();

  const analytics = await getAnalytics(learnerId);

  const categoryData = CATEGORY_ORDER.map((cat) => {
    const stat = analytics.categoryStats.find((c) => c.category === cat);
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      accuracy: stat?.accuracy ?? 0,
      total: stat?.total ?? 0,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/learner/${learnerId}`} className="text-sm" style={{ color: "var(--text-secondary)" }}>
            ← {learner.display_name} のホームに戻る
          </Link>
          <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            AI進捗分析
          </h1>
        </div>
        <RefreshInsightsButton learnerId={learnerId} />
      </div>

      <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand)" }}>
          AIコーチの分析
        </p>
        <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {analytics.narrative}
        </p>
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          最終更新: {new Date(analytics.generatedAt).toLocaleString("ja-JP")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            弱点・得意分野
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            カテゴリー別の正答率
          </p>
          <CategoryBarChart data={categoryData} />
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            合格可能性・学習ペース予測
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            {learner.current_level_code} → {learner.target_level_code}
          </p>
          <PassProbabilityGauge
            percent={analytics.pace.passProbabilityPercent}
            weeks={analytics.pace.estimatedWeeksToTarget}
            note={analytics.pace.note}
          />
        </section>
      </div>

      <section className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          学習の推移（直近30日）
        </h2>
        <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          日ごとの正答率
        </p>
        <ProgressLineChart data={analytics.dailyTrend} />
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          次のおすすめ学習内容
        </h2>
        <div className="flex flex-col gap-3">
          {analytics.recommendations.map((rec, i) => (
            <Link
              key={i}
              href={
                rec.type === "level_up"
                  ? `/dashboard/learner/${learnerId}/level/${rec.levelId}`
                  : rec.type === "quiz"
                    ? `/dashboard/learner/${learnerId}/quiz?levelId=${rec.levelId}${rec.category ? `&category=${rec.category}` : ""}`
                    : `/dashboard/learner/${learnerId}/level/${rec.levelId}`
              }
              className="flex flex-col gap-1 rounded-xl border p-4 transition hover:shadow-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {rec.title}
              </span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {rec.description}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
