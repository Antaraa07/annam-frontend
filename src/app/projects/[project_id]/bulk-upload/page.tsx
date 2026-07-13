"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { UploadCloud, FileText, X, CheckCircle2, ArrowLeft } from "lucide-react";
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
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [label, setLabel] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ uploaded_count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProject(projectId)
      .then((p) => {
        setProjectName(p.name);
        setLabelOptions(p.label_classes || []);
      })
      .catch(() => {});
  }, [projectId]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit() {
    if (!files.length) { toast.error("Select at least one image"); return; }
    setUploading(true);
    setResult(null);
    try {
      const res = await bulkUploadToProject({
        projectId,
        files,
        label: label || undefined,
        csvFile: csvFile || undefined,
      });
      setResult(res);
      setFiles([]);
      setCsvFile(null);
      setLabel("");
      toast.success(`${res.uploaded_count} file${res.uploaded_count !== 1 ? "s" : ""} uploaded`);
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
                className="mb-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft size={13} /> Back to project
              </Link>
              <h1 className="text-2xl font-bold text-white">Upload Data</h1>
              <p className="mt-1 text-sm text-zinc-400">{projectName}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">

              {/* Left — image drop zone */}
              <div className="space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 text-center transition-all ${
                    dragging
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-600"
                  }`}
                >
                  <UploadCloud size={28} className="mb-2 text-emerald-400" />
                  <p className="text-sm font-medium text-white">Drag & drop images here</p>
                  <p className="mt-1 text-xs text-zinc-500">or click to browse — JPG, PNG, TIFF, WebP</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files || []);
                      if (picked.length) setFiles((prev) => [...prev, ...picked]);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-400">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
                      <button onClick={() => setFiles([])} className="text-xs text-zinc-500 hover:text-zinc-300">Clear all</button>
                    </div>
                    <ul className="max-h-40 overflow-auto space-y-1">
                      {files.map((f, i) => (
                        <li key={i} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-1.5">
                          <span className="truncate text-xs text-zinc-300 max-w-[220px]">{f.name}</span>
                          <button onClick={() => removeFile(i)} className="ml-2 text-zinc-500 hover:text-zinc-300">
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right — metadata */}
              <div className="space-y-4">

                {/* Label */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white">Label / Category</p>
                  {labelOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {labelOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setLabel(label === opt ? "" : opt)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            label === opt
                              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                              : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                          }`}
                        >
                          {label === opt && <span className="mr-1">✓</span>}{opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Disease, Pest, Damage..."
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                    />
                  )}
                  {labelOptions.length > 0 && (
                    <input
                      value={label && !labelOptions.includes(label) ? label : ""}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Or type a custom label..."
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                    />
                  )}
                </div>

                {/* CSV annotation */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Annotation CSV <span className="text-xs font-normal text-zinc-500">(optional)</span></p>
                    <p className="mt-1 text-xs text-zinc-500">
                      CSV must have a <code className="text-zinc-400">filename</code> column. Optional columns: <code className="text-zinc-400">label</code>, <code className="text-zinc-400">description</code>, <code className="text-zinc-400">version</code>, <code className="text-zinc-400">department</code>
                    </p>
                  </div>
                  {csvFile ? (
                    <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-blue-400" />
                        <span className="text-xs text-zinc-300">{csvFile.name}</span>
                      </div>
                      <button onClick={() => setCsvFile(null)} className="text-zinc-500 hover:text-zinc-300">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => csvInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 py-3 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      <FileText size={14} />
                      Attach CSV file
                    </button>
                  )}
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => { setCsvFile(e.target.files?.[0] || null); e.target.value = ""; }}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={onSubmit}
                  disabled={uploading || files.length === 0}
                  className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : `Upload ${files.length > 0 ? files.length + " file" + (files.length !== 1 ? "s" : "") : ""}`}
                </button>

                {/* Result */}
                {result && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-300">
                      {result.uploaded_count} file{result.uploaded_count !== 1 ? "s" : ""} uploaded successfully
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
