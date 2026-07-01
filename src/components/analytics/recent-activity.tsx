"use client";

import { Clock3, Database } from "lucide-react";

type RecentActivityItem = {
  dataset_name: string;
  owner: string;
  version: string;
};

interface RecentActivityProps {
  data: RecentActivityItem[];
}

export default function RecentActivity({
  data,
}: RecentActivityProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

      <div className="mb-6 flex items-center gap-2">
        <Clock3 className="h-5 w-5 text-emerald-400" />

        <h2 className="text-lg font-semibold text-white">
          Recent Activity
        </h2>
      </div>

      {data.length === 0 ? (
        <p className="text-zinc-500">
          No recent activity.
        </p>
      ) : (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="rounded-full bg-emerald-500/10 p-2">
                <Database className="h-5 w-5 text-emerald-400" />
              </div>

              <div className="flex-1">
                <p className="font-medium text-white">
                  {item.dataset_name}
                </p>

                <p className="text-sm text-zinc-500">
                  Uploaded by{" "}
                  <span className="text-zinc-300">
                    {item.owner}
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
    </div>
  );
}