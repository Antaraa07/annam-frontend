"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  value: string | number;
  icon?: ReactNode;
  accent?: "emerald" | "cyan" | "violet" | "amber" | "rose" | "sky";
  trend?: { direction: "up" | "down" | "neutral"; label: string };
  subtitle?: string;
}

const accentMap = {
  emerald: {
    icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    glow: "hover:shadow-[0_0_24px_rgba(16,185,129,0.12)] hover:border-emerald-500/30",
    value: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300",
  },
  cyan: {
    icon: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    glow: "hover:shadow-[0_0_24px_rgba(6,182,212,0.12)] hover:border-cyan-500/30",
    value: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-300",
  },
  violet: {
    icon: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    glow: "hover:shadow-[0_0_24px_rgba(139,92,246,0.12)] hover:border-violet-500/30",
    value: "text-violet-400",
    badge: "bg-violet-500/10 text-violet-300",
  },
  amber: {
    icon: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    glow: "hover:shadow-[0_0_24px_rgba(245,158,11,0.12)] hover:border-amber-500/30",
    value: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-300",
  },
  rose: {
    icon: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    glow: "hover:shadow-[0_0_24px_rgba(244,63,94,0.12)] hover:border-rose-500/30",
    value: "text-rose-400",
    badge: "bg-rose-500/10 text-rose-300",
  },
  sky: {
    icon: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    glow: "hover:shadow-[0_0_24px_rgba(14,165,233,0.12)] hover:border-sky-500/30",
    value: "text-sky-400",
    badge: "bg-sky-500/10 text-sky-300",
  },
};

export default function SummaryCard({ title, value, icon, accent = "emerald", trend, subtitle }: Props) {
  const theme = accentMap[accent];

  const TrendIcon =
    trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      transition={{ duration: 0.3 }}
      className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-sm transition-all duration-300 ${theme.glow}`}
    >
      {/* Subtle corner glow */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${accent === "emerald" ? "rgba(16,185,129,0.08)" : accent === "cyan" ? "rgba(6,182,212,0.08)" : accent === "violet" ? "rgba(139,92,246,0.08)" : accent === "amber" ? "rgba(245,158,11,0.08)" : "rgba(14,165,233,0.08)"} 0%, transparent 70%)` }}
      />

      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${theme.icon}`}>
            {icon}
          </div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${theme.badge}`}>
            <TrendIcon size={11} />
            {trend.label}
          </div>
        )}
      </div>

      <p className="mt-4 text-sm font-medium text-zinc-400">{title}</p>
      <h2 className={`mt-1 text-3xl font-bold tracking-tight ${theme.value}`}>{value}</h2>
      {subtitle && <p className="mt-1.5 text-xs text-zinc-500">{subtitle}</p>}
    </motion.div>
  );
}