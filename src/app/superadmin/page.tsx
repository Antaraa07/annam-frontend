"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, Database, Images, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";
import type { Dataset } from "@/types/dataset";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CATEGORIES = ["Healthy", "Disease", "Pest", "Disease Damage", "Pest Damage", "Damage"] as const;
const CATEGORY_COLORS: Record<(typeof CATEGORIES)[number], string> = {
  Healthy: "#34d399", Disease: "#f87171", Pest: "#f59e0b",
  "Disease Damage": "#a78bfa", "Pest Damage": "#fb923c", Damage: "#38bdf8",
};

type User = { username: string; role: string };
type DailyInternUpload = { day: string; intern: string; uploadedImages: number; datasets: number; latestUpload: string };

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
  return ({ "Disease Damage": "Disease dmg.", "Pest Damage": "Pest dmg." } as Record<string, string>)[category] ?? category;
}

export default function SuperadminPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setNotice("");
    try {
      const [datasetsResponse, usersResponse] = await Promise.all([fetch(`${API_URL}/datasets`), fetch(`${API_URL}/users`)]);
      if (!datasetsResponse.ok || !usersResponse.ok) throw new Error("Unable to load monitoring data");
      setDatasets(await datasetsResponse.json());
      setUsers(await usersResponse.json());
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
    count: datasets.filter((dataset) => dataset["lab/dept"] === category).length,
  })), [datasets]);

  const dailyInternUploads = useMemo<DailyInternUpload[]>(() => {
    const internNames = new Set(users.filter((user) => user.role === "intern").map((user) => user.username));
    const grouped = new Map<string, { dates: Date[]; names: Set<string>; files: Dataset[] }>();
    datasets.forEach((dataset) => {
      if (!internNames.has(dataset.owner)) return;
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
      const [day, intern] = key.split(":");
      return { day, intern, uploadedImages: value.files.length, datasets: value.names.size, latestUpload: new Date(Math.max(...value.dates.map((date) => date.valueOf()))).toISOString() };
    }).sort((a, b) => b.latestUpload.localeCompare(a.latestUpload)).slice(0, 30);
  }, [datasets, users]);

  const statCards = [
    { label: "Uploaded images", value: datasets.length, icon: Images, tone: "text-emerald-300 border-emerald-500/25 bg-emerald-500/10" },
    { label: "Platform users", value: users.length, icon: Users, tone: "text-violet-300 border-violet-500/25 bg-violet-500/10" },
    { label: "Intern contributors", value: users.filter((user) => user.role === "intern").length, icon: ShieldCheck, tone: "text-amber-300 border-amber-500/25 bg-amber-500/10" },
    { label: "Named datasets", value: new Set(datasets.map((dataset) => dataset.dataset_name)).size, icon: Database, tone: "text-sky-300 border-sky-500/25 bg-sky-500/10" },
  ];

  return <div className="relative flex h-screen overflow-hidden bg-zinc-950">
    <MouseTracker />
    <div className="relative z-10 flex w-full">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300"><Crown size={14} /> Privileged monitoring</div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Platform command center</h1>
              <p className="mt-1 text-sm text-zinc-400">A live view of collection volume, category coverage, and intern delivery.</p>
            </div>
            <button onClick={() => { setRefreshing(true); void load(); }} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-500/50 hover:text-white disabled:opacity-50"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
          </div>

          {notice && <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{notice}</div>}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return <div key={card.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.tone}`}><Icon size={18} /></div>
                <p className="mt-5 text-2xl font-bold text-white">{loading ? "—" : card.value.toLocaleString("en-IN")}</p>
                <p className="mt-1 text-xs font-medium text-zinc-500">{card.label}</p>
              </div>;
            })}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 xl:col-span-3">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-white">Category distribution</h2><p className="mt-1 text-xs text-zinc-500">Every uploaded image, grouped by field category.</p></div><span className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-300">{datasets.length} total</span></div>
              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categories} margin={{ top: 8, right: 4, left: -18, bottom: 12 }}>
                    <XAxis dataKey="category" tickFormatter={formatCategoryLabel} tick={{ fill: "#a1a1aa", fontSize: 10 }} angle={-28} textAnchor="end" height={62} axisLine={false} tickLine={false} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "10px", color: "#f4f4f5" }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>{categories.map((entry) => <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 xl:col-span-2">
              <h2 className="font-semibold text-white">Collection coverage</h2><p className="mt-1 text-xs text-zinc-500">Category totals at a glance.</p>
              <div className="mt-5 space-y-3">{categories.map((item) => <div key={item.category} className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] }} /><span className="min-w-0 flex-1 text-sm text-zinc-300">{item.category}</span><span className="text-sm font-semibold text-white">{loading ? "—" : item.count}</span></div>)}</div>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4"><div><h2 className="font-semibold text-white">Daily intern uploads</h2><p className="mt-1 text-xs text-zinc-500">One row per intern per day, based on timestamped image records.</p></div><span className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">Last 30 records</span></div>
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b border-zinc-800 bg-zinc-900"><tr>{["Day", "Intern", "Uploaded images", "Datasets", "Latest upload"].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{heading}</th>)}</tr></thead><tbody>
              {loading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-500">Loading platform activity…</td></tr> : dailyInternUploads.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-500">No timestamped intern uploads yet.</td></tr> : dailyInternUploads.map((record) => <tr key={`${record.day}-${record.intern}`} className="border-b border-zinc-800/70 last:border-0 hover:bg-zinc-800/30"><td className="px-5 py-3.5 text-zinc-300">{formatDay(record.day)}</td><td className="px-5 py-3.5 font-medium text-white">{record.intern}</td><td className="px-5 py-3.5 text-emerald-300">{record.uploadedImages}</td><td className="px-5 py-3.5 text-zinc-300">{record.datasets}</td><td className="px-5 py-3.5 text-zinc-400">{formatTime(record.latestUpload)}</td></tr>)}
            </tbody></table></div>
          </section>
        </div>
      </main>
    </div>
  </div>;
}
