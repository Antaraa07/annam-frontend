"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, Database, Images, RefreshCw, ShieldCheck, Users, Filter, HardDrive, ArrowUpRight } from "lucide-react";
import { ComposedChart, Bar, Line, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import AppShell from "@/components/layout/app-shell";
import RecentUploads from "@/components/dashboard/recent-uploads";
import DownloadActivityLogbook from "@/components/dashboard/download-activity-logbook";
import type { Dataset } from "@/types/dataset";
import type { RecentUpload } from "@/types/dashboard-v2";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CATEGORIES = ["Normal", "Disease", "Pest", "Deficiency", "Pest Damage", "Damage"] as const;
const CATEGORY_COLORS: Record<(typeof CATEGORIES)[number], string> = {
  Normal: "#34d399", Disease: "#f87171", Pest: "#f59e0b",
  Deficiency: "#a78bfa", "Pest Damage": "#fb923c", Damage: "#38bdf8",
};

type User = { username: string; role: string };
type UploadActivityRecord = { day: string; owner: string; role: string; uploadedImages: number; datasets: number; latestUpload: string };

function dateFor(dataset: Dataset) {
  const date = dataset.timestamp ? new Date(dataset.timestamp) : null;
  return date && !Number.isNaN(date.valueOf()) ? date : null;
}

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
  return ({ Deficiency: "Deficiency", "Pest Damage": "Pest dmg." } as Record<string, string>)[category] ?? category;
}

const ROLE_STYLES: Record<string, string> = {
  superadmin: "text-violet-300 border-violet-500/30 bg-violet-500/10",
  admin: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  researcher: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
  intern: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  student: "text-blue-300 border-blue-500/30 bg-blue-500/10",
};

