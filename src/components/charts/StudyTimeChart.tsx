"use client";

import { useState } from "react";
import { t, type Dictionary } from "@/lib/i18n";

export interface StudyTimeDatum {
  date: string;
  minutes: number;
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD_LEFT = 36;
const PAD_BOTTOM = 24;
const PAD_TOP = 12;

// Same SVG skeleton as ProgressLineChart (gridlines, hover crosshair, x-axis
// labels), but as bars scaled to the max minutes in the window instead of a
// fixed 0-100% line — there's no natural ceiling for "minutes studied" the
// way there is for accuracy, so the scale has to follow the data.
export default function StudyTimeChart({ data, dict }: { data: StudyTimeDatum[]; dict: Dictionary }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {dict.studyTime.noData}
      </p>
    );
  }

  const plotW = WIDTH - PAD_LEFT - 8;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxMinutes = Math.max(5, ...data.map((d) => d.minutes));

  const barWidth = Math.max(3, (plotW / data.length) * 0.6);
  const x = (i: number) => PAD_LEFT + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const barHeight = (minutes: number) => (minutes / maxMinutes) * plotH;

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let best = Infinity;
    data.forEach((_, i) => {
      const dist = Math.abs(x(i) - relX);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {gridSteps.map((s) => (
          <g key={s}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - 8}
              y1={PAD_TOP + (1 - s) * plotH}
              y2={PAD_TOP + (1 - s) * plotH}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
            <text x={4} y={PAD_TOP + (1 - s) * plotH + 4} fontSize={10} fill="var(--text-muted)">
              {Math.round(s * maxMinutes)}
            </text>
          </g>
        ))}
        <line x1={PAD_LEFT} x2={PAD_LEFT} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke="var(--baseline)" strokeWidth={1} />
        <line
          x1={PAD_LEFT}
          x2={WIDTH - 8}
          y1={HEIGHT - PAD_BOTTOM}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="var(--baseline)"
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const h = barHeight(d.minutes);
          return (
            <rect
              key={d.date}
              x={x(i) - barWidth / 2}
              y={HEIGHT - PAD_BOTTOM - h}
              width={barWidth}
              height={h}
              rx={2}
              fill={hoverIdx === i ? "var(--brand)" : "var(--series-6)"}
            />
          );
        })}

        {hovered && hoverIdx !== null && (
          <line
            x1={x(hoverIdx)}
            x2={x(hoverIdx)}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--text-muted)"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}

        {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
          <text key={i} x={x(i)} y={HEIGHT - 6} fontSize={10} fill="var(--text-muted)" textAnchor="middle">
            {data[i].date.slice(5)}
          </text>
        ))}
      </svg>

      {hovered && hoverIdx !== null && (
        <div
          className="pointer-events-none absolute rounded-lg border px-2 py-1 text-xs shadow-sm"
          style={{
            left: `${(x(hoverIdx) / WIDTH) * 100}%`,
            top: 0,
            transform: "translate(-50%, -110%)",
            borderColor: "var(--border)",
            background: "var(--surface-1)",
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
          }}
        >
          <div className="font-semibold">{hovered.date}</div>
          <div>{t(dict.studyTime.minutesUnit, { minutes: hovered.minutes })}</div>
        </div>
      )}
    </div>
  );
}