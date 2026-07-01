"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UploadCloud,
  User,
  Database,
  Users,
  Building2,
  Tag,
  FileText,
  Shield,
  FolderOpen,
  Info,
  FileIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { uploadDataset } from "@/services/upload";

export default function UploadForm() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [descLength, setDescLength] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    dataset_name: "",
    owner: "",
    lab_dept: "",
    version: "",
    description: "",
  });

  function handleField(key: keyof typeof form, value: string) {
    if (key === "description") setDescLength(value.length);
    setForm({ ...form, [key]: value });
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a dataset image.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("username",     form.username);
      data.append("dataset_name", form.dataset_name);
      data.append("owner",        form.owner);
      data.append("lab_dept",     form.lab_dept);
      data.append("version",      form.version);
      data.append("description",  form.description);
      data.append("file",         file);

      const uploadPromise = uploadDataset(data);

      toast.promise(uploadPromise, {
        loading: "Uploading dataset...",
        success: "Dataset uploaded successfully!",
        error: "Upload failed",
      });

      await uploadPromise;

      setForm({
        username: "",
        dataset_name: "",
        owner: "",
        lab_dept: "",
        version: "",
        description: "",
      });

      setFile(null);
      setDescLength(0);

      setTimeout(() => {
        router.push("/datasets");
      }, 1000);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20";
  const labelClass = "flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-1";

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <UploadCloud size={18} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Upload Dataset</h2>
            <p className="text-xs text-zinc-400">Upload your images and provide dataset information</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <Shield size={14} className="text-emerald-400" />
          <div>
            <p className="text-xs font-semibold text-emerald-400 leading-tight">Secure Upload</p>
            <p className="text-[10px] text-zinc-500">Your data is encrypted and securely stored</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-4 backdrop-blur-xl">

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={labelClass}><User size={12} className="text-emerald-400" />Username</label>
              <input placeholder="Enter username" value={form.username}
                onChange={(e) => handleField("username", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}><Database size={12} className="text-emerald-400" />Dataset Name</label>
              <input placeholder="Enter dataset name" value={form.dataset_name}
                onChange={(e) => handleField("dataset_name", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}><Users size={12} className="text-emerald-400" />Owner</label>
              <input placeholder="Enter owner name" value={form.owner}
                onChange={(e) => handleField("owner", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}><Building2 size={12} className="text-emerald-400" />Department</label>
              <input placeholder="Enter department / lab" value={form.lab_dept}
                onChange={(e) => handleField("lab_dept", e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}><Tag size={12} className="text-emerald-400" />Version</label>
              <input placeholder="e.g., v1.0.0" value={form.version}
                onChange={(e) => handleField("version", e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Description */}
          <div className="mt-3">
            <label className={labelClass}><FileText size={12} className="text-emerald-400" />Description</label>
            <div className="relative">
              <textarea
                placeholder="Enter dataset description..."
                rows={2}
                maxLength={500}
                value={form.description}
                onChange={(e) => handleField("description", e.target.value)}
                className={`${inputClass} resize-none`}
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-zinc-600">
                {descLength} / 500
              </span>
            </div>
          </div>

          {/* Drop zone + Preview */}
          <div className="mt-3 grid grid-cols-2 gap-3">

            {/* Drop zone */}
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-5 text-center transition-all duration-300 ${
                dragging
                  ? "border-emerald-400 bg-emerald-500/10"
                  : "border-emerald-500/30 bg-zinc-800/30 hover:border-emerald-500/60 hover:bg-emerald-500/5"
              }`}
            >
              <div className="relative mb-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                  <UploadCloud size={22} className="text-emerald-400" />
                </div>
                <div className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-60" />
                <div className="absolute -left-1 top-3 h-1 w-1 rounded-full bg-emerald-300 opacity-40" />
              </div>
              <p className="text-sm font-semibold text-white">Drag &amp; drop your file here</p>
              <p className="text-xs text-emerald-400">or click to browse</p>
              <p className="mt-1 text-[10px] text-zinc-500">Supports: JPG, PNG, TIFF, BMP, WebP • Max size: 100MB</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs text-white transition hover:border-emerald-500/50 hover:bg-zinc-700"
              >
                <FolderOpen size={12} className="text-emerald-400" />
                Browse Files
              </button>
              <input ref={fileInputRef} type="file" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>

            {/* File preview */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/30 py-5 text-center">
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                      <FileIcon size={22} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="max-w-[160px] truncate text-xs font-medium text-white">{file.name}</p>
                      <p className="text-[10px] text-zinc-500">{(file.size / 1_048_576).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => setFile(null)}
                      className="text-[10px] text-zinc-500 underline hover:text-zinc-300">Remove</button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-dashed border-zinc-600">
                      <FileIcon size={22} className="text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-400">No file selected</p>
                      <p className="text-[10px] text-zinc-600">Select a file to preview</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-400">
                <FileText size={10} />File Preview
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Info size={12} />
            Make sure all information is correct before uploading.
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex min-w-[190px] items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                  <path d="M22 12A10 10 0 0012 2" stroke="currentColor" strokeWidth="3" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                Upload Dataset
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}