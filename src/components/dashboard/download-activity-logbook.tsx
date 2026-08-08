"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, Calendar, Clock, Filter, Eye, RefreshCw, X, Shield, User, HardDrive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DownloadLog {
  id: string;
  username: string;
  role: string;
  timestamp: string;
  date_str: string;
  time_str: string;
  category: string;
  dataset_name: string;
  group_by: string;
  formats: string[];
  limit?: number;
  count: number;
  ip: string;
}

const TIMEFRAMES = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "all", label: "All Time" },
];

const ROLE_STYLES: Record<string, string> = {
  superadmin: "text-violet-300 border-violet-500/30 bg-violet-500/10",
  admin: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  researcher: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
  intern: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  student: "text-blue-300 border-blue-500/30 bg-blue-500/10",
};

function formatTime(iso: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.valueOf())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function DownloadActivityLogbook() {
  const [logs, setLogs] = useState<DownloadLog[]>([]);
  const [timeframe, setTimeframe] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<DownloadLog | null>(null);

  const fetchLogs = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/analytics/download-logs?timeframe=${timeframe}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && Array.isArray(data)) {
          setLogs(data);
        }
      }
    } catch {
      // Ignore background network polling errors silently
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    void fetchLogs(true);
    const interval = setInterval(() => {
      void fetchLogs(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl backdrop-blur-md">
      {/* Header & Timeframe Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Download size={15} />
            </div>
            <h2 className="font-semibold text-white">Download Activity Logbook</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Real-time security logbook tracking dataset downloads across users.
          </p>
        </div>

        {/* Time Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                timeframe === t.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log list */}
      <div className="mt-4 max-h-[380px] overflow-y-auto space-y-2.5 [scrollbar-color:#3f3f46_transparent]">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">Loading download logs…</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No download activity recorded for this timeframe ({timeframe}).
          </div>
        ) : (
          logs.map((log) => {
            const roleStyle = ROLE_STYLES[log.role?.toLowerCase()] ?? "text-zinc-300 border-zinc-700 bg-zinc-800";
            return (
              <motion.div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                whileHover={{ scale: 1.005 }}
                className="group cursor-pointer rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5 transition-all hover:border-cyan-500/40 hover:bg-zinc-800/40"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left info: User & Action */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white uppercase border border-zinc-700">
                      {log.username.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {log.username}
                        </span>
                        <span className={`rounded-full border px-2 py-0.2 text-[10px] font-medium capitalize ${roleStyle}`}>
                          {log.role}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        Downloaded <span className="font-semibold text-emerald-400">{log.count} image{log.count !== 1 ? "s" : ""}</span> · {log.category !== "All" ? `Category: ${log.category}` : "All Categories"}
                      </p>
                    </div>
                  </div>

                  {/* Right info: Formats & Timestamp */}
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-400 block font-mono">
                      {formatTime(log.timestamp)}
                    </span>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      {(log.formats || ["zip"]).map((fmt) => (
                        <span
                          key={fmt}
                          className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.2 text-[9px] font-semibold uppercase text-zinc-300"
                        >
                          {fmt}
                        </span>
                      ))}
                      <Eye size={13} className="ml-1 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:text-cyan-400 transition-opacity" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Log Detail Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedLog && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/30 bg-zinc-900 p-6 shadow-2xl text-zinc-100 [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Download Log Details</h3>
                      <p className="text-[11px] text-zinc-400">Log ID: {selectedLog.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5">
                    <span className="text-zinc-400 flex items-center gap-1.5"><User size={13} className="text-cyan-400" /> User & Role</span>
                    <span className="font-semibold text-white">{selectedLog.username} ({selectedLog.role})</span>
                  </div>

                  <div className="flex justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Clock size={13} className="text-cyan-400" /> Date & Time</span>
                    <span className="font-semibold text-white">{formatTime(selectedLog.timestamp)}</span>
                  </div>

                  <div className="flex justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Filter size={13} className="text-cyan-400" /> Category Filter</span>
                    <span className="font-semibold text-emerald-400">{selectedLog.category}</span>
                  </div>

                  <div className="flex justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5">
                    <span className="text-zinc-400 flex items-center gap-1.5"><HardDrive size={13} className="text-cyan-400" /> Dataset Filter</span>
                    <span className="font-semibold text-white">{selectedLog.dataset_name}</span>
                  </div>

                  <div className="flex justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Download size={13} className="text-cyan-400" /> Images Delivered</span>
                    <span className="font-bold text-emerald-300">{selectedLog.count} images</span>
                  </div>

                  <div className="flex justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Shield size={13} className="text-cyan-400" /> Package Formats</span>
                    <div className="flex gap-1">
                      {(selectedLog.formats || []).map((f) => (
                        <span key={f} className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-right">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  >
                    Close Logbook
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
