"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Learner } from "@/lib/repo/learners";
import { LANGUAGES } from "@/lib/i18n/languages";

export default function LearnerGrid({
  initialLearners,
  maxLearners,
}: {
  initialLearners: Learner[];
  maxLearners: number;
}) {
  const router = useRouter();
  const [learners, setLearners] = useState(initialLearners);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [uiLanguage, setUiLanguage] = useState("ja");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const atCap = learners.length >= maxLearners;

  async function addLearner(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/learners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: name, uiLanguage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "追加に失敗しました。");
        return;
      }
      setLearners((prev) => [...prev, data.learner]);
      setName("");
      setAdding(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeLearner(id: string) {
    if (!confirm("この学習者プロフィールを削除しますか？進捗データも削除されます。")) return;
    setBusy(true);
    try {
      await fetch(`/api/learners/${id}`, { method: "DELETE" });
      setLearners((prev) => prev.filter((l) => l.id !== id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
        {learners.map((learner) => (
          <div key={learner.id} className="group relative flex flex-col items-center gap-2">
            <Link href={`/dashboard/learner/${learner.id}`} className="flex flex-col items-center gap-2">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                style={{ background: learner.avatar_color }}
              >
                {learner.display_name.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {learner.display_name}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                style={{ background: "var(--series-1)" }}
              >
                {learner.current_level_code}
              </span>
            </Link>
            <button
              onClick={() => removeLearner(learner.id)}
              disabled={busy}
              className="text-xs opacity-0 group-hover:opacity-100"
              style={{ color: "var(--status-critical)" }}
            >
              削除
            </button>
          </div>
        ))}

        {!atCap && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex h-20 w-20 flex-col items-center justify-center gap-2 self-start rounded-2xl border-2 border-dashed text-2xl"
            style={{ borderColor: "var(--baseline)", color: "var(--text-muted)" }}
          >
            +
          </button>
        )}
      </div>

      {atCap && (
        <p className="text-sm" style={{ color: "var(--status-warning)" }}>
          このプランの上限（{maxLearners}人）に達しています。増やすには「プラン・請求」からアップグレードしてください。
        </p>
      )}

      {adding && (
        <form onSubmit={addLearner} className="flex max-w-sm flex-col gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--text-secondary)" }}>学習者の名前</span>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)" }}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span style={{ color: "var(--text-secondary)" }}>学習者の言語 / Language</span>
            <select
              value={uiLanguage}
              onChange={(e) => setUiLanguage(e.target.value)}
              className="rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border)" }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName === l.nameJa ? l.nativeName : `${l.nativeName} / ${l.nameJa}`}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className="text-sm" style={{ color: "var(--status-critical)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--brand)" }}
            >
              追加
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
              className="rounded-full border px-4 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </div>
  );
}