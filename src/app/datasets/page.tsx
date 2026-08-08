"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/layout/app-shell";

import DatasetTable from "@/components/datasets/dataset-table";
import DatasetDialog from "@/components/datasets/dataset-dialog";
import SearchFilter from "@/components/datasets/search-filter";
import DownloadModal from "@/components/datasets/download-modal";

import {
  getDatasets, deleteDataset, getDeletionRequests,
  createDeletionRequest, approveDeletionRequest, rejectDeletionRequest,
  DeletionRequest, downloadRawImagesZip
} from "@/services/datasets";
import { Dataset } from "@/types/dataset";
import { usePolling } from "@/hooks/usePolling";
import { RefreshCw, Download, ChevronRight, Folder, FolderOpen, ArrowLeft, Bell } from "lucide-react";

export default function DatasetsPage() {
  const router = useRouter();

  const [datasets, setDatasets]           = useState<Dataset[]>([]);
  const [users, setUsers]                 = useState<{ username: string; role: string }[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [search, setSearch]               = useState("");
  const [owner, setOwner]                 = useState("");
  const [category, setCategory]           = useState("");
  const [roleFilter, setRoleFilter]       = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [filterPendingRequests, setFilterPendingRequests] = useState(false);

  // Folder navigation hierarchy state
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string | null>(null);

  // User role & username from localStorage
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserRole(localStorage.getItem("role") || "");
      setCurrentUsername(localStorage.getItem("username") || "");
      
      const params = new URLSearchParams(window.location.search);
      const folderParam = params.get("folder");
      const categoryParam = params.get("category");
      if (folderParam) {
        setSelectedFolder(folderParam);
      }
      if (categoryParam) {
        setCategory(categoryParam);
      }
    }
  }, []);

  async function loadData() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [data, reqs, usersRes] = await Promise.all([
        getDatasets(),
        getDeletionRequests(),
        fetch(`${API_URL}/users`).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setDatasets(data);
      setDeletionRequests(reqs);
      setUsers(usersRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  usePolling(loadData);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  const userRoleMap = useMemo(() => new Map(users.map(u => [u.username, u.role])), [users]);

  const owners = useMemo(() => {
    let filtered = datasets.filter(d => !d.project_id);
    if (roleFilter) {
      filtered = filtered.filter(d => userRoleMap.get(d.owner) === roleFilter);
    }
    return [...new Set(filtered.map((d) => d.owner))];
  }, [datasets, roleFilter, userRoleMap]);

  const datasetNames = useMemo(
    () => [...new Set(datasets.filter(d => !d.project_id && d.dataset_name).map((d) => d.dataset_name))],
    [datasets]
  );

  const pendingRequests = useMemo(
    () => deletionRequests.filter((r) => r.status === "pending"),
    [deletionRequests]
  );

  const filteredDatasets = useMemo(() =>
    datasets.filter((dataset) => {
      // Exclude any project/annotated data - raw only!
      if (dataset.project_id) return false;

      // Interns and students can only see their own datasets
      if ((currentUserRole === "intern" || currentUserRole === "student") && dataset.owner !== currentUsername) {
        return false;
      }

      const datasetName = dataset.dataset_name ?? "";
      const description = dataset.description ?? "";
      const query = search.toLowerCase();
      const matchesSearch   = datasetName.toLowerCase().includes(query) || description.toLowerCase().includes(query);
      const matchesOwner    = owner === "" || dataset.owner === owner;
      const matchesCategory = category === "" || (dataset.department || dataset["lab/dept"]) === category;
      const matchesRole     = roleFilter === "" || userRoleMap.get(dataset.owner) === roleFilter;
      return matchesSearch && matchesOwner && matchesCategory && matchesRole;
    }),
    [datasets, search, owner, category, roleFilter, userRoleMap, currentUserRole, currentUsername]
  );

  const displayedDatasets = useMemo(() => {
    if (!filterPendingRequests) return filteredDatasets;
    const pendingTargetIds = new Set(pendingRequests.map((r) => r.target_id));
    return filteredDatasets.filter(
      (d) => pendingTargetIds.has(d.dataset_name) || pendingTargetIds.has(d.image_id)
    );
  }, [filteredDatasets, filterPendingRequests, pendingRequests]);

  // Deletion logic: Superadmin deletes directly; Admin creates deletion request after confirmation
  async function handleDelete(dataset: Dataset) {
    if (currentUserRole === "superadmin") {
      const confirmed = window.confirm(`Double Check: Permanently delete image "${dataset.filename || dataset.image_id}"?`);
      if (!confirmed) return;
      try {
        if (dataset.image_id) {
          const username = localStorage.getItem("username") || "";
          await deleteDataset(dataset.image_id, username);
        }
        setDatasets((prev) => prev.filter((d) => d.image_id !== dataset.image_id));
      } catch (error) {
        console.error(error);
        alert("Delete failed");
      }
    } else {
      const confirmed = window.confirm(`Double Check: Send deletion request for image "${dataset.filename || dataset.image_id}" to Superadmin for approval?`);
      if (!confirmed) return;
      try {
        await createDeletionRequest("image", dataset.image_id, currentUsername);
        await loadData();
      } catch (error) {
        console.error(error);
        alert("Failed to send deletion request");
      }
    }
  }

  async function handleDeleteFolder(folderName: string) {
    const targetImages = datasets.filter((d) => (d.dataset_name || "Unassigned") === folderName);
    if (currentUserRole === "superadmin") {
      const confirmed = window.confirm(`Double Check: Permanently delete dataset folder "${folderName}" and all ${targetImages.length} images inside?`);
      if (!confirmed) return;
      try {
        const username = localStorage.getItem("username") || "";
        for (const img of targetImages) {
          if (img.image_id) {
            await deleteDataset(img.image_id, username);
          }
        }
        setDatasets((prev) => prev.filter((d) => (d.dataset_name || "Unassigned") !== folderName));
        if (selectedFolder === folderName) {
          setSelectedFolder(null);
          setSelectedSubfolder(null);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to delete dataset folder");
      }
    } else {
      const confirmed = window.confirm(`Double Check: Send deletion request for dataset folder "${folderName}" to Superadmin for approval?`);
      if (!confirmed) return;
      try {
        await createDeletionRequest("folder", folderName, currentUsername);
        await loadData();
      } catch (error) {
        console.error(error);
        alert("Failed to send deletion request");
      }
    }
  }

  async function handleRequestDelete(target_type: "folder" | "image", target_id: string) {
    const confirmed = window.confirm(`Double Check: Send deletion request for ${target_type} "${target_id}" to Superadmin for approval?`);
    if (!confirmed) return;
    try {
      await createDeletionRequest(target_type, target_id, currentUsername);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to send deletion request");
    }
  }

  async function handleApproveDelete(request_id: string) {
    const confirmed = window.confirm("Approve and permanently delete this dataset/folder?");
    if (!confirmed) return;
    try {
      await approveDeletionRequest(request_id, currentUserRole);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Approval failed");
    }
  }

  async function handleRejectDelete(request_id: string) {
    try {
      await rejectDeletionRequest(request_id, currentUserRole);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Rejection failed");
    }
  }

  function handleView(dataset: Dataset) {
    setSelectedDataset(dataset);
    setDialogOpen(true);
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-8">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Datasets</h1>
                <p className="text-zinc-400">Manage all stored raw datasets in structured folders</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Superadmin Deletion Notification Bell */}
                {currentUserRole === "superadmin" && (
                  <button
                    onClick={() => setFilterPendingRequests((prev) => !prev)}
                    className={`relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                      filterPendingRequests
                        ? "border-amber-500 bg-amber-500/20 text-amber-300 shadow-md shadow-amber-500/10"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400"
                    }`}
                    title="Filter Datasets with Pending Deletion Requests"
                  >
                    <Bell size={16} className={pendingRequests.length > 0 ? "text-amber-400 animate-bounce" : "text-zinc-400"} />
                    <span>Requests ({pendingRequests.length})</span>
                    {pendingRequests.length > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-black shadow">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>
                )}

                <a
                  onClick={() => setDownloadOpen(true)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors ${
                    displayedDatasets.length === 0 ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <Download size={14} />
                  Download ({displayedDatasets.length})
                </a>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Breadcrumb Navigation Bar */}
            <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <button
                  onClick={() => { setSelectedFolder(null); setSelectedSubfolder(null); }}
                  className={`flex items-center gap-1.5 transition-colors ${
                    selectedFolder ? "text-emerald-400 hover:underline" : "text-white font-semibold"
                  }`}
                >
                  <Folder size={16} /> Datasets Root
                </button>

                {selectedFolder && (
                  <>
                    <ChevronRight size={14} className="text-zinc-600" />
                    <button
                      onClick={() => setSelectedSubfolder(null)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        selectedSubfolder ? "text-cyan-400 hover:underline" : "text-white font-semibold"
                      }`}
                    >
                      <FolderOpen size={15} /> {selectedFolder}
                    </button>
                  </>
                )}

                {selectedSubfolder && (
                  <>
                    <ChevronRight size={14} className="text-zinc-600" />
                    <span className="flex items-center gap-1.5 text-white font-semibold">
                      {selectedSubfolder}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Icon-only download button for raw images when inside a folder */}
                {selectedFolder && (
                  <button
                    onClick={() => downloadRawImagesZip(selectedFolder, selectedSubfolder || undefined)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                    title="Download Raw Images ZIP"
                  >
                    <Download size={14} />
                  </button>
                )}

                {selectedFolder && (
                  <button
                    onClick={() => {
                      if (selectedSubfolder) setSelectedSubfolder(null);
                      else setSelectedFolder(null);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>
                )}
              </div>
            </div>

            <SearchFilter
              search={search}
              setSearch={setSearch}
              owner={owner}
              setOwner={setOwner}
              category={category}
              setCategory={setCategory}
              owners={owners}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              currentUserRole={currentUserRole}
            />

            {loading ? (
              <div className="mt-10 text-center text-zinc-500">
                Loading datasets...
              </div>
            ) : (
              <DatasetTable
                datasets={displayedDatasets}
                selectedFolder={selectedFolder}
                selectedSubfolder={selectedSubfolder}
                currentUserRole={currentUserRole}
                currentUsername={currentUsername}
                deletionRequests={deletionRequests}
                onSelectFolder={(f) => { setSelectedFolder(f); setSelectedSubfolder(null); }}
                onSelectSubfolder={(s) => setSelectedSubfolder(s)}
                onView={handleView}
                onDelete={handleDelete}
                onDeleteFolder={handleDeleteFolder}
                onRequestDelete={handleRequestDelete}
                onApproveDelete={handleApproveDelete}
                onRejectDelete={handleRejectDelete}
              />
            )}

            <DatasetDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              dataset={selectedDataset}
            />

            <DownloadModal
              open={downloadOpen}
              onOpenChange={setDownloadOpen}
              activeFilters={{ category, search, owner, label: "", source: "raw" }}
              count={displayedDatasets.length}
              datasetNames={datasetNames}
              allDatasets={datasets}
            />
      </div>
    </AppShell>
  );
}