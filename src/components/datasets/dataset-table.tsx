"use client";

import Image from "next/image";
import { Eye, Trash2, Database } from "lucide-react";

import { Dataset } from "@/types/dataset";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/services/datasets";

interface DatasetTableProps {
  datasets: Dataset[];
  onView: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
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
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Image</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Dataset</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Owner</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Department</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Version</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-zinc-200">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {datasets.map((dataset, index) => (
            <TableRow
              key={dataset.image_id || `dataset-${index}`}
              className="border-zinc-800 transition hover:bg-zinc-800/40"
            >
              <TableCell>
                <Image
                  src={getImageUrl(dataset.filename)}
                  alt={dataset.dataset_name || `Dataset ${dataset.image_id}`}
                  width={60}
                  height={60}
                  unoptimized
                  className="rounded-xl border border-zinc-700 object-cover shadow-md"
                />
              </TableCell>

              <TableCell className="font-medium text-white">{dataset.dataset_name}</TableCell>
              <TableCell className="text-zinc-300">{dataset.owner}</TableCell>
              <TableCell className="text-zinc-300">{dataset["lab/dept"]}</TableCell>
              <TableCell className="text-zinc-300">{dataset.version}</TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-zinc-700 bg-zinc-900 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all duration-200"
                    onClick={() => onView(dataset)}
                  >
                    <Eye className="h-5 w-5" />
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