"use client";

import { useState } from "react";

export interface DailyDatum {
  date: string;
  attempts: number;
  correct: number;
  accuracy: number; // 0..1
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD_LEFT = 36;
const PAD_BOTTOM = 24;
const PAD_TOP = 12;

export default function ProgressLineChart({ data }: { data: DailyDatum[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  if (data.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        まだ学習記録がありません。クイズに挑戦すると、ここに日ごとの正答率が表示されます。
      </p>
    );
  }

  const plotW = WIDTH - PAD_LEFT - 8;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (i: number) => PAD_LEFT + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (acc: number) => PAD_TOP + (1 - acc) * plotH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.accuracy)}`).join(" ");
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
    <div className="flex flex-col gap-3">
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
                y1={y(s)}
                y2={y(s)}
                stroke="var(--gridline)"
                strokeWidth={1}
              />
              <text x={4} y={y(s) + 4} fontSize={10} fill="var(--text-muted)">
                {Math.round(s * 100)}%
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

          <path d={linePath} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {data.map((d, i) =>
            d.attempts > 0 ? (
              <circle key={d.date} cx={x(i)} cy={y(d.accuracy)} r={hoverIdx === i ? 5 : 3} fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth={1.5} />
            ) : null,
          )}

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

          {/* x-axis labels: first, middle, last */}
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
            <div>
              正答率 {Math.round(hovered.accuracy * 100)}%（{hovered.correct}/{hovered.attempts}問）
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowTable((v) => !v)}
        className="self-start text-xs underline"
        style={{ color: "var(--text-muted)" }}
      >
        {showTable ? "表を隠す" : "表で見る"}
      </button>

      {showTable && (
        <table className="w-full text-left text-xs">
          <thead>
            <tr style={{ color: "var(--text-muted)" }}>
              <th className="py-1 pr-4">日付</th>
              <th className="py-1 pr-4">回答数</th>
              <th className="py-1 pr-4">正答数</th>
              <th className="py-1">正答率</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} style={{ color: "var(--text-primary)" }}>
                <td className="py-1 pr-4">{d.date}</td>
                <td className="py-1 pr-4">{d.attempts}</td>
                <td className="py-1 pr-4">{d.correct}</td>
                <td className="py-1">{Math.round(d.accuracy * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
