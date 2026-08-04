"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t, type Dictionary } from "@/lib/i18n";
import StudyTimeTracker from "./StudyTimeTracker";
import PassProbabilityGauge from "./charts/PassProbabilityGauge";
import SpeakButton from "./SpeakButton";

interface MockExamQuestion {
  id: string;
  levelId: string;
  category: string;
  prompt: string;
  choices: string[];
}

interface SectionConfig {
  key: string;
  categories: string[];
  maxScore: number;
  minPassScore: number;
}

interface ExamStructure {
  sections: SectionConfig[];
  totalMax: number;
  totalPassMark: number;
}

interface SectionResult {
  key: string;
  categories: string[];
  rawCorrect: number;
  rawTotal: number;
  scaledScore: number;
  maxScore: number;
  minPassScore: number;
  passed: boolean;
}

interface ScoreResult {
  sections: SectionResult[];
  totalScaled: number;
  totalMax: number;
  totalPassMark: number;
  passed: boolean;
  passProbabilityPercent: number;
}

interface SubmitResult {
  questionId: string;
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

type Phase = "intro" | "loading" | "answering" | "submitting" | "results" | "error";

function sectionLabel(key: string, dict: Dictionary): string {
  switch (key) {
    case "knowledge_reading":
      return dict.mockExam.introSectionKnowledgeReading;
    case "knowledge":
      return dict.mockExam.introSectionKnowledge;
    case "reading":
      return dict.mockExam.introSectionReading;
    case "listening":
      return dict.mockExam.introSectionListening;
    default:
      return key;
  }
}

export default function MockExamRunner({
  learnerId,
  levelId,
  edition,
  learnerName,
  dict,
}: {
  learnerId: string;
  levelId: string;
  edition: number;
  learnerName: string;
  dict: Dictionary;
}) {
  const CATEGORY_LABELS: Record<string, string> = {
    vocabulary: dict.category.vocabulary,
    grammar: dict.category.grammar,
    listening: dict.category.listening,
    reading: dict.category.reading,
  };

  const [phase, setPhase] = useState<Phase>("intro");
  const [structure, setStructure] = useState<ExamStructure | null>(null);
  const [questions, setQuestions] = useState<MockExamQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [results, setResults] = useState<SubmitResult[] | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetched once up front (both for the intro screen's question count +
  // section list preview, and as the actual question set once the learner
  // presses start — no need to fetch twice).
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/mock-exam?levelId=${levelId}&edition=${edition}&learnerId=${learnerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.questions || data.questions.length === 0) {
          setErrorMsg(dict.mockExam.loadFailed);
          setPhase("error");
          return;
        }
        setStructure(data.structure);
        setQuestions(data.questions);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg(dict.mockExam.loadFailed);
          setPhase("error");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId, edition, learnerId]);

