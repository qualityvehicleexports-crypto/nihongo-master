"use client";

import { useEffect, useRef } from "react";

// Reports active study time to /api/study-time so each learner's dashboard
// card and analytics page can show real time-on-task, not just quiz counts.
// "Active" means the tab is visible AND the window is focused — time spent
// with the tab backgrounded or the OS focused elsewhere is not counted, so
// the numbers stay honest (a learner leaving the level page open overnight
// shouldn't rack up 8 hours of "study time").
//
// Reporting is client-driven rather than session-duration-on-the-server
// because Next.js Server Components have no notion of "the user is still
// looking at this page" — only the browser knows that.
const HEARTBEAT_MS = 20_000;
const TICK_MS = 1_000;

export default function StudyTimeTracker({
  learnerId,
  activityType,
  levelId,
}: {
  learnerId: string;
  activityType: "quiz" | "browse";
  levelId: string;
}) {
  // Refs, not state: this component renders nothing and re-rendering on every
  // tick would be pure waste.
  const accumulatedSecondsRef = useRef(0);
  // Can't read `document` here — this component is SSR'd (Next.js still
  // renders "use client" components server-side on first paint), and
  // `document`/`navigator` don't exist in that environment. Start with a
  // safe default and compute the real value once mounted in the browser.
  const isActiveRef = useRef(true);

  useEffect(() => {
    accumulatedSecondsRef.current = 0;
    isActiveRef.current = document.visibilityState === "visible" && document.hasFocus();

    function flush(useBeacon: boolean) {
      const seconds = accumulatedSecondsRef.current;
      if (seconds < 1) return;
      accumulatedSecondsRef.current = 0;

      const payload = JSON.stringify({ learnerId, activityType, levelId, durationSeconds: seconds });
      if (useBeacon && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/study-time", blob);
      } else {
        fetch("/api/study-time", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {
          // Best-effort — a dropped heartbeat just means a few seconds of
          // study time go unrecorded, not worth surfacing to the learner.
        });
      }
    }

    function updateActive() {
      isActiveRef.current = document.visibilityState === "visible" && document.hasFocus();
    }

    const tickId = window.setInterval(() => {
      if (isActiveRef.current) {
        accumulatedSecondsRef.current += TICK_MS / 1000;
      }
    }, TICK_MS);

    const heartbeatId = window.setInterval(() => flush(false), HEARTBEAT_MS);

    function handleVisibilityChange() {
      updateActive();
      if (document.visibilityState === "hidden") flush(true);
    }

    window.addEventListener("focus", updateActive);
    window.addEventListener("blur", updateActive);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", () => flush(true));

    return () => {
      window.clearInterval(tickId);
      window.clearInterval(heartbeatId);
      window.removeEventListener("focus", updateActive);
      window.removeEventListener("blur", updateActive);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // SPA navigation (Next.js Link) unmounts this component without firing
      // pagehide, so flush here too or that time is silently lost.
      flush(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerId, activityType, levelId]);

  return null;
}