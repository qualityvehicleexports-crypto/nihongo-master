import Link from "next/link";
import { getSession } from "@/lib/auth";

const FEATURES = [
  {
    title: "N5〜N1 完全網羅",
    body: "JLPT N5からN1まで、語彙・文法・聴解・読解をレベル別に学習。基礎から上級まで一つのアプリで完結します。",
  },
  {
    title: "AIによる進捗分析",
    body: "弱点分野の可視化、学習ペースと合格可能性の予測、次に取り組むべき内容のレコメンドまで、AIがあなたの学習を伴走します。",
  },
  {
    title: "1アカウントで最大20人",
    body: "家族やチームで1つのサブスクリプションをシェア。学習者ごとにプロフィールと進捗を分けて管理できます。",
  },
];

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col" style={{ background: "var(--surface-page)" }}>
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            ニホンゴマスター
          </span>
          <nav className="flex items-center gap-3 text-sm">
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 font-medium text-white"
                style={{ background: "var(--brand)" }}
              >
                ダッシュボードへ
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full px-4 py-2 font-medium text-white"
                  style={{ background: "var(--brand)" }}
                >
                  無料で始める
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16">
        <section className="flex flex-col gap-6 text-center sm:text-left">
          <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
            AI搭載 日本語学習サブスクリプション
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl" style={{ color: "var(--text-primary)" }}>
            N5からN1まで。
            <br />
            AIがあなたの弱点と学習ペースを見える化する。
          </h1>
          <p className="max-w-2xl text-lg" style={{ color: "var(--text-secondary)" }}>
            1つのアカウントで最大20人まで受講可能。家族や職場のチームで、レベルに合わせた学習を同時に進められます。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-start">
            <Link
              href="/signup"
              className="rounded-full px-6 py-3 text-center font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              14日間無料で試す
            </Link>
            <Link
              href="/billing"
              className="rounded-full border px-6 py-3 text-center font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              料金プランを見る
            </Link>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border p-6"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <h2 className="mb-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {f.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {f.body}
              </p>
            </div>
          ))}
        </section>

        <section
          className="rounded-2xl border p-8"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <h2 className="mb-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            レベル一覧
          </h2>
          <div className="grid grid-cols-5 gap-3 text-center">
            {["N5", "N4", "N3", "N2", "N1"].map((lv, i) => (
              <div
                key={lv}
                className="rounded-xl py-4 font-bold text-white"
                style={{ background: [
                  "var(--series-1)",
                  "var(--series-5)",
                  "var(--series-4)",
                  "var(--series-6)",
                  "var(--series-8)",
                ][i] }}
              >
                {lv}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            入門レベルのN5から、実務・アカデミックレベルのN1まで、段階的に学習を進められます。
          </p>
        </section>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        © {new Date().getFullYear()} ニホンゴマスター — サンプルコンテンツで動作するプロトタイプです。
      </footer>
    </div>
  );
}
