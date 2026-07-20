// Status color is never the only signal: each band ships with an icon-like
// glyph and a text label alongside the color, per the accessibility rule
// that status colors must never carry meaning alone.

import { t, type Dictionary } from "@/lib/i18n";

function statusFor(pct: number, dict: Dictionary): { color: string; label: string; glyph: string } {
  if (pct >= 70) return { color: "var(--status-good)", label: dict.gauge.statusGood, glyph: "✓" };
  if (pct >= 50) return { color: "var(--status-warning)", label: dict.gauge.statusWarning, glyph: "!" };
  if (pct >= 30) return { color: "var(--status-serious)", label: dict.gauge.statusSerious, glyph: "!" };
  return { color: "var(--status-critical)", label: dict.gauge.statusCritical, glyph: "!" };
}

export default function PassProbabilityGauge({
  percent,
  weeks,
  note,
  dict,
}: {
  percent: number | null;
  weeks: number | null;
  note: string;
  dict: Dictionary;
}) {
  if (percent === null) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-3xl font-bold" style={{ color: "var(--text-muted)" }}>
          —
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {note}
        </p>
      </div>
    );
  }

  const status = statusFor(percent, dict);
  const angle = (percent / 100) * 180;
  const r = 60;
  const cx = 70;
  const cy = 70;
  const rad = (Math.PI / 180) * (180 - angle);
  const endX = cx + r * Math.cos(rad);
  const endY = cy - r * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <svg width={140} height={80}