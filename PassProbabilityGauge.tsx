"use client";

// Weak-point visualization: horizontal bar chart, accuracy % per skill category.
// Fixed categorical order (never cycled): vocabulary -> series-1 (blue),
// grammar -> series-2 (green), listening -> series-3 (magenta), reading ->
// series-4 (yellow). Magenta/yellow sit below the 3:1 light-surface contrast
// floor per the palette's own notes, so every bar carries a direct % label
// (the "relief rule") rather than relying on color/legend alone.

export interface CategoryDatum {
  category: string;
  label: string;
  accuracy: number; // 0..1
  total: number;
}

const COLORS: Record<string, string> = {
  vocabulary: "var(--series-1)",
  grammar: "var(--series-2)",
  listening: "var(--series-3)",
  reading: "var(--series-4)",
};

export default function CategoryBarChart({ data }: { data: CategoryDatum[] }) {
  const gridSteps = [0, 25, 50, 75, 100];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        {/* gridlines */}
        <div className="pointer-events-none absolute inset-0 ml-24">
          <div className="relative h-full">
            {gridSteps.map((s) => (
              <div
                key={s}
                className="absolute top-0 bottom-0 border-l"
                style={{ left: `${s}%`, borderColor: "var(--gridline)" }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {data.map((d) => {
            const pct = Math.round(d.accuracy * 100);
            const hasData = d.total > 0;
            return (
              <div key={d.category} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {d.label}
                </span>
                <div className="relative h-6 flex-1">
                  <div
                    className="h-6 rounded-r-[4px]"
                    style={{
                      width: hasData ? `${Math.max(pct, 3)}%` : "100%",
                      background: hasData ? COLORS[d.category] : "var(--gridline)",
                      minWidth: 4,
                    }}
                  />
                  <span
                    className="absolute top-1/2 -translate-y-1/2 text-xs font-semibold"
                    style={{
                      left: hasData ? `calc(${Math.max(pct, 3)}% + 8px)` : "8px",
                      color: "var(--text-primary)",
                    }}
                  >
                    {hasData ? `${pct}%（${d.total}問）` : "未挑戦"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="ml-24 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        {gridSteps.map((s) => (
          <span key={s}>{s}%</span>
        ))}
      </div>
    </div>
  );
}
