"use client";

import { motion } from "framer-motion";
import { HardDrive, Gauge, Layers } from "lucide-react";

import type { StorageUsageBreakdownItem, StorageUsageResponse } from "@/types/dashboard-v2";

function BreakdownRow({
  item,
}: {
  item: StorageUsageBreakdownItem;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 truncate text-xs text-zinc-300">{item.label}</div>
      <div className="flex-1">
        <div className="h-2 rounded-full bg-zinc-800">
          <div
            className="h-2 rounded-full bg-emerald-400/80"
            style={{ width: `${Math.min(100, item.percent)}%` }}
          />
        </div>
      </div>
      <div className="w-16 text-right text-xs text-zinc-400">
        {item.percent.toFixed(0)}%
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
      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-emerald-500/10 p-2">
            <HardDrive className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Storage Usage
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Gauge className="h-4 w-4 text-emerald-400" />
          <span>{isLoading ? "—" : `${usedPct.toFixed(1)}%`}</span>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded bg-zinc-950" />
          <div className="h-10 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950" />
          <div className="h-3 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 animate-pulse rounded bg-zinc-800" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-zinc-400">Used</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {data.used}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Quota</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">
                {data.quota}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Capacity</span>
            </div>
            <div className="h-3 rounded-full bg-zinc-800">
              <div
                className="h-3 rounded-full bg-emerald-400/90"
                style={{ width: `${Math.min(100, usedPct)}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-300">
              Breakdown (top depts)
            </p>
            {data.breakdown.length === 0 ? (
              <p className="text-zinc-500">No breakdown available.</p>
            ) : (
              <div className="space-y-4">
                {data.breakdown.map((item, idx) => (
                  <BreakdownRow key={idx} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

