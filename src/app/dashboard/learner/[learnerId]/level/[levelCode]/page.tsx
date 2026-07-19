import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLearner } from "@/lib/repo/learners";
import { listGrammar, listVocab } from "@/lib/repo/content";

const CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: "vocabulary", label: "語彙", color: "var(--series-1)" },
  { key: "grammar", label: "文法", color: "var(--series-2)" },
  { key: "listening", label: "聴解（文字起こし）", color: "var(--series-3)" },
  { key: "reading", label: "読解", color: "var(--series-4)" },
];

export default async function LevelPage({
  params,
}: {
  params: Promise<{ learnerId: string; levelCode: string }>;
}) {
  const { learnerId, levelCode } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const learner = await getLearner(learnerId);
  if (!learner || learner.account_id !== session.accountId) notFound();

  const [vocab, grammar] = await Promise.all([listVocab(levelCode), listGrammar(levelCode)]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/dashboard/learner/${learnerId}`} className="text-sm" style={{ color: "var(--text-secondary)" }}>
          ← {learner.display_name} のホームに戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {levelCode} レベル
        </h1>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          クイズに挑戦
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/dashboard/learner/${learnerId}/quiz?levelId=${levelCode}&category=${c.key}`}
              className="flex flex-col gap-2 rounded-2xl border p-4 text-white"
              style={{ background: c.color, borderColor: "var(--border)" }}
            >
              <span className="font-bold">{c.label}</span>
              <span className="text-xs opacity-90">10問に挑戦</span>
            </Link>
          ))}
          <Link
            href={`/dashboard/learner/${learnerId}/quiz?levelId=${levelCode}`}
            className="flex flex-col gap-2 rounded-2xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)", color: "var(--text-primary)" }}
          >
            <span className="font-bold">総合クイズ</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              全カテゴリーからランダム出題
            </span>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <h3 className="mb-3 font-bold" style={{ color: "var(--text-primary)" }}>
            語彙リスト（サンプル）
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {vocab.map((v) => (
              <li key={v.id} className="flex flex-col border-b pb-2" style={{ borderColor: "var(--gridline)" }}>
                <span style={{ color: "var(--text-primary)" }}>
                  <span className="font-jp font-semibold">{v.term}</span>
                  <span style={{ color: "var(--text-muted)" }}> （{v.reading}）</span> — {v.meaning_en}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  例：{v.example_sentence}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <h3 className="mb-3 font-bold" style={{ color: "var(--text-primary)" }}>
            文法リスト（サンプル）
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {grammar.map((g) => (
              <li key={g.id} className="flex flex-col border-b pb-2" style={{ borderColor: "var(--gridline)" }}>
                <span style={{ color: "var(--text-primary)" }}>
                  <span className="font-semibold">{g.pattern}</span> — {g.meaning_en}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  例：{g.example_sentence}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
