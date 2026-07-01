"use client";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import DatasetTable from "@/components/datasets/dataset-table";
import DatasetDialog from "@/components/datasets/dataset-dialog";
import SearchFilter from "@/components/datasets/search-filter";

import { getDatasets, deleteDataset } from "@/services/datasets";
import { Dataset } from "@/types/dataset";

export default function DatasetsPage() {
  const [datasets, setDatasets]           = useState<Dataset[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [search, setSearch]               = useState("");
  const [owner, setOwner]                 = useState("");
  const [department, setDepartment]       = useState("");

  async function loadDatasets() {
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { await loadDatasets(); }
      finally { if (cancelled) return; }
    })();
    return () => { cancelled = true; };
  }, []);

  const owners = useMemo(
    () => [...new Set(datasets.map((d) => d.owner))],
    [datasets]
  );

  const departments = useMemo(
    () => [...new Set(datasets.map((d) => d["lab/dept"]))],
    [datasets]
  );

  const filteredDatasets = useMemo(() =>
    datasets.filter((dataset) => {
      const datasetName = dataset.dataset_name ?? "";
      const description = dataset.description ?? "";
      const query = search.toLowerCase();

      const matchesSearch =
        datasetName.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query);
      const matchesOwner = owner === "" || dataset.owner === owner;
      const matchesDepartment =
        department === "" || dataset["lab/dept"] === department;
      return matchesSearch && matchesOwner && matchesDepartment;
    }),
    [datasets, search, owner, department]
  );

  async function handleDelete(dataset: Dataset) {
    const confirmed = window.confirm(`Delete "${dataset.dataset_name}" ?`);
    if (!confirmed) return;
    try {
      if (dataset.image_id) {
        await deleteDataset(dataset.image_id, "antara");
      }
      // Remove from local state regardless (handles undefined image_id entries too)
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
            <h1 className="text-3xl font-bold text-white">Datasets</h1>
            <p className="mb-8 text-zinc-400">Manage all stored datasets</p>

            <SearchFilter
              search={search}
              setSearch={setSearch}
              owner={owner}
              setOwner={setOwner}
              department={department}
              setDepartment={setDepartment}
              owners={owners}
              departments={departments}
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
          </div>
        </main>
      </div>
    </div>
  );
}