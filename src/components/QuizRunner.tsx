"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t, type Dictionary } from "@/lib/i18n";
import StudyTimeTracker from "./StudyTimeTracker";
import SpeakButton from "./SpeakButton";

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
    const qs = new URLSearchParams({ levelId, count: "10", learnerId });
if (category) qs.set("category", category);
fetch(`/api/quiz?${qs.toString()}`)
.then((res) => res.json())
@@ -78,49 +78,49 @@
return () => {
cancelled = true;
};
  }, [levelId, category]);
  }, [levelId, category, learnerId]);

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
