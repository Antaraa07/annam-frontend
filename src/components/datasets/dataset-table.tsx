"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Database, Folder, FolderOpen, Plus, Images, Download, Check, X, Clock, Bell, XCircle } from "lucide-react";

import { Dataset } from "@/types/dataset";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getImageUrl, DeletionRequest, downloadRawImagesZip } from "@/services/datasets";

interface DatasetTableProps {
  datasets: Dataset[];
  selectedFolder: string | null;
  selectedSubfolder: string | null;
  currentUserRole?: string;
  currentUsername?: string;
  deletionRequests?: DeletionRequest[];
  onSelectFolder: (folderName: string | null) => void;
  onSelectSubfolder: (subfolderName: string | null) => void;
  onView: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
  onDeleteFolder?: (folderName: string) => void;
  onRequestDelete?: (target_type: "folder" | "image", target_id: string) => void;
  onApproveDelete?: (request_id: string) => void;
  onRejectDelete?: (request_id: string) => void;
}

function formatDate(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function CropPill({ label, color }: { label?: string; color: string }) {
  if (!label || label.toUpperCase() === "NA" || label.toLowerCase() === "not specified") {
    return <span className="text-zinc-600 text-xs">—</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function DatasetTable({
  datasets,
  selectedFolder,
  selectedSubfolder,
  currentUserRole = "",
  currentUsername = "",
  deletionRequests = [],
  onSelectFolder,
  onSelectSubfolder,
  onView,
  onDelete,
  onDeleteFolder,
  onRequestDelete,
  onApproveDelete,
  onRejectDelete,
}: DatasetTableProps) {
  const router = useRouter();

  // Helper to find latest request for a target ID or matching folder items
  const findLatestRequest = (target_id: string, folderItems: Dataset[] = []) => {
    if (!target_id) return undefined;
    const directReq = deletionRequests.find(
      (r) => r.target_id === target_id || r.target_id.toLowerCase() === target_id.toLowerCase()
    );
    if (directReq) return directReq;

    for (const item of folderItems) {
      if (item.image_id) {
        const childReq = deletionRequests.find(
          (r) => r.target_id === item.image_id || r.target_id.toLowerCase() === item.image_id.toLowerCase()
        );
        if (childReq) return childReq;
      }
    }
    return undefined;
  };

  // 1. Group datasets by Dataset Name (Root Folders)
  const folderGroups = useMemo(() => {
    const map = new Map<string, Dataset[]>();
    for (const d of datasets) {
      const name = d.dataset_name || "Unassigned";
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(d);
    }
    return Array.from(map.entries()).map(([folderName, items]) => {
      const categories = Array.from(new Set(items.map((i) => i["lab/dept"] || "General"))).filter(Boolean);
      const owner = items[0]?.owner || "—";
      const crop_type = items.find((i) => i.crop_type)?.crop_type;
      const crop_name = items.find((i) => i.crop_name)?.crop_name;
      const timestamps = items.map((i) => i.timestamp).filter(Boolean) as string[];
      const latest_ts = timestamps.length ? timestamps.sort().reverse()[0] : undefined;
      return {
        folderName,
        items,
        image_count: items.length,
        categories,
        owner,
        crop_type,
        crop_name,
        latest_ts,
        first_image: items[0],
      };
    });
  }, [datasets]);

  // 2. Group datasets inside selectedFolder by Category (Subfolders)
  const subfolderGroups = useMemo(() => {
    if (!selectedFolder) return [];
    const itemsInFolder = datasets.filter((d) => (d.dataset_name || "Unassigned") === selectedFolder);
    const map = new Map<string, Dataset[]>();
    for (const item of itemsInFolder) {
      const cat = item["lab/dept"] || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries()).map(([subfolderName, items]) => {
      const crop_type = items.find((i) => i.crop_type)?.crop_type;
      const crop_name = items.find((i) => i.crop_name)?.crop_name;
      const timestamps = items.map((i) => i.timestamp).filter(Boolean) as string[];
      const latest_ts = timestamps.length ? timestamps.sort().reverse()[0] : undefined;
      return {
        subfolderName,
        items,
        image_count: items.length,
        crop_type,
        crop_name,
        latest_ts,
        first_image: items[0],
      };
    });
  }, [datasets, selectedFolder]);

  // 3. Filtered images inside selectedFolder & selectedSubfolder
  const activeImages = useMemo(() => {
    if (!selectedFolder || !selectedSubfolder) return [];
    return datasets.filter(
      (d) => (d.dataset_name || "Unassigned") === selectedFolder && (d["lab/dept"] || "General") === selectedSubfolder
    );
  }, [datasets, selectedFolder, selectedSubfolder]);

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

  // ── LEVEL 1: ROOT FOLDERS VIEW ──────────────────────────────────────────────
  if (!selectedFolder) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-900/80">
              {[
                { label: "Preview",       cls: "w-16" },
                { label: "Dataset Folder",cls: "" },
                { label: "No. of Images", cls: "text-center" },
                { label: "Categories",   cls: "" },
                { label: "Crop Type",    cls: "" },
                { label: "Crop Name",    cls: "" },
                { label: "Uploaded",     cls: "" },
                { label: "Actions",      cls: "text-right" },
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
            {folderGroups.map((group) => {
              const req = findLatestRequest(group.folderName, group.items);
              const isPending = req?.status === "pending";
              const isRejected = req?.status === "rejected";

              return (
                <TableRow
                  key={group.folderName}
                  className={`border-zinc-800/50 transition-all duration-150 cursor-pointer ${
                    isPending ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-zinc-800/40"
                  }`}
                  onClick={() => onSelectFolder(group.folderName)}
                >
                  {/* Thumbnail Preview */}
                  <TableCell className="py-3">
                    <div className="relative h-12 w-12 shrink-0">
                      <Image
                        src={getImageUrl(group.first_image?.filename)}
                        alt={group.folderName}
                        width={48}
                        height={48}
                        unoptimized
                        className="rounded-xl border border-zinc-700/60 object-cover shadow-sm h-12 w-12"
                      />
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                        <Folder size={11} />
                      </div>
                    </div>
                  </TableCell>

                  {/* Dataset Folder Name & Deletion Status */}
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-emerald-400 shrink-0" />
                        <p className="font-semibold text-white leading-tight text-sm hover:text-emerald-400 transition-colors">
                          {group.folderName}
                        </p>
                      </div>
                      <p className="text-xs text-zinc-400">Owner: {group.owner}</p>

                      {/* Deletion Request Status Banner */}
                      {isPending && currentUserRole === "superadmin" && (
                        <div className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300 w-fit">
                          <Bell size={13} className="text-amber-400 animate-bounce" />
                          <span>Deletion Requested by <span className="text-white font-bold">{req.requested_by}</span></span>
                        </div>
                      )}

                      {isPending && currentUserRole === "admin" && (
                        <div className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300 w-fit">
                          <Clock size={13} className="animate-pulse" />
                          <span>Req Sent (Pending Superadmin Approval)</span>
                        </div>
                      )}

                      {isRejected && currentUserRole === "admin" && (
                        <div className="flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-300 w-fit">
                          <XCircle size={13} />
                          <span>Deletion Request Rejected by Superadmin</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* No. of Images */}
                  <TableCell className="py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      <Images size={13} />
                      {group.image_count} {group.image_count === 1 ? "img" : "imgs"}
                    </span>
                  </TableCell>

                  {/* Categories badges */}
                  <TableCell className="py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {group.categories.slice(0, 3).map((cat) => (
                        <span key={cat} className="rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                          {cat}
                        </span>
                      ))}
                      {group.categories.length > 3 && (
                        <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-400">
                          +{group.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Crop Type */}
                  <TableCell className="py-3">
                    <CropPill
                      label={group.crop_type}
                      color="bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                    />
                  </TableCell>

                  {/* Crop Name */}
                  <TableCell className="py-3">
                    <CropPill
                      label={group.crop_name}
                      color="bg-cyan-500/8 border-cyan-500/20 text-cyan-400"
                    />
                  </TableCell>

                  {/* Uploaded date */}
                  <TableCell className="whitespace-nowrap text-xs text-zinc-400 py-3">
                    {formatDate(group.latest_ts)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 border-zinc-700/60 bg-zinc-900 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all text-xs"
                        onClick={() => onSelectFolder(group.folderName)}
                        title="Open dataset folder"
                      >
                        <FolderOpen className="h-3.5 w-3.5" /> Open
                      </Button>

                      {/* Icon-only download button for raw images */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-zinc-700/60 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
                        onClick={() => downloadRawImagesZip(group.folderName)}
                        title="Download Raw Images ZIP"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500 transition-all text-xs"
                        onClick={() => router.push(`/upload?dataset_name=${encodeURIComponent(group.folderName)}`)}
                        title="Add raw data to this dataset folder"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Data
                      </Button>

                      {/* Superadmin Approve/Reject controls vs Admin Request button */}
                      {isPending && currentUserRole === "superadmin" ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-2.5 rounded-lg shadow transition-all"
                            onClick={() => onApproveDelete && onApproveDelete(req.request_id)}
                            title="Approve Deletion Request"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs px-2 rounded-lg transition-all"
                            onClick={() => onRejectDelete && onRejectDelete(req.request_id)}
                            title="Reject Deletion Request"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      ) : currentUserRole === "superadmin" ? (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-all"
                          onClick={() => onDeleteFolder && onDeleteFolder(group.folderName)}
                          title="Delete entire dataset folder"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={isPending}
                          className="h-8 w-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-all disabled:opacity-40"
                          onClick={() => onRequestDelete && onRequestDelete("folder", group.folderName)}
                          title={isPending ? "Deletion approval request pending" : "Request deletion approval from Superadmin"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  // ── LEVEL 2: SUBFOLDERS VIEW (Categories inside a Dataset) ────────────────
  if (selectedFolder && !selectedSubfolder) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-900/80">
              {[
                { label: "Preview",           cls: "w-16" },
                { label: "Category Subfolder",cls: "" },
                { label: "No. of Images",     cls: "text-center" },
                { label: "Crop Type",        cls: "" },
                { label: "Crop Name",        cls: "" },
                { label: "Uploaded",         cls: "" },
                { label: "Actions",          cls: "text-right" },
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
            {subfolderGroups.map((group) => (
              <TableRow
                key={group.subfolderName}
                className="border-zinc-800/50 transition-all duration-150 hover:bg-zinc-800/40 cursor-pointer"
                onClick={() => onSelectSubfolder(group.subfolderName)}
              >
                {/* Thumbnail Preview */}
                <TableCell className="py-3">
                  <Image
                    src={getImageUrl(group.first_image?.filename)}
                    alt={group.subfolderName}
                    width={48}
                    height={48}
                    unoptimized
                    className="rounded-xl border border-zinc-700/60 object-cover shadow-sm h-12 w-12"
                  />
                </TableCell>

                {/* Subfolder Category Name */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white leading-tight text-sm hover:text-cyan-400 transition-colors">
                        {group.subfolderName}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">Category inside {selectedFolder}</p>
                    </div>
                  </div>
                </TableCell>

                {/* No. of Images */}
                <TableCell className="py-3 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                    <Images size={13} />
                    {group.image_count} {group.image_count === 1 ? "img" : "imgs"}
                  </span>
                </TableCell>

                {/* Crop Type */}
                <TableCell className="py-3">
                  <CropPill
                    label={group.crop_type}
                    color="bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                  />
                </TableCell>

                {/* Crop Name */}
                <TableCell className="py-3">
                  <CropPill
                    label={group.crop_name}
                    color="bg-cyan-500/8 border-cyan-500/20 text-cyan-400"
                  />
                </TableCell>

                {/* Uploaded date */}
                <TableCell className="whitespace-nowrap text-xs text-zinc-400 py-3">
                  {formatDate(group.latest_ts)}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 border-zinc-700/60 bg-zinc-900 text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all text-xs"
                      onClick={() => onSelectSubfolder(group.subfolderName)}
                      title="Open subfolder images"
                    >
                      <FolderOpen className="h-3.5 w-3.5" /> View Images
                    </Button>

                    {/* Icon-only download button for raw images */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-zinc-700/60 bg-zinc-900 text-zinc-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
                      onClick={() => downloadRawImagesZip(selectedFolder, group.subfolderName)}
                      title="Download Raw Images ZIP"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500 transition-all text-xs"
                      onClick={() => router.push(`/upload?dataset_name=${encodeURIComponent(selectedFolder)}&category=${encodeURIComponent(group.subfolderName)}`)}
                      title="Add raw data to this category subfolder"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Data
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

  // ── LEVEL 3: INDIVIDUAL IMAGES VIEW ─────────────────────────────────────────
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-900/80">
            {[
              { label: "Image",     cls: "w-16" },
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
          {activeImages.map((dataset, index) => {
            const req = findLatestRequest(dataset.image_id);
            const isPending = req?.status === "pending";
            const isRejected = req?.status === "rejected";

            return (
              <TableRow
                key={dataset.image_id || `dataset-${index}`}
                className={`border-zinc-800/50 transition-all duration-150 ${
                  isPending ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-zinc-800/30"
                }`}
              >
                {/* Thumbnail */}
                <TableCell className="w-16 py-3">
                  <Image
                    src={getImageUrl(dataset.filename)}
                    alt={dataset.dataset_name}
                    width={48}
                    height={48}
                    unoptimized
                    className="rounded-xl border border-zinc-700/60 object-cover shadow-sm h-12 w-12"
                  />
                </TableCell>

                {/* Dataset name + owner + status */}
                <TableCell className="py-3">
                  <p className="font-semibold text-white leading-tight text-sm">{dataset.dataset_name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{dataset.owner}</p>

                  {isPending && currentUserRole === "superadmin" && (
                    <div className="mt-1 flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300 w-fit">
                      <Bell size={13} className="text-amber-400 animate-bounce" />
                      <span>Deletion Requested by <span className="text-white font-bold">{req.requested_by}</span></span>
                    </div>
                  )}

                  {isPending && currentUserRole === "admin" && (
                    <div className="mt-1 flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300 w-fit">
                      <Clock size={13} className="animate-pulse" />
                      <span>Req Sent (Pending Superadmin Approval)</span>
                    </div>
                  )}

                  {isRejected && currentUserRole === "admin" && (
                    <div className="mt-1 flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-300 w-fit">
                      <XCircle size={13} />
                      <span>Deletion Request Rejected by Superadmin</span>
                    </div>
                  )}
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

                {/* Crop Type */}
                <TableCell className="py-3">
                  <CropPill
                    label={dataset.crop_type}
                    color="bg-emerald-500/8 border-emerald-500/20 text-emerald-400"
                  />
                </TableCell>

                {/* Crop Name */}
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
                  <div className="flex justify-end items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-zinc-700/60 bg-zinc-900 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all"
                      onClick={() => onView(dataset)}
                      title="View image details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>

                    {isPending && currentUserRole === "superadmin" ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-2.5 rounded-lg shadow transition-all"
                          onClick={() => onApproveDelete && onApproveDelete(req.request_id)}
                          title="Approve Deletion Request"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 border-rose-500/50 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs px-2 rounded-lg transition-all"
                          onClick={() => onRejectDelete && onRejectDelete(req.request_id)}
                          title="Reject Deletion Request"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    ) : currentUserRole === "superadmin" ? (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-all"
                        onClick={() => onDelete(dataset)}
                        title="Delete image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="icon"
                        disabled={isPending}
                        className="h-8 w-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-all disabled:opacity-40"
                        onClick={() => onRequestDelete && onRequestDelete("image", dataset.image_id)}
                        title={isPending ? "Deletion approval request pending" : "Request deletion approval from Superadmin"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
