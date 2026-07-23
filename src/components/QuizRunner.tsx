"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t, type Dictionary } from "@/lib/i18n";
import StudyTimeTracker from "./StudyTimeTracker";

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

type Phase = "loading" | "answering" | "submitting" | "results" | "error";

export default function QuizRunner({
  learnerId,
  levelId,
  category,
  learnerName,
  dict,
}: {
  learnerId: string;
  levelId: string;
  category?: string;
  learnerName: string;
  dict: Dictionary;
}) {
  const CATEGORY_LABELS: Record<string, string> = {
    vocabulary: dict.category.vocabulary,
    grammar: dict.category.grammar,
    listening: dict.category.listening,
    reading: dict.category.reading,
  };
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
          setErrorMsg(dict.quiz.noQuestionsFound);
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
          setErrorMsg(dict.quiz.loadFailed);
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

  // Rendered as a stable sibling below (not inside any of the phase-specific
  // branches) so it stays mounted — and its accumulated-seconds ref stays
  // intact — across phase transitions like loading -> answering -> results,
  // which would otherwise each swap out the whole returned tree and reset it.
  const tracker = <StudyTimeTracker learnerId={learnerId} activityType="quiz" levelId={levelId} />;

  if (phase === "loading") {
    return (
      <>
        {tracker}
        <p style={{ color: "var(--text-secondary)" }}>{dict.quiz.loading}</p>
      </>
    );
  }

  if (phase === "error") {
    return (
      <>
        {tracker}
        <div className="flex flex-col gap-3">
          <p style={{ color: "var(--status-critical)" }}>{errorMsg}</p>
          <Link href={`/dashboard/learner/${learnerId}/level/${levelId}`} className="underline" style={{ color: "var(--brand)" }}>
            {dict.quiz.backToLevel}
          </Link>
        </div>
      </>
    );
  }

  if (phase === "results" && results) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    return (
      <>
        {tracker}
        <div className="flex flex-col gap-6">
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t(dict.quiz.resultsOf, { name: learnerName })}
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
                    {r.isCorrect ? dict.quiz.correct : dict.quiz.incorrect}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}> — {t(dict.quiz.correctAnswer, { answer: q.choices[r.correctIndex] })}</span>
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
            {dict.quiz.backToLevel}
          </Link>
          <Link
            href={`/dashboard/learner/${learnerId}/analytics`}
            className="rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            {dict.quiz.aiAnalysis}
          </Link>
        </div>
      </div>
      </>
    );
  }

  if (!current) return tracker;

  const selectedIndex = selected[current.id];

  return (
    <>
      {tracker}
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
        {phase === "submitting" ? dict.quiz.scoring : index === questions.length - 1 ? dict.quiz.scoreButton : dict.quiz.next}
      </button>
      </div>
    </>
  );
}