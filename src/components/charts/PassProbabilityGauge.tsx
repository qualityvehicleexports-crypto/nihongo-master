// Status color is never the only signal: each band ships with an icon-like
// glyph and a text label alongside the color, per the accessibility rule
// that status colors must never carry meaning alone.

function statusFor(pct: number): { color: string; label: string; glyph: string } {
  if (pct >= 70) return { color: "var(--status-good)", label: "順調", glyph: "✓" };
  if (pct >= 50) return { color: "var(--status-warning)", label: "もう少し", glyph: "!" };
  if (pct >= 30) return { color: "var(--status-serious)", label: "要復習", glyph: "!" };
  return { color: "var(--status-critical)", label: "対策が必要", glyph: "!" };
}

export default function PassProbabilityGauge({
  percent,
  weeks,
  note,
}: {
  percent: number | null;
  weeks: number | null;
  note: string;
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

  const status = statusFor(percent);
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
      <svg width={140} height={80} viewBox="0 0 140 80">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--gridline)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
          fill="none"
          stroke={status.color}
          strokeWidth={10}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: status.color }}
            aria-hidden
          >
            {status.glyph}
          </span>
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {percent}%
          </p>
          <span className="text-sm font-semibold" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {weeks !== null && weeks > 0 ? `目標到達まで目安 約${weeks}週間。` : ""} {note}
        </p>
      </div>
    </div>
  );
}
