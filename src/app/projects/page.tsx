"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, UserPlus, UserMinus, ChevronDown, ChevronUp, Upload, FolderOpen, Plus, X, Download, Loader2 } from "lucide-react";
import Link from "next/link";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import { Project } from "@/types/project";
import {
  createProject, deleteProject,
  listMyProjects, listAssignedProjects,
  assignUser, unassignUser,
  updateProjectStatus,
  bulkDownloadFromProject
} from "@/services/projects";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePolling } from "@/hooks/usePolling";
import { toast } from "sonner";
import { downloadBlob } from "@/utils/download";

interface UserEntry { username: string; role: string; }

export default function ProjectsPage() {
  const [role, setRole] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [creating, setCreating] = useState(false);

  const DEFAULT_CATEGORIES = ["Disease", "Pest", "Damage", "Disease Damage"];
  const customInputRef = useRef<HTMLInputElement>(null);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function addCustomCategory() {
    const val = customInput.trim();
    if (!val || selectedCategories.includes(val)) { setCustomInput(""); return; }
    setSelectedCategories((prev) => [...prev, val]);
    setCustomInput("");
    customInputRef.current?.focus();
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const isSuperadmin = role === "superadmin";
  const isAdmin = role === "admin" || isSuperadmin;

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
  }, []);

  async function load() {
    try {
      setLoading(true);
      const curUsername = localStorage.getItem("username") || "";
      if ((role === "admin" || isSuperadmin) && curUsername) {
        try {
          await fetch(`${API_URL}/projects/clean-orphans?username=${curUsername}`, { method: "POST" });
        } catch (e) {
          console.error("Clean orphans error:", e);
        }
      }
      const data = isSuperadmin || role === "admin" ? await listMyProjects() : await listAssignedProjects();
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (res.ok) {
        const data: UserEntry[] = await res.json();
        const me = localStorage.getItem("username");
        // Remove self and superadmins from the assignable users list
        setAllUsers(data.filter((u) => u.username !== me && u.role !== "superadmin"));
      }
    } catch { /* silent */ }
  }

  usePolling(load);
  useEffect(() => { if (role === "admin" || isSuperadmin) loadUsers(); }, [role, isSuperadmin]);

  // re-load when role resolves
  useEffect(() => {
    if (role) load();
  }, [role]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
  }

  const labelClasses = selectedCategories;

  async function onDelete(e: React.MouseEvent, p: Project) {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to delete project "${p.name}"?`)) return;
    if (!window.confirm(`WARNING: Deleting project "${p.name}" will permanently erase all associated uploaded files and database records. This cannot be undone. Confirm deletion?`)) return;
    try {
      await deleteProject(p.project_id);
      setProjects((prev) => prev.filter((proj) => proj.project_id !== p.project_id));
      toast.success("Project deleted");
    } catch { toast.error("Delete failed"); }
  }

  async function onCreate() {
    setCreating(true);
    try {
      const created = await createProject({ name, description, label_classes: labelClasses });
      setName(""); setDescription(""); setSelectedCategories([]);
      setProjects((prev) => [created, ...prev]);
      toast.success("Project created");
    } catch { toast.error("Failed to create project"); }
    finally { setCreating(false); }
  }

  async function handleAssign(projectId: string, username: string) {
    setAssigning((prev) => ({ ...prev, [`${projectId}-${username}`]: true }));
    try {
      await assignUser(projectId, username);
      setProjects((prev) =>
        prev.map((p) =>
          p.project_id === projectId
            ? { ...p, assigned_users: [...(p.assigned_users || []), username] }
            : p
        )
      );
      toast.success(`${username} assigned`);
    } catch { toast.error("Failed to assign user"); }
    finally { setAssigning((prev) => ({ ...prev, [`${projectId}-${username}`]: false })); }
  }

  async function handleUnassign(projectId: string, username: string) {
    setAssigning((prev) => ({ ...prev, [`${projectId}-${username}`]: true }));
    try {
      await unassignUser(projectId, username);
      setProjects((prev) =>
        prev.map((p) =>
          p.project_id === projectId
            ? { ...p, assigned_users: (p.assigned_users || []).filter((u) => u !== username) }
            : p
        )
      );
      toast.success(`${username} removed`);
    } catch { toast.error("Failed to remove user"); }
    finally { setAssigning((prev) => ({ ...prev, [`${projectId}-${username}`]: false })); }
  }

  async function handleStatusChange(projectId: string, status: string) {
    try {
      await updateProjectStatus(projectId, status);
      setProjects((prev) =>
        prev.map((p) => p.project_id === projectId ? { ...p, status: status as any } : p)
      );
      toast.success("Project status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleBulkDownload(projectId: string) {
    setDownloading((prev) => ({ ...prev, [projectId]: true }));
    try {
      const blob = await bulkDownloadFromProject(projectId);
      if (!blob) {
        toast.error("This project does not contain any uploaded files.");
        return;
      }
      downloadBlob(blob, `project_${projectId}.zip`);
      toast.success("Download started");
    } catch (e) {
      console.error(e);
      toast.error("Download failed");
    } finally {
      setDownloading((prev) => ({ ...prev, [projectId]: false }));
    }
  }

  function getStatusColor(status?: string) {
    switch (status) {
      case "completed": return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      case "ongoing": return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      default: return "border-zinc-700 bg-zinc-800 text-zinc-400";
    }
  }

  function formatDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />
      <div className="relative z-10 flex w-full">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-auto p-8">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Projects</h1>
                <p className="mt-1 text-zinc-400">
                  {isSuperadmin 
                    ? "Monitor projects and extract bulk training data packages." 
                    : role === "admin" 
                    ? "Create and manage projects, assign team members." 
                    : "Your assigned projects"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>

                {role === "admin" && (
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
                          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wheat Disease Study" />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm text-zinc-300">Description</label>
                          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
                        </div>

                        {/* Category selector */}
                        <div className="grid gap-2">
                          <label className="text-sm text-zinc-300">Category / Label Classes</label>
                          <div className="flex flex-wrap gap-2">
                            {DEFAULT_CATEGORIES.map((cat) => {
                              const active = selectedCategories.includes(cat);
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => toggleCategory(cat)}
                                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                    active
                                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                                  }`}
                                >
                                  {active && <span className="mr-1">✓</span>}{cat}
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom categories added */}
                          {selectedCategories.filter((c) => !DEFAULT_CATEGORIES.includes(c)).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedCategories.filter((c) => !DEFAULT_CATEGORIES.includes(c)).map((cat) => (
                                <span key={cat} className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400">
                                  {cat}
                                  <button type="button" onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== cat))}>
                                    <X size={11} className="hover:text-blue-200" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Add custom */}
                          <div className="flex gap-2 mt-1">
                            <input
                              ref={customInputRef}
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }}
                              placeholder="Add custom category..."
                              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                            />
                            <button
                              type="button"
                              onClick={addCustomCategory}
                              disabled={!customInput.trim()}
                              className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-40"
                            >
                              <Plus size={13} /> Add
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="secondary" type="button" onClick={() => { setName(""); setDescription(""); setSelectedCategories([]); setCustomInput(""); }}>
                            Reset
                          </Button>
                          <Button disabled={creating || !name.trim() || !description.trim()} onClick={onCreate}>
                            {creating ? "Creating..." : "Create"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="mt-10 text-center text-zinc-500">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="mt-16 flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                  <FolderOpen size={24} className="text-zinc-600" />
                </div>
                <p className="text-zinc-400">No projects recorded yet.</p>
              </div>
            ) : isSuperadmin ? (
              /* SUPERADMIN EXTRACTION TABLE */
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-zinc-400">
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Project Name</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Description</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Owner (Admin)</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Date Created</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.project_id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/25 transition-colors">
                        <td className="px-5 py-4 font-semibold text-white">{p.name}</td>
                        <td className="px-5 py-4 text-zinc-400 max-w-xs truncate">{p.description}</td>
                        <td className="px-5 py-4 text-zinc-300">{p.owner}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusColor(p.status)}`}>
                            {p.status || "not started"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-500">{formatDate(p.created_at)}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/projects/${p.project_id}`}
                              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                            >
                              View Dashboard
                            </Link>
                            <button
                              onClick={() => handleBulkDownload(p.project_id)}
                              disabled={downloading[p.project_id]}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-40"
                            >
                              {downloading[p.project_id] ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                              Extract Data
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {projects.map((p) => {
                  const assignedUsers = p.assigned_users || [];
                  const visibleAssignedCount = assignedUsers.filter((username) =>
                    allUsers.some((u) => u.username === username)
                  ).length;
                  const isExpanded = expanded[p.project_id] ?? false;

                  return (
                    <div key={p.project_id} className="rounded-xl border border-zinc-800 bg-zinc-900/60">

                      {/* Project row */}
                      <div className="flex items-start justify-between gap-4 p-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-white">{p.name}</h2>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(p.status)}`}>
                              {p.status || "not started"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-400">{p.description}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            {p.label_classes && p.label_classes.length > 0 && p.label_classes.map((lc) => (
                              <span key={lc} className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{lc}</span>
                            ))}
                            {role === "admin" && (
                              <span className="text-xs text-zinc-500">
                                {visibleAssignedCount} user{visibleAssignedCount !== 1 ? "s" : ""} assigned
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Admin only status dropdown */}
                          {role === "admin" && (
                            <div className="flex items-center gap-1.5 mr-2">
                              <span className="text-xs text-zinc-500">Status:</span>
                              <select
                                value={p.status || "not started"}
                                onChange={(e) => handleStatusChange(p.project_id, e.target.value)}
                                className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                              >
                                <option value="not started">Not Started</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          )}

                          {/* Non-admin / Intern: Upload button */}
                          {role !== "admin" && (
                            <Link
                              href={`/projects/${p.project_id}/bulk-upload`}
                              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <Upload size={14} />
                              Upload Data
                            </Link>
                          )}

                          {/* View dashboard */}
                          <Link
                            href={`/projects/${p.project_id}`}
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                          >
                            View Dashboard
                          </Link>

                          {/* Admin actions: Assign Users + Delete */}
                          {role === "admin" && (
                            <>
                              <button
                                onClick={() => setExpanded((prev) => ({ ...prev, [p.project_id]: !isExpanded }))}
                                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                Assign Users
                              </button>
                              <Button variant="destructive" size="sm" onClick={(e) => onDelete(e, p)}>
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Admin assignment panel */}
                      {role === "admin" && isExpanded && (
                        <div className="border-t border-zinc-800 px-5 pb-5 pt-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Team Members</p>
                          {allUsers.length === 0 ? (
                            <p className="text-sm text-zinc-500">No other users registered.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-zinc-800">
                                  <th className="pb-2 text-left text-xs font-medium text-zinc-500">Username</th>
                                  <th className="pb-2 text-left text-xs font-medium text-zinc-500">Role</th>
                                  <th className="pb-2 text-left text-xs font-medium text-zinc-500">Status</th>
                                  <th className="pb-2 text-right text-xs font-medium text-zinc-500">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {allUsers.map((u) => {
                                  const isAssigned = assignedUsers.includes(u.username);
                                  const isBusy = assigning[`${p.project_id}-${u.username}`];
                                  return (
                                    <tr key={u.username} className="border-b border-zinc-800/50 last:border-0">
                                      <td className="py-2.5 font-medium text-white">{u.username}</td>
                                      <td className="py-2.5">
                                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-400">{u.role}</span>
                                      </td>
                                      <td className="py-2.5">
                                        {isAssigned ? (
                                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            Assigned
                                          </span>
                                        ) : (
                                          <span className="text-xs text-zinc-500">Not assigned</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 text-right">
                                        {isAssigned ? (
                                          <button
                                            disabled={isBusy}
                                            onClick={() => handleUnassign(p.project_id, u.username)}
                                            className="flex items-center gap-1 ml-auto rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                          >
                                            <UserMinus size={12} />
                                            {isBusy ? "Removing..." : "Remove"}
                                          </button>
                                        ) : (
                                          <button
                                            disabled={isBusy}
                                            onClick={() => handleAssign(p.project_id, u.username)}
                                            className="flex items-center gap-1 ml-auto rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                          >
                                            <UserPlus size={12} />
                                            {isBusy ? "Assigning..." : "Assign"}
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
