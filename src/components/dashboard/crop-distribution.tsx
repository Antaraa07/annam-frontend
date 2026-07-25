"use client";

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, PieChart, Pie } from "recharts";
import { Sprout, BarChart2 } from "lucide-react";
import type { Dataset } from "@/types/dataset";

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#f97316", "#0ea5e9", "#14b8a6", "#71717a"];
const GRADIENT_BORDERS = [
  "hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.08)]",
  "hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.08)]",
  "hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.08)]",
  "hover:border-violet-500/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.08)]",
  "hover:border-pink-500/40 hover:shadow-[0_0_15px_rgba(236,72,153,0.08)]",
  "hover:border-orange-500/40 hover:shadow-[0_0_15px_rgba(249,115,22,0.08)]"
];

interface Props {
  datasets: Dataset[];
  isLoading?: boolean;
  variant?: "dashboard" | "analytics";
}

export default function CropDistribution({ datasets, isLoading = false, variant = "dashboard" }: Props) {
  const { typeData, nameData, totalCount } = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    const nameCounts: Record<string, { count: number; type: string }> = {};
    let count = 0;

    datasets.forEach((d) => {
      let t = (d.crop_type || "").trim();
      let n = (d.crop_name || "").trim();

      // Completely filter out unspecified / NA crop types
      if (t === "" || t.toUpperCase() === "NA" || t.toLowerCase() === "not specified") {
        return;
      }

      if (n === "" || n.toUpperCase() === "NA" || n.toLowerCase() === "not specified") {
        n = "Unspecified Variety";
      }

      count += 1;
      typeCounts[t] = (typeCounts[t] || 0) + 1;
      
      if (!nameCounts[n]) {
        nameCounts[n] = { count: 0, type: t };
      }
      nameCounts[n].count += 1;
    });

    const typeData = Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const nameData = Object.entries(nameCounts)
      .map(([name, info]) => ({ name, count: info.count, type: info.type }))
      .sort((a, b) => b.count - a.count);

    return { typeData, nameData, totalCount: count };
  }, [datasets]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-[340px] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-md">
      {/* Header section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/20">
            <Sprout className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Crop Type Distribution</h2>
            <p className="text-[13px] text-zinc-400 mt-0.5">
              {variant === "dashboard" 
                ? "Key categorical metrics and varieties overview." 
                : "Comparative analytics of crop groupings across database records."}
            </p>
          </div>
        </div>
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-zinc-500 py-12 text-center">No crop type classifications recorded yet.</p>
      ) : variant === "dashboard" ? (
        /* ==================== 1. DASHBOARD VIEW (Interactive Cards Grid) ==================== */
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {typeData.map((entry, index) => {
              const color = CHART_COLORS[index % CHART_COLORS.length];
              const borderHover = GRADIENT_BORDERS[index % GRADIENT_BORDERS.length];
              const percent = Math.round((entry.value / totalCount) * 100);
              // Find varieties for this crop type
              const cropVarieties = nameData.filter(item => item.type === entry.name).slice(0, 2);

              return (
                <div 
                  key={entry.name} 
                  className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/45 p-4 transition-all duration-300 ${borderHover}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm font-semibold text-white truncate">{entry.name}</span>
                    </div>
                    <span className="rounded-lg bg-zinc-900 px-2 py-0.5 text-[11px] font-bold text-zinc-400 shrink-0">
                      {percent}%
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white font-mono">{entry.value}</span>
                    <span className="text-xs text-zinc-500">records</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ backgroundColor: color, width: `${percent}%` }}
                    />
                  </div>

                  {/* Inline varieties summary */}
                  {cropVarieties.length > 0 && (
                    <div className="mt-4 border-t border-zinc-900/60 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Varieties:</p>
                      <div className="flex flex-wrap gap-1">
                        {cropVarieties.map(v => (
                          <span 
                            key={v.name} 
                            className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300 font-medium"
                          >
                            {v.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mini total overview indicator */}
          <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4 text-xs text-zinc-500">
            <span>Total specified records analyzed</span>
            <span className="font-bold text-emerald-400 font-mono">{totalCount} items</span>
          </div>
        </div>
      ) : (
        /* ==================== 2. ANALYTICS VIEW (Horizontal Chart + List Panel) ==================== */
        <div className="grid gap-6 md:grid-cols-2 items-center">
          {/* Horizontal Bar Chart Layout */}
          <div className="flex flex-col items-center">
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ top: 5, right: 15, left: -5, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} axisLine={false} tickLine={false} width={100} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "10px",
                      color: "#f4f4f5",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                    {typeData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Legend table list */}
            <div className="mt-4 w-full space-y-1.5 max-h-36 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]">
              {typeData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-xs bg-zinc-950/40 border border-zinc-800/40 rounded-lg px-2.5 py-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-zinc-300 font-medium truncate">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-zinc-500 font-mono">{entry.value}</span>
                    <span className="text-white font-semibold">{Math.round((entry.value / totalCount) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Varieties Breakdown */}
          <div className="flex flex-col h-full justify-start border-l border-zinc-800/40 pl-0 md:pl-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
              <BarChart2 size={13} className="text-emerald-400" />
              Crop Names Breakdown
            </h3>
            {nameData.length === 0 ? (
              <p className="text-xs text-zinc-500 py-12 text-center">No specific crop names found.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]">
                {nameData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs bg-zinc-950/40 border border-zinc-800/40 rounded-xl px-3.5 py-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-medium truncate">{item.name}</span>
                      <span className="text-[10px] text-zinc-500 truncate">{item.type}</span>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold shrink-0">{item.count} items</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
