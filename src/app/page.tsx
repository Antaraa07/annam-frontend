"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { 
  Activity, 
  CheckCircle2, 
  Database, 
  HardDrive, 
  Images, 
  Users, 
  Crown, 
  ShieldCheck, 
  RefreshCw,
  Clock3
} from "lucide-react";
import { 
  Bar, 
  BarChart, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  PieChart, 
  Pie 
} from "recharts";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";
import RecentUploads from "@/components/dashboard/recent-uploads";
import StorageUsage from "@/components/dashboard/storage-usage";
import StatsCard from "@/components/dashboard/stats-card";

import { getSummary } from "@/services/api";
import { getDatasets } from "@/services/datasets";
import { getRecentActivity } from "@/services/activity";
import { getRecentUploads, getStorageUsage } from "@/services/dashboard-v2";
import type { DashboardSummary } from "@/types/dashboard";
import type { Dataset } from "@/types/dataset";
import type { RecentUpload, StorageUsageResponse } from "@/types/dashboard-v2";
import type { Project } from "@/types/project";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CATEGORY_COLORS: Record<string, string> = {
  Healthy: "#34d399",
  Disease: "#f87171",
  Pest: "#f59e0b",
  "Disease Damage": "#a78bfa",
  "Pest Damage": "#fb923c",
  Damage: "#38bdf8",
  Unclassified: "#71717a",
};

type UserEntry = { username: string; role: string };

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "—"
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatCategoryLabel(category: string) {
  return ({ "Disease Damage": "Disease dmg.", "Pest Damage": "Pest dmg." } as Record<string, string>)[category] ?? category;
}

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#f97316", "#0ea5e9"];

function getLabelFromFilename(filename?: string): string {
  if (!filename) return "Unlabelled";
  const firstWord = filename.split(/[_\-\s.]/)[0];
  if (firstWord && !/^\d+$/.test(firstWord)) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  }
  return "Unlabelled";
}

