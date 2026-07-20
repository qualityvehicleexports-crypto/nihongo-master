"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@/lib/i18n/languages";

// Account-owner-facing control (see src/lib/i18n/languages.ts for the ja/en
// split rationale), so the label itself stays bilingual Japanese/English
// rather than pulling from the learner's own dictionary — the person
// clicking this is usually the account owner setting it up on the
// learner's behalf, not the learner themselves.
export default function LanguagePicker({
  learnerId,
  currentLanguage,
}: {
  learnerId: string;
  currentLanguage: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(currentLanguage);

  async function changeLanguage(next: string) {
    setValue(next);
    setBusy(true);
    try {
      await fetch(`/api/learners/${learnerId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uiLanguage: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => changeLanguage(e.target.value)}
      className="rounded-full border px-3 py-2 text-sm disabled:opacity-60"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--surface-1)" }}
      aria-label="Language / 言語"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.nativeName === l.nameJa ? l.nativeName : `${l.nativeName} / ${l.nameJa}`}
        </option>
      ))}
    </select>
  );
}
