"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Download, Upload, Loader2, RefreshCw, ImageOff } from "lucide-react";
import Link from "next/link";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import { getProjectStats, bulkDownloadFromProject, getProjectImages } from "@/services/projects";
import { Dataset } from "@/types/dataset";
import { downloadBlob, downloadMultipleFiles } from "@/utils/download";
import { getImageUrl } from "@/services/datasets";
import { usePolling } from "@/hooks/usePolling";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function Thumbnail({ filename }: { filename?: string }) {
  const [err, setErr] = useState(false);
  if (!filename || err) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
        <ImageOff size={14} />
      </div>
    );
  }
  return (
    <img
      src={`${API_URL}/image/${filename}`}
      alt={filename}
      onError={() => setErr(true)}
      className="h-10 w-10 rounded-lg object-cover border border-zinc-700"
    />
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProjectDashboardPage() {
  const params = useParams<{ project_id: string }>();
  const projectId = params.project_id;

  const [totalImages, setTotalImages] = useState<number>(0);
  const [uploads, setUploads] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ completed: 0, total: 0 });
  const [projectName, setProjectName] = useState("");

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : "";
  const isAdmin = role === "admin";

  async function loadStats() {
    setLoading(true);
    try {
      const stats = await getProjectStats(projectId);
      setTotalImages(stats.total_images);
      setUploads(stats.recent_uploads);
      if (stats.recent_uploads[0]?.dataset_name) {
        // extract project name from "ProjectName - timestamp" format
        const raw = stats.recent_uploads[0].dataset_name;
        const parts = raw.split(" - ");
        if (parts.length > 1) setProjectName(parts[0]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  usePolling(loadStats);

  async function handleRefresh() {
    setRefreshing(true);
    await loadStats();
  }

  const handleBulkDownload = async () => {
    if (downloadLoading) return;
    setDownloadLoading(true);
    setDownloadProgress({ completed: 0, total: 0 });
    try {
      try {
        const blob = await bulkDownloadFromProject(projectId);
        downloadBlob(blob, `project_${projectId}.zip`);
        return;
      } catch { /* fall through */ }

      const images = await getProjectImages(projectId);
      if (!images.length) { alert("No images found."); return; }
      const urls = images.map((img) => getImageUrl(img.filename));
      const filenames = images.map((img) => img.filename || `${img.image_id}.jpg`);
      setDownloadProgress({ completed: 0, total: images.length });
      await downloadMultipleFiles(urls, filenames, (c, t) => setDownloadProgress({ completed: c, total: t }));
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setDownloadLoading(false);
      setDownloadProgress({ completed: 0, total: 0 });
    }
  };

  // group by label for summary
  const labelCounts = uploads.reduce<Record<string, number>>((acc, u) => {
    const key = u.label || "Unlabelled";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />
      <div className="relative z-10 flex w-full">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-auto p-8">

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{projectName || "Project Dashboard"}</h1>
                <p className="mt-1 text-xs text-zinc-500 font-mono">{projectId}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
                {isAdmin && (
                  <button
                    onClick={handleBulkDownload}
                    disabled={downloadLoading || totalImages === 0}
                    className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {downloadLoading
                      ? downloadProgress.total > 0 ? `${downloadProgress.completed}/${downloadProgress.total}` : "Preparing..."
                      : "Download All"}
                  </button>
                )}
                <Link
                  href={`/projects/${projectId}/bulk-upload`}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Data
                </Link>
              </div>
            </div>

            {/* Stats row */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs text-zinc-500">Total Images</p>
                <p className="mt-1 text-3xl font-bold text-white">{loading ? "—" : totalImages}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs text-zinc-500">Contributors</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {loading ? "—" : new Set(uploads.map((u) => u.owner)).size}
                </p>
              </div>
              {Object.entries(labelCounts).slice(0, 2).map(([label, count]) => (
                <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-xs text-zinc-500 capitalize">{label}</p>
                  <p className="mt-1 text-3xl font-bold text-white">{count}</p>
                </div>
              ))}
            </div>

            {/* Uploads table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
              <div className="border-b border-zinc-800 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">Uploaded Data</h2>
              </div>

              {loading ? (
                <div className="p-8 text-center text-zinc-500">Loading...</div>
              ) : uploads.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">No data uploaded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Image</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Dataset Name</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Label</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Uploaded By</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Department</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploads.map((d) => (
                        <tr key={d.image_id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                          <td className="px-5 py-3">
                            <Thumbnail filename={d.filename} />
                          </td>
                          <td className="px-5 py-3 font-medium text-white max-w-[180px] truncate">
                            {d.dataset_name || "—"}
                          </td>
                          <td className="px-5 py-3">
                            {d.label ? (
                              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 capitalize">
                                {d.label}
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-zinc-300">{d.owner || "—"}</td>
                          <td className="px-5 py-3 text-zinc-400">{d["lab/dept"] || "—"}</td>
                          <td className="px-5 py-3 text-zinc-500">{formatDate((d as any).timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
