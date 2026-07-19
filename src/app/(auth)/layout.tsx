import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12" style={{ background: "var(--surface-page)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            ニホンゴマスター
          </Link>
        </div>
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
