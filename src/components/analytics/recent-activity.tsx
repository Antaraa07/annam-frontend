"use client";

import { Upload, Clock3 } from "lucide-react";

type RecentActivityItem = {
  dataset_name: string;
  owner: string;
  version: string;
  department?: string;
  "lab/dept"?: string;
};

interface RecentActivityProps {
  data: RecentActivityItem[];
}

const VERSION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  v1: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  v2: { bg: "bg-cyan-500/10",    text: "text-cyan-400",    dot: "bg-cyan-400"    },
  v3: { bg: "bg-violet-500/10",  text: "text-violet-400",  dot: "bg-violet-400"  },
  v4: { bg: "bg-amber-500/10",   text: "text-amber-400",   dot: "bg-amber-400"   },
};

function getVersionTheme(version: string) {
  const key = Object.keys(VERSION_COLORS).find((k) => version?.toLowerCase().startsWith(k)) || "v1";
  return VERSION_COLORS[key] || VERSION_COLORS.v1;
}

export default function RecentActivity({ data }: RecentActivityProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Clock3 className="h-4 w-4 text-emerald-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Recent Activity</h2>
        </div>
        <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
          {data.length} entries
        </span>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-zinc-800/60 flex items-center justify-center mb-3">
            <Clock3 className="h-5 w-5 text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-500">No recent activity to display.</p>
        </div>
      ) : (
        <div className="relative space-y-1">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-zinc-800/80" />

          {data.map((item, index) => {
            const theme = getVersionTheme(item.version);
            const subfolder = item.department || item["lab/dept"] || "General";
            return (
              <div
                key={index}
                className="group relative flex items-start gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-zinc-800/40"
              >
                {/* Timeline dot */}
                <div className={`relative z-10 mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-zinc-900 flex items-center justify-center ${theme.bg}`}>
                  <Upload className={`h-2.5 w-2.5 ${theme.text}`} />
                </div>

                <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.dataset_name}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      <span className="text-emerald-300 font-medium">{subfolder}</span> • Owner: {item.owner || "—"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}