/* Beautiful Dual Donut Charts for Raw vs Annotated Collection Mix */
function CollectionMix({ datasets, loading }: { datasets: Dataset[]; loading: boolean }) {
  const rawChartData = useMemo(() => {
    const rawData = datasets.filter((item) => !item.project_id);
    const counts = rawData.reduce<Record<string, number>>((all, item) => {
      const key = item["lab/dept"] || "Unclassified";
      if (key === "CS" || key === "General") return all;
      all[key] = (all[key] || 0) + 1;
      return all;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [datasets]);

  const rawTotal = rawChartData.reduce((sum, item) => sum + item.value, 0);

  const annotatedChartData = useMemo(() => {
    const annData = datasets.filter((item) => item.project_id);
    const counts = annData.reduce<Record<string, number>>((all, item) => {
      const key = getLabelFromFilename(item.filename);
      if (key === "CS" || key === "General" || key === "Unlabelled") return all;
      all[key] = (all[key] || 0) + 1;
      return all;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [datasets]);

  const annTotal = annotatedChartData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 h-[340px] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
        <div>
          <h2 className="font-semibold text-white">Collection Mix</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Distribution across raw categories and annotated classes.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Raw Mix Donut */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-zinc-800/40 pb-5">
          <div className="relative h-[120px] w-[120px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rawChartData}
                  innerRadius={38}
                  outerRadius={54}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {rawChartData.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#a1a1aa"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-extrabold text-white">{rawTotal}</span>
              <span className="text-[7px] uppercase tracking-wider font-semibold text-zinc-500">Raw</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 w-full">
            {rawChartData.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-6">No raw images uploaded yet.</p>
            ) : (
              rawChartData.slice(0, 3).map((item) => {
                const percentage = rawTotal > 0 ? Math.round((item.value / rawTotal) * 100) : 0;
                const color = CATEGORY_COLORS[item.name] || "#a1a1aa";
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs bg-zinc-950/40 border border-zinc-800/40 rounded-lg px-2.5 py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-zinc-300 font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-zinc-500 font-mono">{item.value}</span>
                      <span className="text-white font-semibold">{percentage}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Annotated Mix Donut */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="relative h-[120px] w-[120px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={annotatedChartData}
                  innerRadius={38}
                  outerRadius={54}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {annotatedChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-extrabold text-white">{annTotal}</span>
              <span className="text-[7px] uppercase tracking-wider font-semibold text-zinc-500">Annotated</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5 w-full">
            {annotatedChartData.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-6">No annotated images uploaded yet.</p>
            ) : (
              annotatedChartData.slice(0, 3).map((item, index) => {
                const percentage = annTotal > 0 ? Math.round((item.value / annTotal) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs bg-zinc-950/40 border border-zinc-800/40 rounded-lg px-2.5 py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-zinc-300 font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-zinc-500 font-mono">{item.value}</span>
                      <span className="text-white font-semibold">{percentage}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonalActivity({ data, loading }: { data: Dataset[]; loading: boolean }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-emerald-400" />
        <div>
          <h2 className="font-semibold text-white">Recent activity</h2>
          <p className="mt-1 text-xs text-zinc-500">Your latest collection work.</p>
        </div>
      </div>
      {loading ? (
        <div className="mt-5 space-y-3">
          {[1, 2, 3].map((key) => <div key={key} className="h-12 animate-pulse rounded-xl bg-zinc-800" />)}
        </div>
      ) : data.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No recent activity yet.</p>
      ) : (
        <div className="mt-5 space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div key={`${item.dataset_name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{item.dataset_name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{item["lab/dept"] || "Collection record"}</p>
              </div>
              <span className="shrink-0 text-xs text-emerald-300">{item.version || "v1.0"}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [activity, setActivity] = useState<Dataset[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsageResponse | null>(null);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const curRole = localStorage.getItem("role") || "";
    const curUsername = localStorage.getItem("username") || "";
    setRole(curRole);
    setUsername(curUsername);

    const isAdmin = curRole === "admin" || curRole === "superadmin";

    if (isAdmin && curUsername) {
      try {
        await fetch(`${API_URL}/projects/clean-orphans?username=${curUsername}`, { method: "POST" });
      } catch (e) {
        console.error("Failed to run clean-orphans on mount:", e);
      }
    }

    try {
      const tasks = await Promise.all([
        getSummary(),
        getDatasets(),
        getRecentActivity(),
        getRecentUploads(5),
        getStorageUsage(),
        isAdmin ? fetch(`${API_URL}/users`).then((res) => (res.ok ? res.json() : [])) : Promise.resolve([]),
        isAdmin ? fetch(`${API_URL}/projects?username=${curUsername}`).then((res) => (res.ok ? res.json() : [])) : Promise.resolve([]),
      ]);

      setSummary(tasks[0]);
      setDatasets(tasks[1]);
      setActivity(tasks[2]);
      setRecentUploads(tasks[3]);
      setStorageUsage(tasks[4]);
      if (isAdmin) {
        setUsers(tasks[5]);
        setProjects(tasks[6]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  const isSuperadmin = role === "superadmin";
  const isAdmin = role === "admin";
  const isInternOrOther = !isSuperadmin && !isAdmin;

  // Intern counts
  const uniqueDatasets = new Set(datasets.map((item) => item.dataset_name)).size;
  const completeRecords = datasets.filter((item) => item.filename && item.dataset_name && item["lab/dept"] && item.version).length;

  // Admin Project Interns
  const adminProjects = useMemo(() => {
    return projects.filter(p => p.owner === username);
  }, [projects, username]);

  const assignedInterns = useMemo(() => {
    const interns = new Set<string>();
    adminProjects.forEach(p => {
      p.assigned_users?.forEach(u => interns.add(u));
    });
    return interns;
  }, [adminProjects]);

  // Admin Daily Intern Uploads Table
  const dailyInternUploads = useMemo(() => {
    const grouped = new Map<string, { dates: Date[]; names: Set<string>; files: Dataset[] }>();
    datasets.forEach((dataset) => {
      if (!assignedInterns.has(dataset.owner)) return;
      const date = dataset.timestamp ? new Date(dataset.timestamp) : null;
      if (!date || Number.isNaN(date.valueOf())) return;
      const day = date.toISOString().slice(0, 10);
      const key = `${day}:${dataset.owner}`;
      const current = grouped.get(key) ?? { dates: [], names: new Set(), files: [] };
      current.dates.push(date);
      current.names.add(dataset.dataset_name);
      current.files.push(dataset);
      grouped.set(key, current);
    });
    return [...grouped.entries()].map(([key, value]) => {
      const [day, intern] = key.split(":");
      return { 
        day, 
        intern, 
        uploadedImages: value.files.length, 
        datasets: value.names.size, 
        latestUpload: new Date(Math.max(...value.dates.map((date) => date.valueOf()))).toISOString() 
      };
    }).sort((a, b) => b.latestUpload.localeCompare(a.latestUpload)).slice(0, 30);
  }, [datasets, assignedInterns]);

  // Superadmin Daily Admin Uploads Table
  const dailyAdminUploads = useMemo(() => {
    const admins = users.filter(u => u.role === "admin").map(u => u.username);
    const adminToInterns = new Map<string, Set<string>>();
    admins.forEach(admin => {
      const interns = new Set<string>();
      projects.filter(p => p.owner === admin).forEach(p => {
        p.assigned_users?.forEach(u => interns.add(u));
      });
      adminToInterns.set(admin, interns);
    });

    const grouped = new Map<string, {
      adminOwnUploads: number;
      internUploads: number;
      activeInterns: Set<string>;
      dates: Date[];
    }>();

    datasets.forEach(dataset => {
      const date = dataset.timestamp ? new Date(dataset.timestamp) : null;
      if (!date || Number.isNaN(date.valueOf())) return;
      const day = date.toISOString().slice(0, 10);
      
      admins.forEach(admin => {
        const key = `${day}:${admin}`;
        const current = grouped.get(key) ?? { adminOwnUploads: 0, internUploads: 0, activeInterns: new Set(), dates: [] };
        
        if (dataset.owner === admin) {
          current.adminOwnUploads += 1;
          current.dates.push(date);
          grouped.set(key, current);
        } else {
          const internsUnderAdmin = adminToInterns.get(admin);
          if (internsUnderAdmin?.has(dataset.owner)) {
            current.internUploads += 1;
            current.activeInterns.add(dataset.owner);
            current.dates.push(date);
            grouped.set(key, current);
          }
        }
      });
    });

    return [...grouped.entries()].map(([key, value]) => {
      const [day, admin] = key.split(":");
      return {
        day,
        admin,
        adminOwnUploads: value.adminOwnUploads,
        internUploads: value.internUploads,
        activeInterns: Array.from(value.activeInterns),
        latestUpload: value.dates.length > 0 ? new Date(Math.max(...value.dates.map(d => d.valueOf()))).toISOString() : new Date(day).toISOString()
      };
    })
    .filter(row => row.adminOwnUploads > 0 || row.internUploads > 0)
    .sort((a, b) => b.latestUpload.localeCompare(a.latestUpload))
    .slice(0, 30);
  }, [datasets, users, projects]);

  // Recharts Categories for Superadmin
  const categories = useMemo(() => {
    const list = ["Healthy", "Disease", "Pest", "Disease Damage", "Pest Damage", "Damage"] as const;
    return list.map((category) => ({
      category,
      count: datasets.filter((dataset) => dataset["lab/dept"] === category).length,
    }));
  }, [datasets]);

  // ---------------- Render Views ----------------

  if (loading) {
    return (
      <div className="relative flex h-screen overflow-hidden bg-zinc-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />
      <div className="relative z-10 flex w-full">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-auto p-6 lg:p-8">
            
            {/* Header */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  {isSuperadmin && <><Crown size={14} className="text-violet-300" /> <span className="text-violet-300">Privileged monitoring</span></>}
                  {isAdmin && <><ShieldCheck size={14} /> Admin Overview</>}
                  {isInternOrOther && <><Activity size={14} /> My Overview</>}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {isSuperadmin ? "Platform command center" : isAdmin ? "Overview" : "My overview"}
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  {isSuperadmin 
                    ? "A live integrated view of collection volume, category coverage, and admin delivery." 
                    : isAdmin 
                    ? "Live collection volume and platform coverage." 
                    : "A focused view of your field-data collection work."}
                </p>
              </div>
              <button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-emerald-500/50 hover:text-white disabled:opacity-50"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {/* SUPERADMIN DASHBOARD (Platform Command Center Integrated) */}
            {isSuperadmin && (
              <div className="space-y-6">
                {/* Stats cards */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-emerald-300 border-emerald-500/25 bg-emerald-500/10"><Images size={18} /></div>
                    <p className="mt-5 text-2xl font-bold text-white">{datasets.length.toLocaleString("en-IN")}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Uploaded images</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-violet-300 border-violet-500/25 bg-violet-500/10"><Users size={18} /></div>
                    <p className="mt-5 text-2xl font-bold text-white">{users.length.toLocaleString("en-IN")}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Platform users</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-amber-300 border-amber-500/25 bg-amber-500/10"><ShieldCheck size={18} /></div>
                    <p className="mt-5 text-2xl font-bold text-white">{users.filter((user) => user.role === "intern").length.toLocaleString("en-IN")}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Intern contributors</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-sky-300 border-sky-500/25 bg-sky-500/10"><Database size={18} /></div>
                    <p className="mt-5 text-2xl font-bold text-white">{new Set(datasets.map((dataset) => dataset.dataset_name)).size.toLocaleString("en-IN")}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Named datasets</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-pink-300 border-pink-500/25 bg-pink-500/10"><HardDrive size={18} /></div>
                    <p className="mt-5 text-2xl font-bold text-white">{summary?.storage || "—"}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Storage size</p>
                  </div>
                </section>

                {/* Charts */}
                <section className="grid gap-6 xl:grid-cols-5">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 xl:col-span-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-semibold text-white">Category distribution</h2>
                        <p className="mt-1 text-xs text-zinc-500">Every uploaded image, grouped by field category.</p>
                      </div>
                      <span className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-300">{datasets.length} total</span>
                    </div>
                    <div className="mt-5 h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categories} margin={{ top: 8, right: 4, left: -18, bottom: 12 }}>
                          <XAxis dataKey="category" tickFormatter={formatCategoryLabel} tick={{ fill: "#a1a1aa", fontSize: 10 }} angle={-28} textAnchor="end" height={62} axisLine={false} tickLine={false} interval={0} />
                          <YAxis allowDecimals={false} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "10px", color: "#f4f4f5" }} />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {categories.map((entry) => <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#a1a1aa"} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 xl:col-span-2 flex flex-col justify-between">
                    <div>
                      <h2 className="font-semibold text-white">Collection coverage</h2>
                      <p className="mt-1 text-xs text-zinc-500">Category totals at a glance.</p>
                      <div className="mt-5 space-y-3">
                        {categories.map((item) => (
                          <div key={item.category} className="flex items-center gap-3">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] || "#a1a1aa" }} />
                            <span className="min-w-0 flex-1 text-sm text-zinc-300">{item.category}</span>
                            <span className="text-sm font-semibold text-white">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Storage usage */}
                <section>
                  <StorageUsage data={storageUsage} isLoading={loading} />
                </section>

                {/* Daily Admin Uploads Table */}
                <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
                  <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
                    <div>
                      <h2 className="font-semibold text-white">Daily Admin Uploads</h2>
                      <p className="mt-1 text-xs text-zinc-500">Cumulative record of uploads done by admins and their assigned interns.</p>
                    </div>
                    <span className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-300">Last 30 records</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-zinc-800 bg-zinc-900">
                        <tr>
                          {["Day", "Admin", "Admin Uploads", "Intern Uploads", "Active Interns"].map((heading) => (
                            <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dailyAdminUploads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">No admin uploads recorded yet.</td>
                          </tr>
                        ) : (
                          dailyAdminUploads.map((record) => (
                            <tr key={`${record.day}-${record.admin}`} className="border-b border-zinc-800/70 last:border-0 hover:bg-zinc-800/30">
                              <td className="px-5 py-3.5 text-zinc-300">{formatDay(record.day)}</td>
                              <td className="px-5 py-3.5 font-medium text-white">{record.admin}</td>
                              <td className="px-5 py-3.5 text-emerald-300 font-mono">{record.adminOwnUploads}</td>
                              <td className="px-5 py-3.5 text-violet-300 font-mono">{record.internUploads}</td>
                              <td className="px-5 py-3.5 text-zinc-400">
                                {record.activeInterns.length === 0 ? "—" : record.activeInterns.join(", ")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* ADMIN DASHBOARD */}
            {isAdmin && (
              <div className="space-y-6">
                {/* Stats cards */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-emerald-300 border-emerald-500/25 bg-emerald-500/10"><Database size={18} /></div>
                    <p className="mt-5 text-2xl font-bold text-white">{summary?.datasets || "—"}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Datasets</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-violet-300 border-violet-500/25 bg-violet-500/10"><Users size={18} /></div>
                    <p className="mt-5 text-2xl font-bold text-white">{users.length.toLocaleString("en-IN")}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Users</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-sky-300 border-sky-500/25 bg-sky-500/10"><HardDrive size={18} /></div>
                    <p className="mt-5 text-2xl font-bold text-white">{summary?.storage || "—"}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Storage</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-pink-300 border-pink-500/25 bg-pink-500/10"><Images size={18} /></div>
                    <p className="mt-5 text-2xl font-bold text-white">{datasets.length.toLocaleString("en-IN")}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Uploaded images</p>
                  </div>
                </section>

                {/* Recent Uploads & Collection Mix Donut */}
                <section className="grid gap-6 xl:grid-cols-12">
                  <div className="xl:col-span-7">
                    <RecentUploads data={recentUploads} isLoading={loading} />
                  </div>
                  <div className="xl:col-span-5">
                    <CollectionMix datasets={datasets} loading={loading} />
                  </div>
                </section>

                {/* Storage usage */}
                <section>
                  <StorageUsage data={storageUsage} isLoading={loading} />
                </section>

                {/* Daily Intern Uploads Table */}
                <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
                  <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
                    <div>
                      <h2 className="font-semibold text-white">Daily Intern Uploads</h2>
                      <p className="mt-1 text-xs text-zinc-500">Daily uploads of interns assigned under your projects.</p>
                    </div>
                    <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">Last 30 records</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-zinc-800 bg-zinc-900">
                        <tr>
                          {["Day", "Intern", "Uploaded Images", "Datasets", "Latest Upload"].map((heading) => (
                            <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dailyInternUploads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">No uploads recorded from your interns yet.</td>
                          </tr>
                        ) : (
                          dailyInternUploads.map((record) => (
                            <tr key={`${record.day}-${record.intern}`} className="border-b border-zinc-800/70 last:border-0 hover:bg-zinc-800/30">
                              <td className="px-5 py-3.5 text-zinc-300">{formatDay(record.day)}</td>
                              <td className="px-5 py-3.5 font-medium text-white">{record.intern}</td>
                              <td className="px-5 py-3.5 text-emerald-300 font-mono">{record.uploadedImages}</td>
                              <td className="px-5 py-3.5 text-zinc-300">{record.datasets}</td>
                              <td className="px-5 py-3.5 text-zinc-400">{formatTime(record.latestUpload)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* INTERN / STUDENT / RESEARCHER DASHBOARD */}
            {isInternOrOther && (
              <div className="space-y-6">
                {/* Stats cards */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <p className="text-xs font-medium text-zinc-500">My images</p>
                    <p className="mt-2 text-3xl font-extrabold text-white">{datasets.length}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <p className="text-xs font-medium text-zinc-500">My datasets</p>
                    <p className="mt-2 text-3xl font-extrabold text-white">{uniqueDatasets}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <p className="text-xs font-medium text-zinc-500">Complete records</p>
                    <p className="mt-2 text-3xl font-extrabold text-white">{completeRecords}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                    <p className="text-xs font-medium text-zinc-500">Collection health</p>
                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {datasets.length ? Math.round((completeRecords / datasets.length) * 100) : 0}%
                    </p>
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                  <PersonalActivity data={activity} loading={loading} />
                  <CollectionMix datasets={datasets} loading={loading} />

                  <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 xl:col-span-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <div>
                        <h2 className="font-semibold text-white">Data health</h2>
                        <p className="mt-1 text-xs text-zinc-500 font-medium">Records with an image, dataset name, category, and version.</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-end gap-4">
                      <p className="text-3xl font-bold text-white">{completeRecords}/{datasets.length}</p>
                      <p className="pb-1 text-sm text-zinc-500">complete records</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-zinc-800">
                      <div 
                        className="h-2 rounded-full bg-emerald-400" 
                        style={{ width: `${datasets.length ? (completeRecords / datasets.length) * 100 : 0}%` }} 
                      />
                    </div>
                  </section>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
