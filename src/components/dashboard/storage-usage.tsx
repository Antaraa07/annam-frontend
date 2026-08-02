"use client";

import { motion } from "framer-motion";
import { HardDrive, Layers } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import type { StorageUsageBreakdownItem, StorageUsageResponse } from "@/types/dashboard-v2";

const BREAKDOWN_COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#f43f5e"];

function StorageRing({ usedPct }: { usedPct: number }) {
  const freeRatio = Math.max(0, 100 - usedPct);
  const data = [
    { name: "Used",  value: usedPct   },
    { name: "Free",  value: freeRatio },
  ];

  const color = usedPct >= 90 ? "#f43f5e" : usedPct >= 70 ? "#f59e0b" : "#10b981";
  const glowColor = usedPct >= 90 ? "rgba(244,63,94,0.4)" : usedPct >= 70 ? "rgba(245,158,11,0.4)" : "rgba(16,185,129,0.4)";

  return (
    <div className="relative mx-auto h-36 w-36 flex items-center justify-center">
      {/* Background glowing halo */}
      <div 
        className="pointer-events-none absolute h-24 w-24 rounded-full blur-xl opacity-40 transition-colors duration-500" 
        style={{ backgroundColor: color }} 
      />
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <Pie
            data={data}
            innerRadius={44}
            outerRadius={60}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} filter="url(#ringGlow)" />
            <Cell fill="#18181b" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-white font-mono tracking-tight" style={{ textShadow: `0 0 12px ${glowColor}` }}>
          {usedPct.toFixed(0)}%
        </span>
        <span className="text-[10px] font-bold text-zinc-400 mt-0.5 uppercase tracking-widest">used</span>
      </div>
    </div>
  );
}

function BreakdownBar({ item, index }: { item: StorageUsageBreakdownItem; index: number }) {
  const color = BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-300 font-medium truncate max-w-[120px]">{item.label}</span>
        <span className="text-white font-mono font-semibold">{item.percent.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden border border-zinc-800/60 p-0.5">
        <div
          className="h-full rounded-full transition-all duration-700 shadow-sm"
          style={{ 
            width: `${Math.min(100, item.percent)}%`, 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}80` 
          }}
        />
      </div>
    </div>
  );
}

export default function StorageUsage({
  data,
  isLoading,
}: {
  data: StorageUsageResponse | null;
  isLoading: boolean;
}) {
  const usedPct = data?.used_pct ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-md shadow-xl hover:border-emerald-500/30 transition-all"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <HardDrive className="h-4 w-4 text-emerald-400" />
          </div>
          <h2 className="text-base font-semibold text-white tracking-tight">Storage Usage</h2>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="space-y-4 animate-pulse">
          <div className="mx-auto h-36 w-36 rounded-full bg-zinc-800" />
          <div className="h-3 rounded bg-zinc-800" />
          <div className="h-3 rounded bg-zinc-800 w-4/5" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Ring gauge */}
          <StorageRing usedPct={usedPct} />

          {/* Used / Quota chips */}
          <div className="flex items-center justify-center gap-4 text-sm bg-zinc-950/40 border border-zinc-800/50 rounded-xl py-2 px-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-zinc-400 text-xs font-medium">Used</span>
              <span className="font-bold text-white font-mono text-xs">{data.used}</span>
            </div>
            <div className="h-3.5 w-px bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="text-zinc-400 text-xs font-medium">Total</span>
              <span className="font-bold text-white font-mono text-xs">{data.quota}</span>
            </div>
          </div>

          {/* Breakdown bars */}
          {data.breakdown.length > 0 && (
            <div className="border-t border-zinc-800/60 pt-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                <Layers className="h-3 w-3 text-emerald-400" />
                Breakdown
              </div>
              {data.breakdown.map((item, idx) => (
                <BreakdownBar key={idx} item={item} index={idx} />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
