import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLearner } from "@/lib/repo/learners";
import { getAnalytics } from "@/lib/ai";
import CategoryBarChart from "@/components/charts/CategoryBarChart";
import ProgressLineChart from "@/components/charts/ProgressLineChart";
import PassProbabilityGauge from "@/components/charts/PassProbabilityGauge";
import RefreshInsightsButton from "@/components/RefreshInsightsButton";
import { getDictionary, t, localeTag } from "@/lib/i18n";

const CATEGORY_ORDER = ["vocabulary", "grammar", "listening", "reading"];

export default async function AnalyticsPage({ params }: { params: Promise<{ learnerId: string }> }) {
  const { learnerId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const learner = await getLearner(learnerId);
  if (!learner || learner.account_id !== session.accountId) notFound();

  const analytics = await getAnalytics(learnerId);
  const dict = getDictionary(learner.ui_language);
  const CATEGORY_LABELS: Record<string, string> = {
    vocabulary: dict.category.vocabulary,
    grammar: dict.category.grammar,
    listening: dict.category.listening,
    reading: dict.category.reading,
  };

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
            {t(dict.analytics.backToHome, { name: learner.display_name })}
          </Link>
          <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {dict.analytics.title}
          </h1>
        </div>
        <RefreshInsightsButton learnerId={learnerId} dict={dict} />
      </div>

      <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand)" }}>
          {dict.analytics.coachAnalysis}
        </p>
        <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {analytics.narrative}
        </p>
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          {t(dict.analytics.lastUpdated, { date: new Date(analytics.generatedAt).toLocaleString(localeTag(learner.ui_language)) })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {dict.analytics.weakStrongTitle}
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            {dict.analytics.weakStrongSubtitle}
          </p>
          <CategoryBarChart data={categoryData} />
        </section>

        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {dict.analytics.paceTitle}
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            {learner.current_level_code} → {learner.target_level_code}
          </p>
          <PassProbabilityGauge
            percent={analytics.pace.passProbabilityPercent}
            weeks={analytics.pace.estimatedWeeksToTarget}
            note={analytics.pace.note}
            dict={dict}
          />
        </section>
      </div>

      <section className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {dict.analytics.trendTitle}
        </h2>
        <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          {dict.analytics.trendSubtitle}
        </p>
        <ProgressLineChart data={analytics.dailyTrend} dict={dict} />
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <h2 className="mb-4 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {dict.analytics.recommendationsTitle}
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