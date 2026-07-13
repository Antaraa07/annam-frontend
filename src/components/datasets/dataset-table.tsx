"use client";

import Image from "next/image";
import { Eye, Trash2, Database, UploadCloud, FolderKanban } from "lucide-react";

import { Dataset } from "@/types/dataset";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/services/datasets";

interface DatasetTableProps {
  datasets: Dataset[];
  onView: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
}

const LABEL_COLORS: Record<string, string> = {
  aphid:    "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  bollworm: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  rust:     "bg-red-500/15 text-red-300 border-red-500/30",
  blight:   "bg-rose-500/15 text-rose-300 border-rose-500/30",
  healthy:  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  disease:  "bg-purple-500/15 text-purple-300 border-purple-500/30",
  pest:     "bg-amber-500/15 text-amber-300 border-amber-500/30",
  damage:   "bg-red-600/15 text-red-400 border-red-600/30",
};

function labelColor(label?: string) {
  if (!label) return "bg-zinc-700/40 text-zinc-400 border-zinc-600/40";
  return LABEL_COLORS[label.toLowerCase()] ?? "bg-blue-500/15 text-blue-300 border-blue-500/30";
}

function formatDate(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function SourceBadge({ dataset }: { dataset: Dataset }) {
  if (dataset.project_id) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300">
        <FolderKanban size={10} />
        {dataset.project_name ?? dataset.project_id.slice(0, 8) + "…"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-600/40 bg-zinc-800/60 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
      <UploadCloud size={10} />
      Raw Upload
    </span>
  );
}

export default function DatasetTable({ datasets, onView, onDelete }: DatasetTableProps) {
  if (datasets.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex flex-col items-center gap-3 py-16">
          <Database className="h-10 w-10 text-zinc-600" />
          <h2 className="text-lg font-semibold text-white">No datasets found</h2>
          <p className="text-sm text-zinc-500">Upload your first dataset to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-700 bg-zinc-800 hover:bg-zinc-800">
            {["Image", "Dataset", "Source", "Label", "Category", "Uploaded", "Actions"].map((h) => (
              <TableHead
                key={h}
                className={`text-xs font-semibold uppercase tracking-wider text-zinc-400 ${h === "Actions" ? "text-right" : ""}`}
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {datasets.map((dataset, index) => (
            <TableRow
              key={dataset.image_id || `dataset-${index}`}
              className="border-zinc-800 transition hover:bg-zinc-800/40"
            >
              {/* Thumbnail */}
              <TableCell className="w-16">
                <Image
                  src={getImageUrl(dataset.filename)}
                  alt={dataset.dataset_name}
                  width={52}
                  height={52}
                  unoptimized
                  className="rounded-lg border border-zinc-700 object-cover"
                />
              </TableCell>

              {/* Dataset name + owner */}
              <TableCell>
                <p className="font-medium text-white leading-tight">{dataset.dataset_name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{dataset.owner}</p>
              </TableCell>

              {/* Source badge */}
              <TableCell><SourceBadge dataset={dataset} /></TableCell>

              {/* Label badge */}
              <TableCell>
                {dataset.label ? (
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${labelColor(dataset.label)}`}>
                    {dataset.label}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-600">—</span>
                )}
              </TableCell>

              {/* Category */}
              <TableCell className="text-sm text-zinc-300">{dataset["lab/dept"] || "—"}</TableCell>

              {/* Uploaded date */}
              <TableCell className="whitespace-nowrap text-sm text-zinc-400">
                {formatDate(dataset.timestamp)}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-zinc-700 bg-zinc-900 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all"
                    onClick={() => onView(dataset)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="transition hover:scale-105"
                    onClick={() => onDelete(dataset)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
