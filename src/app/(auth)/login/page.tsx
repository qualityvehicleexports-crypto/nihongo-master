"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ログインに失敗しました。");
        return;
      }
      // Owners land on the profile grid; learners go straight to their own
      // page — they never see the roster of everyone under the account.
      if (data.role === "learner") {
        router.push(`/dashboard/learner/${data.learner.id}`);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        ログイン
      </h1>

      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: "var(--text-secondary)" }}>メールアドレス または ログインID</span>
        <input
          type="text"
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          所有者の方はメールアドレス、学習者の方は発行されたログインIDを入力してください。
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: "var(--text-secondary)" }}>パスワード</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
      </label>

      {error && (
        <p className="text-sm" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full py-2 font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--brand)" }}
      >
        {loading ? "ログイン中..." : "ログイン"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        アカウントをお持ちでないですか？{" "}
        <Link href="/signup" style={{ color: "var(--brand)" }}>
          新規登録
        </Link>
      </p>
    </form>
  );
}
