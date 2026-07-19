"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstLearnerName, setFirstLearnerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, firstLearnerName: firstLearnerName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "登録に失敗しました。");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        アカウントを作成
      </h1>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        14日間無料。1アカウントで最大20人の学習者プロフィールを作成できます。
      </p>

      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: "var(--text-secondary)" }}>メールアドレス</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: "var(--text-secondary)" }}>パスワード（8文字以上）</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span style={{ color: "var(--text-secondary)" }}>最初の学習者の名前（任意）</span>
        <input
          type="text"
          value={firstLearnerName}
          onChange={(e) => setFirstLearnerName(e.target.value)}
          placeholder="例：太郎"
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
        {loading ? "作成中..." : "アカウントを作成"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        すでにアカウントをお持ちですか？{" "}
        <Link href="/login" style={{ color: "var(--brand)" }}>
          ログイン
        </Link>
      </p>
    </form>
  );
}
