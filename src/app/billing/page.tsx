import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getAccountById } from "@/lib/repo/accounts";
import { countLearners } from "@/lib/repo/learners";
import CheckoutButton from "@/components/CheckoutButton";

export default async function BillingPage() {
  const session = await getSession();
  const account = session ? await getAccountById(session.accountId) : null;
  const learnerCount = account ? await countLearners(account.id) : 0;

  return (
    <div className="flex flex-1 flex-col" style={{ background: "var(--surface-page)" }}>
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            ニホンゴマスター
          </Link>
          {account ? (
            <Link href="/dashboard" className="text-sm" style={{ color: "var(--brand)" }}>
              ダッシュボードへ
            </Link>
          ) : (
            <Link href="/login" className="text-sm" style={{ color: "var(--brand)" }}>
              ログイン
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          料金プラン
        </h1>

        <div className="rounded-2xl border p-8" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
            ファミリー・チームプラン
          </p>
          <p className="mt-2 text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
            ¥2,980<span className="text-base font-normal" style={{ color: "var(--text-secondary)" }}>/月</span>
          </p>
          <ul className="mt-6 flex flex-col gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
            <li>✓ 1アカウントで学習者プロフィールを最大20人まで作成可能</li>
            <li>✓ N5〜N1 全レベルの語彙・文法・聴解・読解コンテンツ</li>
            <li>✓ AIによる弱点分析・学習ペース予測・次の学習内容レコメンド</li>
            <li>✓ 学習者ごとの個別進捗管理</li>
          </ul>

          {account ? (
            <div className="mt-8 flex flex-col gap-2">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                現在のステータス:{" "}
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {account.subscription_status}
                </span>{" "}
                ・ 学習者 {learnerCount}/{account.max_learners}
              </p>
              <CheckoutButton />
            </div>
          ) : (
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full px-6 py-3 text-center font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              14日間無料で試す
            </Link>
          )}
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          ※ このプロトタイプではStripeの本番決済は未接続です。STRIPE_SECRET_KEY /
          STRIPE_PRICE_ID_FAMILY_20 を環境変数に設定すると実際のCheckoutが有効になります。
        </p>
      </main>
    </div>
  );
}
