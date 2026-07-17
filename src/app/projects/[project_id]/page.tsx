"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, Upload, Loader2, RefreshCw, ImageOff, FileJson, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import { getProjectStats, bulkDownloadFromProject, getProjectImages, getProject } from "@/services/projects";
import { Dataset } from "@/types/dataset";
import { Project } from "@/types/project";
import { downloadBlob, downloadMultipleFiles } from "@/utils/download";
import { usePolling } from "@/hooks/usePolling";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PAGE_SIZE = 20;

function Thumbnail({ filename }: { filename?: string }) {
  const [err, setErr] = useState(false);
  if (!filename) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
        <ImageOff size={14} />
      </div>
    );
  }

  if (filename.toLowerCase().endsWith(".json")) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
        <FileJson size={16} />
      </div>
    );
  }

  if (err) {
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

  const [project, setProject] = useState<Project | null>(null);
  const [totalImages, setTotalImages] = useState<number>(0);
  const [recentUploads, setRecentUploads] = useState<Dataset[]>([]);
  const [labelCounts, setLabelCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ completed: 0, total: 0 });
  const [projectName, setProjectName] = useState("");

  // Paginated table state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);
  const [images, setImages] = useState<Dataset[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : "";

  const totalPages = Math.max(1, Math.ceil(totalImages / pageSize));

  async function loadStats() {
    try {
      const stats = await getProjectStats(projectId);
      setTotalImages(stats.total_images);
      setRecentUploads(stats.recent_uploads);
      setLabelCounts(stats.label_counts || {});
      if (stats.recent_uploads[0]?.dataset_name) {
        const raw = stats.recent_uploads[0].dataset_name;
        const parts = raw.split(" - ");
        if (parts.length > 1) setProjectName(parts[0]);
      }

      const proj = await getProject(projectId);
      setProject(proj);
      if (proj.name) setProjectName(proj.name);
    } catch {
      // silent fail on load error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadImages(targetPage: number) {
    try {
      setImagesLoading(true);
      const data = await getProjectImages(projectId, targetPage, pageSize);
      setImages(data);
    } catch {
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  }

  usePolling(loadStats);

  useEffect(() => {
    loadImages(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, projectId]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadStats(), loadImages(page)]);
  }

  const handleBulkDownload = async () => {
    if (downloadLoading) return;
    setDownloadLoading(true);
    setDownloadProgress({ completed: 0, total: 0 });
    try {
      try {
        const blob = await bulkDownloadFromProject(projectId);
        if (blob) {
          downloadBlob(blob, `project_${projectId}.zip`);
          return;
        }
      } catch { /* fall through */ }

      // No page/limit passed -> backend returns the full file list for bulk download
      const allImages = await getProjectImages(projectId);
      if (!allImages.length) { alert("No images found."); return; }
      const urls = allImages.map((img) => `${API_URL}/image/${img.filename}`);
      const filenames = allImages.map((img) => img.filename || `${img.image_id}.jpg`);
      setDownloadProgress({ completed: 0, total: allImages.length });
      await downloadMultipleFiles(urls, filenames, (c, t) => setDownloadProgress({ completed: c, total: t }));
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setDownloadLoading(false);
      setDownloadProgress({ completed: 0, total: 0 });
    }
  };

  const handleDownloadIndividual = async (filename: string) => {
    try {
      const response = await fetch(`${API_URL}/image/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        downloadBlob(blob, filename);
      } else {
        alert("Failed to download file");
      }
    } catch (e) {
      console.error(e);
      alert("Error downloading file");
    }
  };

  const rangeStart = totalImages === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalImages);

  function goPrev() {
    setPage((p) => Math.max(1, p - 1));
  }

  function goNext() {
    setPage((p) => Math.min(totalPages, p + 1));
  }

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
                <p className="text-xs text-zinc-500">Total Files</p>
                <p className="mt-1 text-3xl font-bold text-white">{loading ? "—" : totalImages}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-xs text-zinc-500">Contributors</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {loading ? "—" : new Set(recentUploads.map((u) => u.owner)).size}
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
              {/* Header bar: title + range indicator + pagination, all up top */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-white">Uploaded Data</h2>
                  {!loading && totalImages > 0 && (
                    <span className="text-xs text-zinc-500">
                      Showing {rangeStart}–{rangeEnd} of {totalImages}
                    </span>
                  )}
                </div>

                {!loading && totalImages > pageSize && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={goPrev}
                      disabled={page <= 1 || imagesLoading}
                      className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={13} />
                      Prev
                    </button>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={goNext}
                      disabled={page >= totalPages || imagesLoading}
                      className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable table body, fixed max height so the page itself doesn't grow long */}
              {imagesLoading ? (
                <div className="p-8 text-center text-zinc-500">Loading...</div>
              ) : images.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">No data uploaded yet.</div>
              ) : (
                <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-zinc-900">
                      <tr className="border-b border-zinc-800 text-left">
                        <th className="px-5 py-3 text-xs font-medium text-zinc-500">Preview</th>
                        <th className="px-5 py-3 text-xs font-medium text-zinc-500">Filename</th>
                        <th className="px-5 py-3 text-xs font-medium text-zinc-500">Dataset Name</th>
                        <th className="px-5 py-3 text-xs font-medium text-zinc-500">Uploaded By</th>
                        <th className="px-5 py-3 text-xs font-medium text-zinc-500">Date</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {images.map((d) => (
                        <tr key={d.image_id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                          <td className="px-5 py-3">
                            <Thumbnail filename={d.filename} />
                          </td>
                          <td className="px-5 py-3 text-zinc-300 font-mono text-xs max-w-[180px] truncate">
                            {d.filename}
                          </td>
                          <td className="px-5 py-3 font-medium text-white max-w-[180px] truncate">
                            {d.dataset_name || "—"}
                          </td>
                          <td className="px-5 py-3 text-zinc-300">{d.owner || "—"}</td>
                          <td className="px-5 py-3 text-zinc-500">{formatDate(d.timestamp)}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDownloadIndividual(d.filename!)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                              <Download size={12} />
                              Download
                            </button>
                          </td>
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