"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import { bulkUploadToProject } from "@/services/projects";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function BulkUploadPage() {
  const params = useParams<{ project_id: string }>();
  const projectId = params.project_id;

  const [label, setLabel] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ uploaded_count: number; files: string[] } | null>(null);

  async function onSubmit() {
    if (!files.length) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await bulkUploadToProject({
        projectId,
        files,
        label: label.trim() ? label.trim() : undefined,
      });
      setResult(res);
      setFiles([]);
      setLabel("");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />

      <div className="relative z-10 flex w-full">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-auto p-8">
            <h1 className="text-3xl font-bold text-white">Bulk upload</h1>
            <p className="mt-2 text-zinc-400">Project ID: {projectId}</p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="p-5">
                <div className="text-sm font-medium text-white">Select images</div>
                <div className="mt-3">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const next = Array.from(e.target.files || []);
                      setFiles(next);
                    }}
                  />
                </div>

                <div className="mt-3 text-xs text-zinc-500">Selected: {files.length}</div>

                <div className="mt-5 grid gap-2">
                  <div className="text-sm font-medium text-white">Optional label</div>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. DiseaseA" />
                </div>

                <div className="mt-5 flex justify-end">
                  <Button disabled={uploading || !files.length} onClick={onSubmit}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-sm font-medium text-white">Result</div>
                <div className="mt-3 text-sm text-zinc-300">
                  {result ? (
                    <div>
                      <div className="text-2xl font-bold text-white">{result.uploaded_count}</div>
                      <div className="mt-2 text-zinc-500">Uploaded filenames</div>
                      <ul className="mt-2 max-h-72 overflow-auto text-xs text-zinc-400 list-disc pl-5">
                        {result.files.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-zinc-500">No upload yet.</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

