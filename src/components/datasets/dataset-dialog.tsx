"use client";

import Image from "next/image";
import { Download, Database, User, Tag, FileText, Hash, File, Calendar, FolderOpen } from "lucide-react";

import { Dataset } from "@/types/dataset";
import { getImageUrl, getDownloadUrl } from "@/services/datasets";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset: Dataset | null;
}

export default function DatasetDialog({ open, onOpenChange, dataset }: Props) {
  if (!dataset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl overflow-hidden border border-zinc-800 bg-zinc-950 p-0 text-white">

        {/* ── Header ── */}
        <DialogHeader className="border-b border-zinc-800 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <Database size={14} className="text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white leading-tight">
                {dataset.dataset_name}
              </DialogTitle>
              <p className="text-[11px] text-zinc-500">Dataset Details</p>
            </div>
          </div>
        </DialogHeader>

        {/* ── Full-width image ── */}
        <div className="flex items-center justify-center bg-zinc-900/60 px-8 py-6">
          <Image
            src={getImageUrl(dataset.filename)}
            alt={dataset.dataset_name}
            width={900}
            height={600}
            unoptimized
            className="max-h-[38vh] w-auto max-w-full rounded-xl object-contain transition duration-300 hover:scale-[1.02]"
          />
        </div>

        {/* ── Info cards ── */}
        <div className="border-t border-zinc-800 bg-zinc-900/80 px-5 py-4 space-y-3">

          {/* Row 1: 4 equal columns */}
          <div className="grid grid-cols-4 gap-2">
            <InfoCard icon={Database}    label="Dataset"    value={dataset.dataset_name} />
            <InfoCard icon={User}        label="Owner"      value={dataset.owner} />
            <InfoCard icon={Tag}         label="Label"      value={dataset.label} />
            <InfoCard icon={Tag}         label="Category"   value={dataset["lab/dept"]} />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-2">
            <InfoCard icon={FolderOpen}  label="Project ID" value={dataset.project_id} mono />
            <InfoCard icon={Calendar}    label="Uploaded"   value={dataset.timestamp ? new Date(dataset.timestamp).toLocaleString("en-IN") : undefined} />
            <InfoCard icon={FileText}    label="Version"    value={dataset.version} />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-2">
            <InfoCard icon={FileText} label="Description" value={dataset.description} />
            <div className="grid grid-rows-2 gap-2">
              <InfoCard icon={Hash} label="Image ID"  value={dataset.image_id} mono />
              <InfoCard icon={File} label="Filename"  value={dataset.filename} mono />
            </div>
          </div>

        </div>

        {/* ── Download ── */}
        <div className="border-t border-zinc-800 px-5 py-3">
          <a
            href={getDownloadUrl(dataset.filename)}
            download
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-black transition-all hover:scale-[1.01] hover:bg-emerald-400"
          >
            <Download size={15} />
            Download Image
          </a>
        </div>

      </DialogContent>
    </Dialog>
  );
}

interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string | undefined;
  mono?: boolean;
}

function InfoCard({ icon: Icon, label, value, mono = false }: InfoCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 transition hover:border-emerald-500/30">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon size={10} className="text-emerald-400 shrink-0" />
        <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500 truncate">
          {label}
        </p>
      </div>
      <p className={`break-all leading-5 ${mono ? "font-mono text-[10px] text-emerald-300" : "text-xs text-white"}`}>
        {value || "—"}
      </p>
    </div>
  );
}