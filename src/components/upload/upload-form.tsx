"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UploadCloud, UserRoundCheck, Database, Tag,
  FileText, FileCheck2, Shield, Info, FileIcon, Folder, X,
} from "lucide-react";
import { motion } from "framer-motion";
import { uploadDataset } from "@/services/upload";
import { UploadMetadata, UploadMetadataDialog } from "./upload-metadata-dialog";

const CATEGORIES = ["Healthy", "Disease", "Pest", "Disease Damage", "Pest Damage", "Damage"];

export default function UploadForm() {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [metadata, setMetadata] = useState<UploadMetadata | null>(null);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [form, setForm] = useState(() => ({
    uploader: typeof window === "undefined" ? "" : localStorage.getItem("username") || "",
    dataset_name: "",
    lab_dept: "",
    version: "",
    description: "",
  }));

  function handleField(key: keyof typeof form, value: string) {
    setForm({ ...form, [key]: value });
  }

  function handleCategoryChange(category: string) {
    handleField("lab_dept", category);
    setMetadata(null);
  }

  function openMetadataDialog() {
    if (!form.lab_dept) {
      toast.error("Select a category before adding metadata.");
      return;
    }
    setMetadataDialogOpen(true);
  }

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const imgs = Array.from(incoming).filter((f) => f.type.startsWith("image/") || /\.(jpg|jpeg|png|tiff?|bmp|webp)$/i.test(f.name));
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...imgs.filter((f) => !existing.has(f.name + f.size))];
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) { toast.error("Select at least one image or a folder."); return; }
    if (!form.dataset_name.trim()) { toast.error("Enter a dataset name."); return; }
    if (!form.lab_dept) { toast.error("Select a category before uploading."); return; }
    if (!metadata) { toast.error("Save category metadata before uploading."); return; }

    setLoading(true);
    setProgress({ done: 0, total: files.length });

    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      try {
        const data = new FormData();
        data.append("username", form.uploader);
        data.append("dataset_name", form.dataset_name);
        data.append("owner", form.uploader);
        data.append("lab_dept", form.lab_dept);
        data.append("version", form.version || "v1.0");
        data.append("description", form.description);
        data.append("metadata_json", JSON.stringify(metadata));
        data.append("file", files[i]);
        await uploadDataset(data);
        setProgress({ done: i + 1, total: files.length });
      } catch {
        failed++;
      }
    }

    setLoading(false);
    setProgress({ done: 0, total: 0 });

    if (failed === 0) {
      toast.success(`${files.length} file${files.length !== 1 ? "s" : ""} uploaded successfully`);
    } else {
      toast.warning(`${files.length - failed} uploaded, ${failed} failed`);
    }

    const username = localStorage.getItem("username") || "";
    setForm({ uploader: username, dataset_name: "", lab_dept: "", version: "", description: "" });
    setFiles([]);
    setMetadata(null);
    setTimeout(() => router.push("/datasets"), 800);
  }

  const inputClass = "w-full rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20";
  const labelClass = "flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-1";

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <UploadCloud size={18} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Raw Data Upload</h2>
            <p className="text-xs text-zinc-400">Collect raw field images with metadata — no annotations needed</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <Shield size={14} className="text-emerald-400" />
          <p className="text-xs font-semibold text-emerald-400">Secure Upload</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-4">

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)]">
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Dataset details</p>
              <div>
              <label className={labelClass}><Database size={12} className="text-emerald-400" />Dataset Name</label>
              <input placeholder="Enter dataset name" value={form.dataset_name}
                onChange={(e) => handleField("dataset_name", e.target.value)} className={inputClass} />
              </div>
              <div>
              <label className={labelClass}><Tag size={12} className="text-emerald-400" />Version</label>
              <input placeholder="e.g., v1.0" value={form.version}
                onChange={(e) => handleField("version", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}><Tag size={12} className="text-emerald-400" />Category</label>
                <select value={form.lab_dept} onChange={(e) => handleCategoryChange(e.target.value)} className={inputClass}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </section>

          {/* Metadata */}
          <section className="max-h-44 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/35 p-3 [scrollbar-color:#3f3f46_transparent]">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300"><FileText size={12} className="text-emerald-400" />Metadata</label>
              <span className="text-[10px] text-zinc-500">Applied to this batch</span>
            </div>
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-[11px] text-zinc-400">
              <UserRoundCheck size={13} className="shrink-0 text-emerald-400" />
              <span>Uploader: <span className="font-medium text-zinc-200">{form.uploader || "Signed-in account"}</span> · assigned automatically</span>
            </div>
            <button type="button" onClick={openMetadataDialog} className={`${inputClass} flex items-center justify-between text-left hover:border-emerald-500/50 ${metadata ? "border-emerald-500/35 bg-emerald-500/5" : ""}`}>
              <span className={metadata ? "flex items-center gap-2 text-zinc-100" : "text-zinc-500"}>
                {metadata && <FileCheck2 size={15} className="shrink-0 text-emerald-400" />}
                {metadata ? `${form.lab_dept} metadata saved` : "Add category metadata..."}
              </span>
              {metadata ? <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Saved · Edit</span> : <span className="text-xs font-medium text-emerald-400">Add</span>}
            </button>
          </section>
          </div>

          {/* Drop zone */}
          <div className="mt-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-6 text-center transition-all duration-300 ${
                dragging ? "border-emerald-400 bg-emerald-500/10" : "border-emerald-500/30 bg-zinc-800/30 hover:border-emerald-500/60"
              }`}
            >
              <UploadCloud size={22} className="mb-2 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Drag & drop images or a folder here</p>
              <p className="mt-1 text-[10px] text-zinc-500">JPG, PNG, TIFF, BMP, WebP · metadata applies to every file in this batch</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs text-white hover:border-emerald-500/50 hover:bg-zinc-700 transition">
                  <FileIcon size={12} className="text-emerald-400" /> Browse Files
                </button>
                <button type="button" onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs text-white hover:border-emerald-500/50 hover:bg-zinc-700 transition">
                  <Folder size={12} className="text-emerald-400" /> Browse Folder
                </button>
              </div>
              {/* hidden inputs */}
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <input ref={folderInputRef} type="file" className="hidden"
                // @ts-expect-error - non-standard directory picker attributes are supported by Chromium browsers.
                webkitdirectory="true" mozdirectory="true" multiple
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </div>

            {/* Selected files summary */}
            {files.length > 0 && (
              <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-300">
                    {files.length} file{files.length !== 1 ? "s" : ""} selected
                  </span>
                  <button type="button" onClick={() => setFiles([])}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition">Clear all</button>
                </div>
                <ul className="max-h-28 overflow-auto space-y-1">
                  {files.slice(0, 50).map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded bg-zinc-800/50 px-2 py-1">
                      <span className="truncate text-[11px] text-zinc-400 max-w-[340px]">{f.webkitRelativePath || f.name}</span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                        <X size={11} className="text-zinc-600 hover:text-zinc-300" />
                      </button>
                    </li>
                  ))}
                  {files.length > 50 && (
                    <li className="text-[11px] text-zinc-500 px-2">...and {files.length - 50} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Upload progress */}
            {loading && progress.total > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Uploading {progress.done} / {progress.total}</span>
                  <span>{Math.round((progress.done / progress.total) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800">
                  <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Info size={12} />
            {files.length > 1 ? `${files.length} files will be uploaded under the same dataset name.` : "Make sure all information is correct before uploading."}
          </div>
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex min-w-[190px] items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                  <path d="M22 12A10 10 0 0012 2" stroke="currentColor" strokeWidth="3" />
                </svg>
                Uploading {progress.done}/{progress.total}...
              </>
            ) : (
              <><UploadCloud size={16} /> Upload Dataset</>
            )}
          </motion.button>
        </div>
      </form>
      <UploadMetadataDialog
        key={`${form.lab_dept}-${metadata ? JSON.stringify(metadata) : "new"}-${metadataDialogOpen}`}
        category={form.lab_dept}
        initialMetadata={metadata}
        open={metadataDialogOpen}
        onOpenChange={setMetadataDialogOpen}
        onSave={setMetadata}
      />
    </div>
  );
}
