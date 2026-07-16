"use client";

import Image from "next/image";
import { Eye, Trash2, Database } from "lucide-react";

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
            {["Image", "Dataset", "Category", "Uploaded", "Actions"].map((h) => (
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
