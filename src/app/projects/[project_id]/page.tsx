"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Upload, Loader2 } from "lucide-react";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import { getProjectStats, bulkDownloadFromProject, getProjectImages } from "@/services/projects";
import { Dataset } from "@/types/dataset";
import { downloadBlob, downloadMultipleFiles } from "@/utils/download";
import { getImageUrl } from "@/services/datasets";

import Link from "next/link";

export default function ProjectDashboardPage() {
  const params = useParams<{ project_id: string }>();
  const projectId = params.project_id;

  const [totalImages, setTotalImages] = useState<number>(0);
  const [recentUploads, setRecentUploads] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const stats = await getProjectStats(projectId);
        if (cancelled) return;
        setTotalImages(stats.total_images);
        setRecentUploads(stats.recent_uploads);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleBulkDownload = async () => {
    if (downloadLoading) return;
    
    setDownloadLoading(true);
    setDownloadProgress({ completed: 0, total: 0 });
    
    try {
      // First try the bulk download endpoint (project-specific)
      try {
        const blob = await bulkDownloadFromProject(projectId);
        downloadBlob(blob, `project_${projectId}_images.zip`);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm z-50';
        successMsg.textContent = `Project ${projectId} images download started! Check your downloads folder.`;
        document.body.appendChild(successMsg);
        setTimeout(() => document.body.removeChild(successMsg), 3000);
        
        return;
      } catch (bulkError) {
        console.warn('Bulk download failed, falling back to individual project image downloads:', bulkError);
      }
      
      // Fallback: Download ONLY project images individually
      const projectImages = await getProjectImages(projectId);
      
      // Double-check: Filter to ensure only project-specific images
      const filteredImages = projectImages.filter(img => 
        img.project_id === projectId || 
        img.dataset_name?.includes(projectId) ||
        // For mock data or legacy images without project_id
        (!img.project_id && projectImages.includes(img))
      );
      
      if (filteredImages.length === 0) {
        alert(`No images found for project ${projectId}.`);
        return;
      }
      
      const urls = filteredImages.map(img => getImageUrl(img.filename));
      const filenames = filteredImages.map(img => {
        const filename = img.filename || `project_${projectId}_image_${img.image_id}.jpg`;
        // Ensure filename includes project context
        return filename.includes(projectId) ? filename : `project_${projectId}_${filename}`;
      });
      
      setDownloadProgress({ completed: 0, total: filteredImages.length });
      
      await downloadMultipleFiles(urls, filenames, (completed, total) => {
        setDownloadProgress({ completed, total });
      });
      
      // Show completion message with project context
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm z-50';
      successMsg.textContent = `Successfully downloaded ${filteredImages.length} images from project ${projectId}!`;
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 4000);
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Show error message
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm z-50';
      errorMsg.textContent = `Failed to download project ${projectId} images. Please try again.`;
      document.body.appendChild(errorMsg);
      setTimeout(() => document.body.removeChild(errorMsg), 4000);
    } finally {
      setDownloadLoading(false);
      setDownloadProgress({ completed: 0, total: 0 });
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />
      <div className="relative z-10 flex w-full">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-auto p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Project dashboard</h1>
                <p className="mt-2 text-zinc-400">Project ID: {projectId}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleBulkDownload}
                  disabled={downloadLoading || totalImages === 0}
                  className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Download all ${totalImages} images from project ${projectId}`}
                >
                  {downloadLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {downloadLoading ? (
                    downloadProgress.total > 0 ? 
                      `Downloading ${downloadProgress.completed}/${downloadProgress.total}` : 
                      'Preparing...'
                  ) : (
                    `Bulk Download`
                  )}
                </button>
                <Link
                  href={`/projects/${projectId}/bulk-upload`}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5">
                <div className="text-xs text-zinc-500">Total images</div>
                <div className="mt-2 text-4xl font-bold text-white">{loading ? "..." : totalImages}</div>
                {downloadLoading && downloadProgress.total > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-blue-400 mb-1">
                      Downloading: {downloadProgress.completed}/{downloadProgress.total}
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(downloadProgress.completed / downloadProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5">
                <div className="text-xs text-zinc-500">Recent uploads</div>
                <div className="mt-2 text-sm text-zinc-300">Last {recentUploads.length} files</div>
                {downloadLoading && (
                  <div className="mt-2 text-xs text-blue-400">
                    {downloadProgress.total > 0 ? 
                      `Downloading files individually...` : 
                      'Preparing bulk download...'}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5">
              <h2 className="text-lg font-semibold text-white">Recent uploads</h2>

              {loading ? (
                <div className="mt-4 text-zinc-500">Loading...</div>
              ) : recentUploads.length ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {recentUploads.map((d) => (
                    <div key={d.image_id} className="flex items-center justify-between gap-4 rounded-lg bg-zinc-950/40 p-3">
                      <div>
                        <div className="text-sm font-medium text-white">{d.dataset_name}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {d.label ? `Label: ${d.label}` : d.project_id ? `Project: ${d.project_id}` : ""}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500">{d.filename}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-zinc-500">No uploads yet.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

