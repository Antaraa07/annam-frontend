"use client";

import { useState, useMemo } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { downloadStructured, StructuredDownloadRequest } from "@/services/datasets";
import type { Dataset } from "@/types/dataset";

const CATEGORIES = ["Disease", "Pest", "Damage", "Deficiency", "Healthy", "Other"];
const GROUP_OPTIONS = [
  { value: "label",        label: "Pest / Disease Name (Label)" },
  { value: "category",     label: "Category (Disease, Pest, etc.)" },
  { value: "owner",        label: "Uploader Name (Owner)" },
  { value: "dataset_name", label: "Dataset Name" },
] as const;

const FORMAT_OPTIONS = [
  { key: "zip",    label: "Images (ZIP folders)" },
  { key: "csv",    label: "labels.csv" },
  { key: "json",   label: "labels.json" },
  { key: "readme", label: "README.txt summary" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activeFilters: { category: string; search: string; owner: string; label: string; source: string };
  count: number;
  datasetNames: string[];
  allDatasets?: Dataset[];
}

export default function DownloadModal({ open, onOpenChange, activeFilters, count, datasetNames, allDatasets }: Props) {
  const [groupBy, setGroupBy]     = useState<StructuredDownloadRequest["group_by"]>("label");
  const [limitInput, setLimitInput] = useState<string>("");
  const [formats, setFormats]     = useState<string[]>(["zip", "csv", "readme"]);
  const [filterLabel, setFilterLabel]         = useState(activeFilters.label || "");
  const [filterCategory, setFilterCategory]   = useState(activeFilters.category || "");
  const [filterDatasetName, setFilterDatasetName] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [downloadStats, setDownloadStats] = useState<{ bytes: number; total: number | null } | null>(null);
  // Dynamically calculate matching images count based on modal's selected filters
  const matchingCount = useMemo(() => {
    if (!allDatasets || allDatasets.length === 0) return count;
    return allDatasets.filter((d) => {
      if (d.project_id) return false;
      const matchesSearch = !activeFilters.search ||
        (d.dataset_name ?? "").toLowerCase().includes(activeFilters.search.toLowerCase()) ||
        (d.description ?? "").toLowerCase().includes(activeFilters.search.toLowerCase()) ||
        (d.filename ?? "").toLowerCase().includes(activeFilters.search.toLowerCase());
      const matchesOwner = !activeFilters.owner || d.owner === activeFilters.owner;
      const matchesCategory = !filterCategory || d["lab/dept"] === filterCategory;
      const matchesDatasetName = !filterDatasetName || d.dataset_name === filterDatasetName;
      const matchesLabel = !filterLabel ||
        (d.label ?? "").toLowerCase().includes(filterLabel.toLowerCase()) ||
        (d.filename ?? "").toLowerCase().includes(filterLabel.toLowerCase());
      return matchesSearch && matchesOwner && matchesCategory && matchesDatasetName && matchesLabel;
    }).length;
  }, [allDatasets, count, activeFilters, filterCategory, filterDatasetName, filterLabel]);

  const parsedLimit = limitInput.trim() ? parseInt(limitInput.trim(), 10) : undefined;
  const isValidLimit = parsedLimit !== undefined && !isNaN(parsedLimit) && parsedLimit > 0;
  const effectiveCount = isValidLimit ? Math.min(parsedLimit, matchingCount) : matchingCount;

  if (!open) return null;

  function toggleFormat(key: string) {
    setFormats((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  }

  async function handleDownload() {
    if (formats.length === 0) { setError("Select at least one format."); return; }
    setError("");
    setLoading(true);
    setDownloadStats({ bytes: 0, total: null });
    try {
      const username = typeof window !== "undefined" ? localStorage.getItem("username") ?? undefined : undefined;
      await downloadStructured(
        {
          username,
          group_by: groupBy,
          formats,
          category:  filterCategory || undefined,
          label:     filterLabel    || undefined,
          owner:     activeFilters.owner   || undefined,
          search:    activeFilters.search  || undefined,
          source:    activeFilters.source  || undefined,
          dataset_name: filterDatasetName || undefined,
          limit: isValidLimit ? parsedLimit : undefined,
        },
        (bytes, total) => setDownloadStats({ bytes, total })
      );
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setLoading(false);
      setDownloadStats(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Download Dataset</h2>
          <button onClick={() => onOpenChange(false)} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Count badge */}
        <p className="mb-5 text-sm text-zinc-400">
          <span className="font-medium text-emerald-400">{effectiveCount}</span> {isValidLimit ? `of ${matchingCount} matching images selected` : "images match selected filters"}
        </p>

        {/* Group By */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
            Organize Images Into Subfolders By
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as StructuredDownloadRequest["group_by"])}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
          >
            {GROUP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">
            Images inside the ZIP will be sorted into subfolders named after their selected attribute.
          </p>
        </div>

        {/* Quantity Limit */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
            Number of Images to Download
          </label>
          <input
            type="number"
            min={1}
            max={matchingCount}
            placeholder={`All ${matchingCount} images (leave blank for full selection)`}
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors"
          />
          <p className="mt-1 text-xs text-zinc-500">
            {isValidLimit
              ? `Downloading first ${effectiveCount} images in sequence.`
              : `Enter a specific quantity if you don't want to download all ${matchingCount} images.`}
          </p>
        </div>

        {/* Formats */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-400">
            Include in Package
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FORMAT_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  formats.includes(key)
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formats.includes(key)}
                  onChange={() => toggleFormat(key)}
                />
                <span className={`h-3.5 w-3.5 rounded border flex-shrink-0 ${formats.includes(key) ? "border-emerald-500 bg-emerald-500" : "border-zinc-600"}`} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Extra filters */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400">
              Filter by Dataset
            </label>
            <select
              value={filterDatasetName}
              onChange={(e) => setFilterDatasetName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">All</option>
              {datasetNames.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400">
              Filter by Label
            </label>
            <input
              type="text"
              placeholder="e.g. aphid"
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400">
              Filter by Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {/* ZIP structure preview */}
        <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs text-zinc-500">
          <span className="text-zinc-300">export.zip</span>
          {isValidLimit && <span className="text-zinc-500 ml-2">({effectiveCount} images max)</span>}
          <br />
          {formats.includes("zip") && (
            <>
              &nbsp;&nbsp;<span className="text-zinc-400">imgs/</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">{"<"}{groupBy}{"_value>"}/</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;img001.jpg …<br />
            </>
          )}
          {formats.includes("csv")    && <>&nbsp;&nbsp;labels.csv<br /></>}
          {formats.includes("json")   && <>&nbsp;&nbsp;labels.json<br /></>}
          {formats.includes("readme") && <>&nbsp;&nbsp;README.txt<br /></>}
        </div>

        {/* Download Progress Bar */}
        {loading && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 shadow-inner">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-emerald-300">
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-emerald-400" />
                {downloadStats && downloadStats.bytes > 0
                  ? `Downloading ZIP stream (${(downloadStats.bytes / (1024 * 1024)).toFixed(1)} MB)`
                  : `Starting ZIP stream…`}
              </span>
              <span className="font-mono text-emerald-400">
                {downloadStats && downloadStats.bytes > 0
                  ? `${(downloadStats.bytes / (1024 * 1024)).toFixed(1)} MB`
                  : "0 MB"}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/80">
              <div
                className="h-full bg-emerald-500 transition-all duration-200 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                style={{
                  width: downloadStats && downloadStats.bytes > 0 ? "100%" : "5%"
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={loading || matchingCount === 0}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {loading
              ? downloadStats && downloadStats.bytes > 0
                ? `${(downloadStats.bytes / (1024 * 1024)).toFixed(1)} MB`
                : "Starting…"
              : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
