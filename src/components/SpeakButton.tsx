"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

// A small inline "play pronunciation" button, built on the browser's native
// Web Speech API (window.speechSynthesis) — no audio files, no backend
// changes. Works for any Japanese text: vocab terms, example sentences,
// grammar patterns, quiz/mock-exam question prompts.
//
// Kept deliberately tiny and self-contained so it can be dropped next to any
// piece of Japanese text without threading extra state through the parent.
export default function SpeakButton({
  text,
  dict,
  lang = "ja-JP",
  size = "md",
}: {
  text: string;
  dict: Dictionary;
  lang?: string;
  size?: "sm" | "md";
}) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    // Stop any in-flight speech from this button if the underlying text
    // changes or the component unmounts (e.g. navigating to the next
    // question) — otherwise a stale utterance keeps talking over the new one.
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (!supported) {
    return (
      <span className="text-xs" style={{ color: "var(--text-muted)" }} title={dict.audio.unsupported}>
        🔇
      </span>
    );
  }

  function handleClick() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    // Cancel anything else queued/playing first — overlapping utterances
    // from different buttons on the same page would otherwise talk over
    // each other.
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  const dimension = size === "sm" ? 14 : 18;
  const padding = size === "sm" ? "2px" : "4px";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={speaking ? dict.audio.stopPronunciation : dict.audio.playPronunciation}
      title={speaking ? dict.audio.stopPronunciation : dict.audio.playPronunciation}
      className="inline-flex shrink-0 items-center justify-center rounded-full align-middle transition-opacity hover:opacity-70"
      style={{ padding, color: speaking ? "var(--brand)" : "var(--text-muted)" }}
    >
      {speaking ? (
        <svg width={dimension} height={dimension} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
        </svg>
      ) : (
        <svg width={dimension} height={dimension} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 9v6h4l5 5V4L8 9H4z"
            fill="currentColor"
          />
          <path
            d="M16.5 8.5a5 5 0 0 1 0 7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M18.8 6.2a8.5 8.5 0 0 1 0 11.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </svg>
      )}
    </button>
  );
}
