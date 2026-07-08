"use client";

import { useMemo, useState } from "react";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import Link from "next/link";

import { Project } from "@/types/project";
import { createProject, deleteProject, listMyProjects } from "@/services/projects";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePolling } from "@/hooks/usePolling";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [labelClassesRaw, setLabelClassesRaw] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await listMyProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }

  usePolling(load);

  const labelClasses = useMemo(() => {
    const v = labelClassesRaw.trim();
    if (!v) return [];
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [labelClassesRaw]);

  async function onDelete(e: React.MouseEvent, projectId: string) {
    e.preventDefault();
    if (!window.confirm("Delete this project?")) return;
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.project_id !== projectId));
    } catch {
      alert("Delete failed");
    }
  }

  async function onCreate() {
    setCreating(true);
    try {
      const created = await createProject({
        name,
        description,
        label_classes: labelClasses,
      });
      setName("");
      setDescription("");
      setLabelClassesRaw("");
      setProjects((prev) => [created, ...prev]);
    } finally {
      setCreating(false);
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
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Projects</h1>
                <p className="mt-2 text-zinc-400">Manage projects and bulk uploads</p>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button>+ Create project</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm text-zinc-300">Name</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wheat Study" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-zinc-300">Description</label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short description"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm text-zinc-300">Label classes (optional, comma separated)</label>
                      <Input
                        value={labelClassesRaw}
                        onChange={(e) => setLabelClassesRaw(e.target.value)}
                        placeholder="class1, class2"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="secondary" type="button" onClick={() => { setName(""); setDescription(""); setLabelClassesRaw(""); }}>
                        Reset
                      </Button>
                      <Button disabled={creating || !name.trim() || !description.trim()} onClick={onCreate}>
                        {creating ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="mt-10 text-center text-zinc-500">Loading projects...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {projects.map((p) => (
                  <Link key={p.project_id} href={`/projects/${p.project_id}`}>
                    <Card className="cursor-pointer p-5 hover:bg-zinc-900/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-semibold text-white">{p.name}</h2>
                          <p className="mt-2 text-sm text-zinc-400">{p.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-xs text-zinc-500">{p.label_classes?.length ? `${p.label_classes.length} labels` : "No labels"}</p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => onDelete(e, p.project_id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-emerald-400">View dashboard →</div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

