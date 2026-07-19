"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          try {
            const res = await fetch("/api/billing/checkout", { method: "POST" });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url;
              return;
            }
            setMsg(data.error ?? "エラーが発生しました。");
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        className="w-fit rounded-full px-6 py-3 font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--brand)" }}
      >
        {busy ? "処理中..." : "アップグレード / お支払い方法を管理"}
      </button>
      {msg && (
        <p className="text-sm" style={{ color: "var(--status-warning)" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