export default function SuperadminPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setNotice("");
    try {
      const [datasetsResponse, usersResponse, recentUploadsResponse] = await Promise.all([
        fetch(`${API_URL}/datasets`),
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/analytics/recent-uploads?limit=5`),
      ]);
      if (!datasetsResponse.ok || !usersResponse.ok) throw new Error("Unable to load monitoring data");
      setDatasets(await datasetsResponse.json());
      setUsers(await usersResponse.json());
      if (recentUploadsResponse.ok) setRecentUploads(await recentUploadsResponse.json());
    } catch {
      setNotice("Live platform data is temporarily unavailable. Refresh to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const categories = useMemo(() => CATEGORIES.map((category) => ({
    category,
    count: datasets.filter((dataset) => {
      const cat = dataset.department || dataset["lab/dept"] || "";
      return cat.trim().toLowerCase() === category.trim().toLowerCase();
    }).length,
  })), [datasets]);

  const uploadActivityBreakdown = useMemo<UploadActivityRecord[]>(() => {
    const roleUsers = selectedRoleFilter === "all"
      ? new Set(users.map((u) => u.username))
      : new Set(users.filter((u) => u.role === selectedRoleFilter).map((u) => u.username));

    const userRoleMap = new Map(users.map((u) => [u.username, u.role]));
    const grouped = new Map<string, { dates: Date[]; names: Set<string>; files: Dataset[] }>();

    datasets.forEach((dataset) => {
      if (!roleUsers.has(dataset.owner)) return;
      const date = dateFor(dataset);
      if (!date) return;
      const day = date.toISOString().slice(0, 10);
      const key = `${day}:${dataset.owner}`;
      const current = grouped.get(key) ?? { dates: [], names: new Set(), files: [] };
      current.dates.push(date);
      current.names.add(dataset.dataset_name);
      current.files.push(dataset);
      grouped.set(key, current);
    });

    return [...grouped.entries()].map(([key, value]) => {
      const [day, owner] = key.split(":");
      const role = userRoleMap.get(owner) || "user";
      return {
        day,
        owner,
        role,
        uploadedImages: value.files.length,
        datasets: value.names.size,
        latestUpload: new Date(Math.max(...value.dates.map((d) => d.valueOf()))).toISOString(),
      };
    }).sort((a, b) => b.latestUpload.localeCompare(a.latestUpload)).slice(0, 50);
  }, [datasets, users, selectedRoleFilter]);

  const totalDatasetsCount = useMemo(() => new Set(datasets.map((d) => d.dataset_name)).size, [datasets]);
  const avgImagesPerDataset = useMemo(() => {
    if (totalDatasetsCount === 0) return "0";
    return (datasets.length / totalDatasetsCount).toFixed(1);
  }, [datasets, totalDatasetsCount]);

  const statCards = [
    { label: "Uploaded images", value: loading ? "—" : datasets.length.toLocaleString("en-IN"), icon: Images, tone: "text-emerald-300 border-emerald-500/25 bg-emerald-500/10" },
    { label: "Platform users", value: loading ? "—" : users.length.toLocaleString("en-IN"), icon: Users, tone: "text-violet-300 border-violet-500/25 bg-violet-500/10" },
    { label: "Collection Avg", value: loading ? "—" : `${avgImagesPerDataset} img / dataset`, icon: Database, tone: "text-amber-300 border-amber-500/25 bg-amber-500/10" },
    { label: "Named datasets", value: loading ? "—" : totalDatasetsCount.toLocaleString("en-IN"), icon: ShieldCheck, tone: "text-sky-300 border-sky-500/25 bg-sky-500/10" },
  ];

  return <AppShell>
    <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300"><Crown size={14} /> Privileged monitoring</div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Platform command center</h1>
              <p className="mt-1 text-sm text-zinc-400">A live view of collection volume, category coverage, and activity logs.</p>
            </div>
            <button onClick={() => { setRefreshing(true); void load(); }} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-500/50 hover:text-white disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
          </div>

          {notice && <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{notice}</div>}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return <div key={card.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.tone}`}><Icon size={18} /></div>
                <p className="mt-5 text-2xl font-bold text-white">{card.value}</p>
                <p className="mt-1 text-xs font-medium text-zinc-400">{card.label}</p>
              </div>;
            })}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 xl:col-span-3">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-white">Category distribution</h2><p className="mt-1 text-xs text-zinc-400">Every uploaded image, grouped by field category.</p></div><span className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-300">{datasets.length} total</span></div>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={categories} margin={{ top: 15, right: 10, left: -18, bottom: 12 }}>
                    <defs>
                      <linearGradient id="superadminGoldGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fba953"/>
                        <stop offset="50%" stopColor="#f59e0b"/>
                        <stop offset="100%" stopColor="#fbbf24"/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="category" tickFormatter={formatCategoryLabel} tick={{ fill: "#a1a1aa", fontSize: 10 }} angle={-28} textAnchor="end" height={62} axisLine={false} tickLine={false} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ background: "rgba(15, 15, 18, 0.92)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", color: "#f4f4f5" }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={32}>{categories.map((entry) => <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} opacity={0.4} />)}</Bar>
                    <Line type="monotone" dataKey="count" stroke="url(#superadminGoldGrad)" strokeWidth={3} dot={{ r: 5, fill: "#fba953", stroke: "#0f0f11", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#fba953", stroke: "#ffffff", strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 xl:col-span-2">
              <h2 className="font-semibold text-white">Collection coverage</h2><p className="mt-1 text-xs text-zinc-400">Category totals at a glance.</p>
              <div className="mt-5 space-y-3">{categories.map((item) => <div key={item.category} className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] }} /><span className="min-w-0 flex-1 text-sm text-zinc-300">{item.category}</span><span className="text-sm font-semibold text-white">{loading ? "—" : item.count}</span></div>)}</div>
            </div>
          </section>

          {/* Recent Upload Folders & Download Activity Logbook */}
          <section className="mt-6 grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <RecentUploads data={recentUploads} isLoading={loading} />
            </div>
            <div className="xl:col-span-6">
              <DownloadActivityLogbook />
            </div>
          </section>

          {/* Upload Activity Breakdown Table with Role Dropdown */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
            <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-white">Upload Activity Breakdown</h2>
                <p className="mt-0.5 text-xs text-zinc-400">Daily breakdown of contributor uploads across platform roles.</p>
              </div>

              {/* Role Dropdown Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                  <Filter size={12} className="text-violet-400" /> Filter Role:
                </label>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="all">All Roles</option>
                  <option value="intern">Intern</option>
                  <option value="researcher">Researcher</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900">
                  <tr>
                    {["Day", "Contributor", "Role", "Uploaded images", "Datasets", "Latest upload"].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-500">Loading upload breakdown…</td></tr>
                  ) : uploadActivityBreakdown.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-500">No timestamped upload activity found for this role selection.</td></tr>
                  ) : (
                    uploadActivityBreakdown.map((record) => {
                      const roleStyle = ROLE_STYLES[record.role.toLowerCase()] ?? "text-zinc-300 border-zinc-700 bg-zinc-800";
                      return (
                        <tr key={`${record.day}-${record.owner}`} className="border-b border-zinc-800/70 last:border-0 hover:bg-zinc-800/30">
                          <td className="px-5 py-3.5 text-zinc-300 font-mono text-xs">{formatDay(record.day)}</td>
                          <td className="px-5 py-3.5 font-medium text-white">{record.owner}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-medium capitalize ${roleStyle}`}>
                              {record.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-emerald-300 font-bold">{record.uploadedImages}</td>
                          <td className="px-5 py-3.5 text-zinc-300">{record.datasets}</td>
                          <td className="px-5 py-3.5 text-zinc-400 text-xs">{formatTime(record.latestUpload)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
    </div>
  </AppShell>;
}