  function startExam() {
    if (questions.length === 0) return; // still loading — the start button is disabled until then
    setIndex(0);
    setSelected({});
    setResults(null);
    setScore(null);
    setPhase("answering");
  }

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
    setPhase("submitting");
    const res = await fetch("/api/mock-exam/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        learnerId,
        levelId,
        edition,
        answers: questions.map((q) => ({ questionId: q.id, selectedIndex: selected[q.id] })),
      }),
    });
    const data = await res.json();
    setResults(data.results);
    setScore(data.score);
    setPhase("results");
  }

  const tracker = <StudyTimeTracker learnerId={learnerId} activityType="quiz" levelId={levelId} />;

  if (phase === "intro") {
    return (
      <>
        {tracker}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {t(dict.mockExam.introTitle, { edition })}
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              {dict.mockExam.introDescription}
            </p>
            {questions.length > 0 && (
              <p className="mt-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {t(dict.mockExam.introQuestionCount, { count: questions.length })}
              </p>
            )}
            {structure && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {dict.mockExam.introSectionsLabel}
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {structure.sections.map((s) => (
                    <li key={s.key}>
                      {sectionLabel(s.key, dict)} — {s.categories.map((c) => CATEGORY_LABELS[c] ?? c).join("・")}
                      {" "}
                      (0-{s.maxScore})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
              {dict.mockExam.introCaveat}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startExam}
              disabled={questions.length === 0}
              className="rounded-full px-6 py-2 font-semibold text-white disabled:opacity-40"
              style={{ background: "var(--brand)" }}
            >
              {questions.length === 0 ? dict.mockExam.loading : dict.mockExam.startButton}
            </button>
            <Link
              href={`/dashboard/learner/${learnerId}/level/${levelId}`}
              className="rounded-full border px-4 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {dict.mockExam.backToLevel}
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (phase === "loading") {
    return (
      <>
        {tracker}
        <p style={{ color: "var(--text-secondary)" }}>{dict.mockExam.loading}</p>
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
            {dict.mockExam.backToLevel}
          </Link>
        </div>
      </>
    );
  }

  if (phase === "results" && results && score) {
    return (
      <>
        {tracker}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {t(dict.mockExam.resultsTitle, { name: learnerName })}
            </p>
            <p className="mt-1 text-4xl font-bold" style={{ color: "var(--brand)" }}>
              {score.totalScaled} / {score.totalMax}
            </p>
            <p
              className="mt-2 text-sm font-semibold"
              style={{ color: score.passed ? "var(--status-good)" : "var(--status-critical)" }}
            >
              {score.passed ? dict.mockExam.passResult : dict.mockExam.failResult}
            </p>
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
              {dict.mockExam.passProbabilityTitle}
            </h3>
            <div className="mt-3">
              <PassProbabilityGauge percent={score.passProbabilityPercent} weeks={null} note="" dict={dict} />
            </div>
            <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              {dict.mockExam.passProbabilityCaveat}
            </p>
          </div>

          <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
              {dict.mockExam.sectionBreakdownTitle}
            </h3>
            <div className="mt-3 flex flex-col gap-3">
              {score.sections.map((s) => (
                <div key={s.key} className="border-b pb-3 last:border-b-0" style={{ borderColor: "var(--gridline)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {sectionLabel(s.key, dict)}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: s.passed ? "var(--status-good)" : "var(--status-critical)" }}
                    >
                      {s.passed ? dict.mockExam.sectionPassed : dict.mockExam.sectionFailed}
                    </span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {t(dict.mockExam.sectionScoreLine, {
                      scaled: s.scaledScore,
                      max: s.maxScore,
                      correct: s.rawCorrect,
                      total: s.rawTotal,
                    })}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t(dict.mockExam.sectionMinNote, { min: s.minPassScore })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
              {dict.mockExam.reviewTitle}
            </h3>
            {questions.map((q, i) => {
              const r = results[i];
              if (!r) return null;
              return (
                <div
                  key={q.id}
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: r.isCorrect ? "var(--status-good)" : "var(--status-critical)",
                    background: "var(--surface-1)",
                  }}
                >
                  <p className="flex items-start gap-1.5 whitespace-pre-line text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    <span>{q.prompt}</span>
                    <SpeakButton text={q.prompt} dict={dict} size="sm" />
                  </p>
                  <p className="mt-2 text-sm">
                    <span style={{ color: r.isCorrect ? "var(--status-good)" : "var(--status-critical)" }}>
                      {r.isCorrect ? dict.mockExam.correct : dict.mockExam.incorrect}
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {" "}
                      — {t(dict.mockExam.correctAnswer, { answer: q.choices[r.correctIndex] })}
                    </span>
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
              {dict.mockExam.backToLevelButton}
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
            {levelId} ・ {t(dict.mockExam.editionLabel, { n: edition })} ・{" "}
            {CATEGORY_LABELS[current.category] ?? current.category}
          </span>
          <span>
            {index + 1} / {questions.length}
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full" style={{ background: "var(--gridline)" }}>
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%`, background: "var(--brand)" }}
          />
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <p className="flex items-start gap-2 whitespace-pre-line text-lg font-medium" style={{ color: "var(--text-primary)" }}>
            <span>{current.prompt}</span>
            <SpeakButton text={current.prompt} dict={dict} />
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
          {phase === "submitting"
            ? dict.mockExam.submitting
            : index === questions.length - 1
              ? dict.mockExam.submitButton
              : dict.mockExam.next}
        </button>
      </div>
    </>
  );
}
