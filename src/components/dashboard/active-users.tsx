"use client";

import { motion } from "framer-motion";
import { Users, UserPlus } from "lucide-react";

import type { ActiveUsersResponse } from "@/types/dashboard-v2";

export default function ActiveUsers({
  data,
  isLoading,
}: {
  data: ActiveUsersResponse | null;
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
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Active Users</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <UserPlus className="h-4 w-4 text-emerald-400" />
          <span>{isLoading ? "—" : `${data?.active_users ?? 0}`}</span>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-800" />
              <div className="flex-1">
                <div className="h-4 animate-pulse w-36 rounded bg-zinc-800" />
                <div className="mt-2 h-3 animate-pulse w-20 rounded bg-zinc-800" />
              </div>
              <div className="h-6 w-14 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : data.top.length === 0 ? (
        <p className="text-zinc-500">No active users found.</p>
      ) : (
        <div className="space-y-4">
          {data.top.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 p-2">
                <Users className="h-full w-full text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="truncate font-medium text-white">{item.owner}</p>
                <p className="text-sm text-zinc-500">Uploads in window</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                {item.activity_count}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

