import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLearner } from "@/lib/repo/learners";
import { listLevels } from "@/lib/repo/content";
import { getAnalytics } from "@/lib/ai";
import { getDictionary, t } from "@/lib/i18n";
import LanguagePicker from "@/components/LanguagePicker";

const LEVEL_COLORS: Record<string, string> = {
  N5: "var(--series-1)",
  N4: "var(--series-5)",
  N3: "var(--series-4)",
  N2: "var(--series-6)",
  N1: "var(--series-8)",
};

export default async function LearnerHomePage({ params }: { params: Promise<{ learnerId: string }> }) {
  const { learnerId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const learner = await getLearner(learnerId);
  if (!learner || learner.account_id !== session.accountId) notFound();

  const [levels, analytics] = await Promise.all([listLevels(), getAnalytics(learnerId)]);
  const dict = getDictionary(learner.ui_language);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
            style={{ background: learner.avatar_color }}
          >
            {learner.display_name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {learner.display_name}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {dict.learnerHome.currentLevel}: {learner.current_level_code} ・ {dict.learnerHome.target}: {learner.target_level_code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguagePicker learnerId={learnerId} currentLanguage={learner.ui_language} />
          <Link
            href={`/dashboard/learner/${learnerId}/analytics`}
            className="rounded-full border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            {dict.learnerHome.aiAnalysis}
          </Link>
          <Link href="/dashboard" className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            {dict.learnerHome.backToProfiles}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--brand)" }}>
          {dict.learnerHome.aiCoachNote}
        </p>
        <p className="mt-2 text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {analytics.narrative}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {dict.learnerHome.chooseLevel}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {levels.map((level) => {
            const stat = analytics.levelStats.find((l) => l.levelId === level.id);
            return (
              <Link
                key={level.id}
                href={`/dashboard/learner/${learnerId}/level/${level.id}`}
                className="flex flex-col gap-2 rounded-2xl border p-4 transition hover:shadow-sm"
                style={{
                  borderColor: level.id === learner.current_level_code ? "var(--brand)" : "var(--border)",
                  background: "var(--surface-1)",
                }}
              >
                <span
                  className="inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-bold text-white"
                  style={{ background: LEVEL_COLORS[level.id] }}
                >
                  {level.id}
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {level.name_en}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {stat
                    ? t(dict.learnerHome.accuracyWithCount, { pct: Math.round(stat.accuracy * 100), total: stat.total })
                    : dict.learnerHome.notAttempted}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}