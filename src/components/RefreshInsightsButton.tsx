"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";

export default function RefreshInsightsButton({ learnerId, dict }: { learnerId: string; dict: Dictionary }) {
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