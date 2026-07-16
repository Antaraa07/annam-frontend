"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { UploadCloud, X, CheckCircle2, ArrowLeft, Folder, FileCheck2 } from "lucide-react";
import Link from "next/link";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";
import { bulkUploadToProject, getProject } from "@/services/projects";
import { toast } from "sonner";

export default function BulkUploadPage() {
  const params = useParams<{ project_id: string }>();
  const projectId = params.project_id;

  const [projectName, setProjectName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ uploaded_count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProject(projectId)
      .then((p) => {
        setProjectName(p.name);
      })
      .catch(() => {});
  }, [projectId]);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const picked = Array.from(incoming).filter((f) => 
      f.type.startsWith("image/") || 
      /\.(jpg|jpeg|png|tiff?|bmp|webp|json)$/i.test(f.name)
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...picked.filter((f) => !existing.has(f.name + f.size))];
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit() {
    if (!files.length) { toast.error("Select at least one file to upload"); return; }
    setUploading(true);
    setResult(null);
    try {
      const res = await bulkUploadToProject({
        projectId,
        files,
      });
      setResult(res);
      setFiles([]);
      toast.success(`${res.uploaded_count} file${res.uploaded_count !== 1 ? "s" : ""} uploaded successfully`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
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
            <div className="mb-6">
              <Link
                href={`/projects/${projectId}`}
                className="mb-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft size={13} /> Back to project
              </Link>
              <h1 className="text-2xl font-bold text-white">Upload Annotated Data</h1>
              <p className="mt-1 text-sm text-zinc-400">{projectName}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">

              {/* Left — drop zone */}
              <div className="space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-center transition-all ${
                    dragging
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-600"
                  }`}
                >
                  <UploadCloud size={32} className="mb-2 text-emerald-400" />
                  <p className="text-sm font-medium text-white">Drag & drop annotated folder or files here</p>
                  <p className="mt-1 text-xs text-zinc-500 px-4">Upload folder containing images + matching JSON annotations</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white hover:border-emerald-500/50 hover:bg-zinc-700 transition"
                    >
                      Browse Files
                    </button>
                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white hover:border-emerald-500/50 hover:bg-zinc-700 transition"
                    >
                      <Folder size={12} className="text-emerald-400" />
                      Browse Folder
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.json"
                    className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    // @ts-expect-error
                    webkitdirectory="true"
                    directory=""
                    className="hidden"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                  />
                </div>
              </div>

              {/* Right — selected files list and submit */}
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h2 className="text-sm font-semibold text-white">Selected files</h2>
                    <span className="text-xs font-semibold text-emerald-400">{files.length} file{files.length !== 1 ? "s" : ""}</span>
                  </div>

                  {files.length > 0 ? (
                    <div>
                      <ul className="max-h-60 overflow-y-auto space-y-1.5 pr-1 [scrollbar-color:#3f3f46_transparent]">
                        {files.map((f, i) => (
                          <li key={i} className="flex items-center justify-between rounded-lg bg-zinc-950/40 border border-zinc-800/45 px-3 py-2">
                            <span className="truncate text-xs text-zinc-300 max-w-[280px]">{f.webkitRelativePath || f.name}</span>
                            <button onClick={() => removeFile(i)} className="ml-2 text-zinc-500 hover:text-zinc-300 transition">
                              <X size={13} />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => setFiles([])} className="mt-2 text-xs font-medium text-red-400 hover:text-red-300 transition">
                        Clear all files
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 text-center py-6">No files selected. Drag & drop or browse to add files.</p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={onSubmit}
                    disabled={uploading || files.length === 0}
                    className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : `Upload Annotated Files`}
                  </button>

                  {/* Result */}
                  {result && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 mt-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <p className="text-sm text-emerald-300">
                        {result.uploaded_count} file{result.uploaded_count !== 1 ? "s" : ""} uploaded successfully to project folder.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
