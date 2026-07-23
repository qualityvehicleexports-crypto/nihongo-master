import { t, type Dictionary } from "./i18n";

/** Renders a minute count as "45 min" or "2h 15m" (localized), whichever reads better. */
export function formatMinutes(dict: Dictionary, totalMinutes: number): string {
  if (totalMinutes < 60) return t(dict.studyTime.minutesUnit, { minutes: totalMinutes });
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return t(dict.studyTime.hoursMinutesUnit, { hours, minutes });
}