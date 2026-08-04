"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Folder, FolderOpen } from "lucide-react";

import type { RecentUpload } from "@/types/dashboard-v2";

export default function RecentUploads({
  data,
  isLoading,
}: {
  data: RecentUpload[];
  isLoading: boolean;
}) {
  // Group recent uploads by dataset folder
  const groupedFolders = useMemo(() => {
    const map = new Map<string, { dataset_name: string; owner: string; categories: Set<string>; total_images: number }>();
    for (const item of data) {
      const name = item.dataset_name || "Unassigned";
      if (!map.has(name)) {
        map.set(name, {
          dataset_name: name,
          owner: item.owner || "—",
          categories: new Set<string>(),
          total_images: 0,
        });
      }
      const g = map.get(name)!;
      if (item.department) g.categories.add(item.department);
      if (item.image_count !== undefined && item.image_count !== null) {
        g.total_images = item.image_count;
      } else {
        g.total_images += 1;
      }
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      categoryList: Array.from(g.categories).join(", ") || "General",
    }));
  }, [data]);

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
            <FolderOpen className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Recent Upload Folders
          </h2>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-200">
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          <span>{groupedFolders.length || 0} folders</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950"
            />
          ))}
        </div>
      ) : groupedFolders.length === 0 ? (
        <p className="text-zinc-300">No upload folders yet.</p>
      ) : (
        <div className="space-y-3">
          {groupedFolders.map((folder) => (
            <Link
              key={folder.dataset_name}
              href={`/datasets?folder=${encodeURIComponent(folder.dataset_name)}`}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:bg-zinc-800/50 hover:border-emerald-500/40 group block"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 p-2 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <Folder className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {folder.dataset_name}
                </p>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  <span className="text-emerald-300 font-medium">{folder.categoryList}</span> • Owner: {folder.owner}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold font-mono text-emerald-300 border border-emerald-500/20">
                {folder.total_images} {folder.total_images === 1 ? "img" : "imgs"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
