"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshInsightsButton({ learnerId }: { learnerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      onClick={async () => {
        setBusy(true);
        try {
          await fetch(`/api/ai/insights/${learnerId}?refresh=1`);
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
      className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
    >
      {busy ? "更新中..." : "分析を更新"}
    </button>
  );
}
