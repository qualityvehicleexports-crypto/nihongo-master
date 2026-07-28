"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicLearner } from "@/lib/repo/learners";
import type { LearnerSummaryCard } from "@/lib/dashboardSummary";
import { LANGUAGES } from "@/lib/i18n/languages";

// This screen (and this component) is account-owner-facing, not
// learner-facing — it's shown before a specific learner profile (and its
// ui_language) is chosen, so it's intentionally Japanese-only, same as the
// rest of src/app/dashboard/page.tsx. Per-learner localization lives on the
// pages under /dashboard/learner/[learnerId]/*.

function formatMinutesJa(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0分";
  if (totalMinutes < 60) return `${totalMinutes}分`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
}

function formatLastActiveJa(lastActiveAt: string | null): string {
  if (!lastActiveAt) return "未学習";
  // lastActiveAt is a SQLite datetime string ("YYYY-MM-DD HH:MM:SS"), UTC.
  const last = new Date(lastActiveAt.replace(" ", "T") + "Z");
  const days = Math.floor((Date.now() - last.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "今日";
  if (days === 1) return "昨日";
  return `${days}日前`;
}

export default function LearnerGrid({
  initialLearners,
  maxLearners,
  initialSummaries,
}: {
  initialLearners: PublicLearner[];
  maxLearners: number;
  initialSummaries: Record<string, LearnerSummaryCard>;
}) {
  const router = useRouter();
  const [learners, setLearners] = useState(initialLearners);
  const [summaries] = useState(initialSummaries);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [uiLanguage, setUiLanguage] = useState("ja");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Credential-issuing panel: which learner's panel is open, custom
  // ID/password overrides typed into it, and the plaintext creds just
  // returned by the server (shown once — never retrievable again after
  // this component unmounts, since only the bcrypt hash is persisted).
  const [credPanelFor, setCredPanelFor] = useState<string | null>(null);
  const [credLoginId, setCredLoginId] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credBusy, setCredBusy] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [issuedCreds, setIssuedCreds] = useState<Record<string, { loginId: string; password: string }>>({});

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

  function openCredPanel(id: string) {
    setCredError(null);
    setCredLoginId("");
    setCredPassword("");
    setCredPanelFor(credPanelFor === id ? null : id);
  }

  async function issueCredentials(id: string, reissue: boolean) {
    if (reissue && !confirm("ログイン情報を再発行しますか？現在のIDとパスワードは使えなくなります。")) return;
    setCredError(null);
    setCredBusy(true);
    try {
      const body: { loginId?: string; password?: string } = {};
      if (credLoginId.trim()) body.loginId = credLoginId.trim();
      if (credPassword.trim()) body.password = credPassword.trim();

      const res = await fetch(`/api/learners/${id}/credentials`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setCredError(data.error ?? "発行に失敗しました。");
        return;
      }
      setIssuedCreds((prev) => ({ ...prev, [id]: { loginId: data.loginId, password: data.password } }));
      setLearners((prev) => prev.map((l) => (l.id === id ? { ...l, login_id: data.loginId } : l)));
      setCredLoginId("");
      setCredPassword("");
    } finally {
      setCredBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {learners.map((learner) => {
          const summary = summaries[learner.id];
          const accuracyLabel =
            summary && summary.overallAccuracy !== null ? `${Math.round(summary.overallAccuracy * 100)}%` : "未挑戦";
          const issued = issuedCreds[learner.id];
          return (
            <div
              key={learner.id}
              className="group relative flex flex-col gap-3 rounded-2xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <button
                onClick={() => removeLearner(learner.id)}
                disabled={busy}
                className="absolute right-3 top-3 text-xs opacity-0 group-hover:opacity-100"
                style={{ color: "var(--status-critical)" }}
              >
                削除
              </button>

              <Link href={`/dashboard/learner/${learner.id}`} className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
                  style={{ background: learner.avatar_color }}
                >
                  {learner.display_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold" style={{ color: "var(--text-primary)" }}>
                    {learner.display_name}
                  </p>
                  <span
                    className="mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ background: "var(--series-1)" }}
                  >
                    {learner.current_level_code}
                  </span>
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3 text-xs" style={{ borderColor: "var(--gridline)" }}>
                <div>
                  <p style={{ color: "var(--text-muted)" }}>総学習時間</p>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {formatMinutesJa(summary?.totalMinutes ?? 0)}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--text-muted)" }}>連続学習日数</p>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {summary && summary.streakDays > 0 ? `${summary.streakDays}日` : "-"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--text-muted)" }}>正答率</p>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {accuracyLabel}
                  </p>
                </div>
                <div>
                  <p style={{ color: "var(--text-muted)" }}>最終学習</p>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {formatLastActiveJa(summary?.lastActiveAt ?? null)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-xs" style={{ borderColor: "var(--gridline)" }}>
                <span style={{ color: "var(--text-muted)" }}>
                  ログイン:{" "}
                  {learner.login_id ? (
                    <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                      {learner.login_id}
                    </span>
                  ) : (
                    "未発行"
                  )}
                </span>
                <button
                  onClick={() => openCredPanel(learner.id)}
                  className="text-xs font-semibold"
                  style={{ color: "var(--brand)" }}
                >
                  {learner.login_id ? "再発行" : "発行する"}
                </button>
              </div>

              {credPanelFor === learner.id && (
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {learner.login_id
                      ? "この学習者専用のログインID・パスワードを再発行します。空欄のままなら自動生成されます。"
                      : "この学習者専用のログインID・パスワードを発行します。空欄のままなら自動生成されます。"}
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <input
                      value={credLoginId}
                      onChange={(e) => setCredLoginId(e.target.value)}
                      placeholder="ログインID（未入力で自動生成）"
                      className="rounded-lg border px-2 py-1.5 text-xs"
                      style={{ borderColor: "var(--border)" }}
                    />
                    <input
                      value={credPassword}
                      onChange={(e) => setCredPassword(e.target.value)}
                      placeholder="パスワード（未入力で自動生成）"
                      className="rounded-lg border px-2 py-1.5 text-xs"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                  {credError && (
                    <p className="mt-2 text-xs" style={{ color: "var(--status-critical)" }}>
                      {credError}
                    </p>
                  )}
                  <button
                    onClick={() => issueCredentials(learner.id, Boolean(learner.login_id))}
                    disabled={credBusy}
                    className="mt-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    style={{ background: "var(--brand)" }}
                  >
                    {credBusy ? "発行中..." : learner.login_id ? "再発行する" : "発行する"}
                  </button>

                  {issued && (
                    <div className="mt-3 rounded-lg border p-3 text-xs" style={{ borderColor: "var(--brand)", background: "var(--surface-page)" }}>
                      <p>
                        ログインID: <span className="font-mono font-semibold">{issued.loginId}</span>
                      </p>
                      <p>
                        パスワード: <span className="font-mono font-semibold">{issued.password}</span>
                      </p>
                      <p className="mt-2" style={{ color: "var(--status-warning)" }}>
                        このパスワードは今しか表示されません。必ず控えてから学習者にお渡しください。
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!atCap && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex min-h-[9.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-2xl"
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
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        「発行する」で学習者本人用のログインID・パスワードを作成できます。学習者はこのIDでログインすると、自分の学習内容だけを見ることができ、他の学習者の内容は見えません。所有者（このアカウント）はいつでも全員分を閲覧できます。
      </p>
    </div>
  );
}
