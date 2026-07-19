"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="rounded-full border px-3 py-1.5 text-sm"
      style={{ borderColor: "var(--border)" }}
    >
      ログアウト
    </button>
  );
}
