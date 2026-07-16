"use client";

import { useMemo, useState } from "react";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import DatasetTable from "@/components/datasets/dataset-table";
import DatasetDialog from "@/components/datasets/dataset-dialog";
import SearchFilter from "@/components/datasets/search-filter";
import DownloadModal from "@/components/datasets/download-modal";

import { getDatasets, deleteDataset } from "@/services/datasets";
import { Dataset } from "@/types/dataset";
import { usePolling } from "@/hooks/usePolling";
import { RefreshCw, Download } from "lucide-react";

export default function DatasetsPage() {
  const [datasets, setDatasets]           = useState<Dataset[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [search, setSearch]               = useState("");
  const [owner, setOwner]                 = useState("");
  const [category, setCategory]           = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  async function loadDatasets() {
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  usePolling(loadDatasets);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDatasets();
  }

  const owners = useMemo(
    () => [...new Set(datasets.filter(d => !d.project_id).map((d) => d.owner))],
    [datasets]
  );

  const filteredDatasets = useMemo(() =>
    datasets.filter((dataset) => {
      // 1. Exclude any project/annotated data - raw only!
      if (dataset.project_id) return false;

      const datasetName = dataset.dataset_name ?? "";
      const description = dataset.description ?? "";
      const query = search.toLowerCase();
      const matchesSearch   = datasetName.toLowerCase().includes(query) || description.toLowerCase().includes(query);
      const matchesOwner    = owner === "" || dataset.owner === owner;
      const matchesCategory = category === "" || dataset["lab/dept"] === category;
      return matchesSearch && matchesOwner && matchesCategory;
    }),
    [datasets, search, owner, category]
  );

  async function handleDelete(dataset: Dataset) {
    const confirmed = window.confirm(`Delete "${dataset.dataset_name}" ?`);
    if (!confirmed) return;
    try {
      if (dataset.image_id) {
        const username = localStorage.getItem("username") || "";
        await deleteDataset(dataset.image_id, username);
      }
      setDatasets((prev) => prev.filter((d) => d !== dataset));
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  }

  function handleView(dataset: Dataset) {
    setSelectedDataset(dataset);
    setDialogOpen(true);
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />

      <div className="relative z-10 flex w-full">
        <Sidebar />

        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-auto p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Datasets</h1>
                <p className="text-zinc-400">Manage all stored raw datasets</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  onClick={() => setDownloadOpen(true)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors ${
                    filteredDatasets.length === 0 ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <Download size={14} />
                  Download ({filteredDatasets.length})
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

            <SearchFilter
              search={search}
              setSearch={setSearch}
              owner={owner}
              setOwner={setOwner}
              category={category}
              setCategory={setCategory}
              owners={owners}
            />

            {loading ? (
              <div className="mt-10 text-center text-zinc-500">
                Loading datasets...
              </div>
            ) : (
              <DatasetTable
                datasets={filteredDatasets}
                onView={handleView}
                onDelete={handleDelete}
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
              count={filteredDatasets.length}
            />
          </div>
        </main>
      </div>
    </div>
  );
}