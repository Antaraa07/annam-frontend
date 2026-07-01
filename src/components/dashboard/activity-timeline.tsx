"use client";

import { motion } from "framer-motion";

import RecentActivity from "@/components/analytics/recent-activity";

type ActivityItem = {
  dataset_name: string;
  owner: string;
  version: string;
};

export default function ActivityTimeline({
  data,
  isLoading,
}: {
  data: ActivityItem[];
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-0">
        {isLoading ? (
          <div className="p-6">
            <div className="h-8 w-52 animate-pulse rounded bg-zinc-950" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950"
                />
              ))}
            </div>
          </div>
        ) : (
          <RecentActivity data={data} />
        )}
      </div>
    </motion.div>
  );
}

