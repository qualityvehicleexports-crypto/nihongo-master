"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface QuizQuestion {
  id: string;
  levelId: string;
  category: string;
  prompt: string;
  choices: string[];
}

interface SubmitResult {
  questionId: string;
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: "語彙",
  grammar: "文法",
  listening: "聴解",
  reading: "読解",
};

type Phase = "loading" | "answering" | "submitting" | "results" | "error";

export default function QuizRunner({
  learnerId,
  levelId,
  category,
  learnerName,
}: {
  learnerId: string;
  levelId: string;
  category?: string;
  learnerName: string;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [results, setResults] = useState<SubmitResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase("loading");
    const qs = new URLSearchParams({ levelId, count: "10" });
    if (category) qs.set("category", category);
    fetch(`/api/quiz?${qs.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.questions || data.questions.length === 0) {
          setErrorMsg("この条件のクイズ問題が見つかりませんでした。");
          setPhase("error");
          return;
        }
        setQuestions(data.questions);
        setIndex(0);
        setSelected({});
        setResults(null);
        setPhase("answering");
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg("問題の読み込みに失敗しました。");
          setPhase("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [levelId, category]);

  const current = questions[index];

  function choose(choiceIndex: number) {
    if (!current) return;
    setSelected((prev) => ({ ...prev, [current.id]: choiceIndex }));
  }

  async function next() {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      return;
    }
    // submit
    setPhase("submitting");
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        learnerId,
        answers: questions.map((q) => ({ questionId: q.id, selectedIndex: selected[q.id] })),
      }),
    });
    const data = await res.json();
    setResults(data.results);
    setPhase("results");
  }

  if (phase === "loading") {
    return <p style={{ color: "var(--text-secondary)" }}>問題を読み込んでいます...</p>;
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-3">
        <p style={{ color: "var(--status-critical)" }}>{errorMsg}</p>
        <Link href={`/dashboard/learner/${learnerId}/level/${levelId}`} className="underline" style={{ color: "var(--brand)" }}>
          レベルページに戻る
        </Link>
      </div>
    );
  }

  if (phase === "results" && results) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {learnerName} さんの結果
          </p>
          <p className="mt-1 text-4xl font-bold" style={{ color: "var(--brand)" }}>
            {correctCount} / {results.length}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {questions.map((q, i) => {
            const r = results[i];
            return (
              <div
                key={q.id}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: r.isCorrect ? "var(--status-good)" : "var(--status-critical)",
                  background: "var(--surface-1)",
                }}
              >
                <p className="whitespace-pre-line text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {q.prompt}
                </p>
                <p className="mt-2 text-sm">
                  <span style={{ color: r.isCorrect ? "var(--status-good)" : "var(--status-critical)" }}>
                    {r.isCorrect ? "正解" : "不正解"}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}> — 正答: {q.choices[r.correctIndex]}</span>
                </p>
                {r.explanation && (
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {r.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/learner/${learnerId}/level/${levelId}`}
            className="rounded-full border px-4 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            レベルページに戻る
          </Link>
          <Link
            href={`/dashboard/learner/${learnerId}/analytics`}
            className="rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            AI分析を見る
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const selectedIndex = selected[current.id];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
        <span>
          {levelId} ・ {CATEGORY_LABELS[current.category] ?? current.category}
        </span>
        <span>
          {index + 1} / {questions.length}
        </span>
      </div>

      <div
        className="h-1.5 w-full rounded-full"
        style={{ background: "var(--gridline)" }}
      >
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%`, background: "var(--brand)" }}
        />
      </div>

      <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
        <p className="whitespace-pre-line text-lg font-medium" style={{ color: "var(--text-primary)" }}>
          {current.prompt}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {current.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            className="rounded-xl border px-4 py-3 text-left text-sm"
            style={{
              borderColor: selectedIndex === i ? "var(--brand)" : "var(--border)",
              background: selectedIndex === i ? "rgba(42,120,214,0.08)" : "var(--surface-1)",
              color: "var(--text-primary)",
            }}
          >
            {choice}
          </button>
        ))}
      </div>

      <button
        onClick={next}
        disabled={selectedIndex === undefined || phase === "submitting"}
        className="self-end rounded-full px-6 py-2 font-semibold text-white disabled:opacity-40"
        style={{ background: "var(--brand)" }}
      >
        {phase === "submitting" ? "採点中..." : index === questions.length - 1 ? "採点する" : "次へ"}
      </button>
    </div>
  );
}
