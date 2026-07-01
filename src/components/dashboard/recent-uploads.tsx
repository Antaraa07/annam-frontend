"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CloudUpload } from "lucide-react";

import type { RecentUpload } from "@/types/dashboard-v2";

export default function RecentUploads({
  data,
  isLoading,
}: {
  data: RecentUpload[];
  isLoading: boolean;
}) {
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
            <CloudUpload className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Recent Uploads
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          <span>last {data.length || "—"}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950"
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-zinc-500">No uploads yet.</p>
      ) : (
        <div className="space-y-4">
          {data.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 p-2">
                <CloudUpload className="h-full w-full text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="truncate font-medium text-white">
                  {item.dataset_name}
                </p>
                <p className="text-sm text-zinc-500">
                  {item.owner} •{' '}
                  <span className="text-zinc-400">
                    {item.department ?? "—"}
                  </span>
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                {item.version}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

