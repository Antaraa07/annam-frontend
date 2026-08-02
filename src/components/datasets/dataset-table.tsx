"use client";

import Image from "next/image";
import { Eye, Trash2, Database, Leaf, Sprout } from "lucide-react";

import { Dataset } from "@/types/dataset";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/services/datasets";

interface DatasetTableProps {
  datasets: Dataset[];
  onView: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
}

function formatDate(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Read-only crop pill — purely visual, no effect on filtering or downloads */
function CropPill({ label, color }: { label?: string; color: string }) {
  if (!label || label.toUpperCase() === "NA" || label.toLowerCase() === "not specified") {
    return <span className="text-zinc-600 text-xs">—</span>;
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {label}
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
          <p className="text-sm text-zinc-400">Upload your first dataset to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-900/80">
            {[
              { label: "Image",     cls: "" },
              { label: "Dataset",   cls: "" },
              { label: "Category",  cls: "" },
              { label: "Crop Type", cls: "" },
              { label: "Crop Name", cls: "" },
              { label: "Uploaded",  cls: "" },
              { label: "Actions",   cls: "text-right" },
            ].map((h) => (
              <TableHead
                key={h.label}
                className={`text-xs font-semibold uppercase tracking-widest text-zinc-500 ${h.cls}`}
              >
                {h.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {datasets.map((dataset, index) => (
            <TableRow
              key={dataset.image_id || `dataset-${index}`}
              className="border-zinc-800/50 transition-all duration-150 hover:bg-zinc-800/30"
            >
              {/* Thumbnail */}
              <TableCell className="w-16 py-3">
                <Image
                  src={getImageUrl(dataset.filename)}
                  alt={dataset.dataset_name}
                  width={48}
                  height={48}
                  unoptimized
                  className="rounded-xl border border-zinc-700/60 object-cover shadow-sm"
                />
              </TableCell>

              {/* Dataset name + owner */}
              <TableCell className="py-3">
                <p className="font-semibold text-white leading-tight text-sm">{dataset.dataset_name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{dataset.owner}</p>
              </TableCell>

              {/* Category / lab */}
              <TableCell className="py-3">
                {dataset["lab/dept"] ? (
                  <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                    {dataset["lab/dept"]}
                  </span>
                ) : (
                  <span className="text-zinc-600 text-xs">—</span>
                )}
              </TableCell>

              {/* Crop Type — view only, does NOT affect download logic */}
              <TableCell className="py-3">
                <CropPill
                  label={dataset.crop_type}
                  color="bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                />
              </TableCell>

              {/* Crop Name — view only, does NOT affect download logic */}
              <TableCell className="py-3">
                <CropPill
                  label={dataset.crop_name}
                  color="bg-cyan-500/8 border-cyan-500/20 text-cyan-400"
                />
              </TableCell>

              {/* Uploaded date */}
              <TableCell className="whitespace-nowrap text-xs text-zinc-400 py-3">
                {formatDate(dataset.timestamp)}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-zinc-700/60 bg-zinc-900 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all"
                    onClick={() => onView(dataset)}
                    title="View details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-all"
                    onClick={() => onDelete(dataset)}
                    title="Delete dataset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
