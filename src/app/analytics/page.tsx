"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Database, FileText, Download, BarChart3, Users, Crown, ShieldCheck, HardDrive, Images, Activity } from "lucide-react";
import { 
  Bar, 
  BarChart, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from "recharts";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import SummaryCard from "@/components/analytics/summary-card";
import RecentActivity from "@/components/analytics/recent-activity";

import { getSummary, getOwners } from "@/services/analytics";
import { getRecentActivity } from "@/services/activity";
import { getDatasets } from "@/services/datasets";
import { usePolling } from "@/hooks/usePolling";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { downloadBlob } from "@/utils/download";
import type { Dataset } from "@/types/dataset";
import type { Project } from "@/types/project";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#f97316", "#0ea5e9", "#14b8a6"];

const CATEGORY_COLORS: Record<string, string> = {
  Healthy: "#10b981",
  Disease: "#f43f5e",
  Pest: "#eab308",
  "Disease Damage": "#a855f7",
  "Pest Damage": "#f97316",
  Damage: "#0ea5e9",
  Unclassified: "#71717a",
};

interface Summary {
  datasets: number;
  owners: number;
  storage: string;
}

type UserEntry = { username: string; role: string };

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

export default function AnalyticsPage() {
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [owners, setOwners] = useState<{ owner: string; dataset_count: number }[]>([]);
  const [activity, setActivity] = useState<{ dataset_name: string; owner: string; version: string }[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
    setUsername(localStorage.getItem("username") || "");
  }, []);

  async function loadAnalytics() {
    try {
      const curRole = localStorage.getItem("role") || "";
      const curUsername = localStorage.getItem("username") || "";
      const isAdmin = curRole === "admin" || curRole === "superadmin";

      const [summaryData, ownerData, activityData, allDatasets, usersRes, projectsRes] = await Promise.all([
        getSummary(isAdmin ? undefined : curUsername),
        isAdmin ? getOwners() : Promise.resolve([]),
        getRecentActivity(),
        getDatasets(),
        isAdmin ? fetch(`${API_URL}/users`).then((res) => (res.ok ? res.json() : [])) : Promise.resolve([]),
        isAdmin ? fetch(`${API_URL}/projects?username=${curUsername}`).then((res) => (res.ok ? res.json() : [])) : Promise.resolve([]),
      ]);

      setSummary(summaryData);
      setOwners(ownerData);
      setActivity(activityData);
      setDatasets(allDatasets);
      setUsers(usersRes);
      setProjects(projectsRes);
    } catch (err) {
      console.error("Analytics Error:", err);
    } finally {
      setLoading(false);
    }
  }

  usePolling(loadAnalytics);

  const isSuperadmin = role === "superadmin";
  const isAdmin = role === "admin";
  const isInternOrOther = !isSuperadmin && !isAdmin;

  // Intern Report computations
  const reportSummary = useMemo(() => {
    if (isInternOrOther) {
      const myUploads = datasets.filter((d) => d.owner === username);
      const monthlyGroups: Record<string, Dataset[]> = {};
      
      myUploads.forEach((d) => {
        if (!d.timestamp) return;
        const monthStr = d.timestamp.slice(0, 7); // "YYYY-MM"
        if (!monthlyGroups[monthStr]) monthlyGroups[monthStr] = [];
        monthlyGroups[monthStr].push(d);
      });

      const sortedMonths = Object.keys(monthlyGroups).sort((a, b) => b.localeCompare(a));
      return {
        totalUploads: myUploads.length,
        monthsCount: sortedMonths.length,
        months: sortedMonths.map((m) => {
          const data = monthlyGroups[m];
          const date = new Date(`${m}-02T00:00:00`);
          const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date);
          const uniqueSets = new Set(data.map((d) => d.dataset_name)).size;
          const categories = Array.from(new Set(data.map((d) => d["lab/dept"] || "General")));
          return {
            monthKey: m,
            label: monthLabel,
            imagesCount: data.length,
            datasetsCount: uniqueSets,
            categories: categories,
          };
        }),
      };
    }
    return null;
  }, [datasets, username, isInternOrOther]);

  // Personal Monthly progress for Interns
  const personalProgress = useMemo(() => {
    const myUploads = datasets.filter((d) => d.owner === username);
    const groups: Record<string, number> = {};
    myUploads.forEach((d) => {
      if (!d.timestamp) return;
      const monthStr = d.timestamp.slice(0, 7); // YYYY-MM
      groups[monthStr] = (groups[monthStr] || 0) + 1;
    });
    return Object.entries(groups)
      .map(([month, count]) => {
        const date = new Date(`${month}-02T00:00:00`);
        const label = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(date);
        return { month: label, count, raw: month };
      })
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [datasets, username]);

  // Category split for Interns
  const personalCategoryMix = useMemo(() => {
    const myUploads = datasets.filter((d) => d.owner === username);
    const groups: Record<string, number> = {};
    myUploads.forEach((d) => {
      const key = d["lab/dept"] || "Unclassified";
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [datasets, username]);

  // Superadmin analytics computations
  const superadminAnalytics = useMemo(() => {
    if (!isSuperadmin) return null;

    const adminsList = users.filter((u) => u.role === "admin").map((u) => u.username);
    const internsList = users.filter((u) => u.role === "intern").map((u) => u.username);

    const adminProjectsMap = new Map<string, Project[]>();
    projects.forEach((p) => {
      const list = adminProjectsMap.get(p.owner) || [];
      list.push(p);
      adminProjectsMap.set(p.owner, list);
    });

    const projectImageCounts: Record<string, number> = {};
    datasets.forEach((d) => {
      if (d.project_id) {
        projectImageCounts[d.project_id] = (projectImageCounts[d.project_id] || 0) + 1;
      }
    });

    const adminStats = adminsList.map((admin) => {
      const adminProjects = adminProjectsMap.get(admin) || [];
      const interns = new Set<string>();
      let totalImages = 0;

      adminProjects.forEach((p) => {
        p.assigned_users?.forEach((u) => interns.add(u));
        totalImages += projectImageCounts[p.project_id] || 0;
      });

      return {
        admin,
        projectsCount: adminProjects.length,
        internsCount: interns.size,
        totalImages,
      };
    });

    const internStats = internsList.map((intern) => {
      const myUploads = datasets.filter((d) => d.owner === intern).length;
      const assignedProjects = projects.filter((p) => p.assigned_users?.includes(intern)).map((p) => p.name);

      return {
        intern,
        uploadedImages: myUploads,
        projectsCount: assignedProjects.length,
        projects: assignedProjects.join(", ") || "—",
      };
    }).sort((a, b) => b.uploadedImages - a.uploadedImages);

    return {
      adminStats,
      internStats,
    };
  }, [isSuperadmin, users, projects, datasets]);

  // Admin scoped analytics (strictly for their managed projects/interns)
  const adminAnalytics = useMemo(() => {
    if (!isAdmin) return null;

    const myProjects = projects.filter((p) => p.owner === username);
    const myProjectIds = new Set(myProjects.map((p) => p.project_id));
    
    const myInterns = new Set<string>();
    myProjects.forEach((p) => {
      p.assigned_users?.forEach((u) => myInterns.add(u));
    });

    const myProjectDatasets = datasets.filter((d) => d.project_id && myProjectIds.has(d.project_id));

    // Project shares
    const projectShares: Record<string, number> = {};
    myProjects.forEach((p) => { projectShares[p.name] = 0; });
    myProjectDatasets.forEach((d) => {
      const proj = myProjects.find((p) => p.project_id === d.project_id);
      if (proj) projectShares[proj.name] = (projectShares[proj.name] || 0) + 1;
    });

    const projectShareData = Object.entries(projectShares)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Intern split in my projects
    const internContributions: Record<string, number> = {};
    myProjectDatasets.forEach((d) => {
      if (d.owner && myInterns.has(d.owner)) {
        internContributions[d.owner] = (internContributions[d.owner] || 0) + 1;
      }
    });

    const internContributionData = Object.entries(internContributions)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Category distribution in my projects
    const categories: Record<string, number> = {};
    myProjectDatasets.forEach((d) => {
      const cat = d["lab/dept"] || "Unclassified";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      projectsCount: myProjects.length,
      internsCount: myInterns.size,
      totalImages: myProjectDatasets.length,
      projectShareData,
      internContributionData,
      categoryData,
    };
  }, [isAdmin, projects, datasets, username]);

  const handleDownloadReport = () => {
    if (!reportSummary) return;

    let text = `ANNAM DATA PLATFORM - WORK CONTRIBUTION REPORT\n`;
    text += `==============================================\n\n`;
    text += `Contributor Name : ${username}\n`;
    text += `Role             : ${role.toUpperCase()}\n`;
    text += `Report Date      : ${new Date().toLocaleDateString("en-IN")}\n`;
    text += `Total Months Active : ${reportSummary.monthsCount} month(s)\n`;
    text += `Total Images Contributed : ${reportSummary.totalUploads}\n\n`;
    text += `MONTH-BY-MONTH SUMMARY:\n`;
    text += `----------------------------------------------\n\n`;

    reportSummary.months.forEach((m) => {
      text += `[${m.label}]\n`;
      text += `  • Uploaded Images   : ${m.imagesCount}\n`;
      text += `  • Unique Datasets   : ${m.datasetsCount}\n`;
      text += `  • Field Categories  : ${m.categories.join(", ")}\n`;
      text += `\n`;
    });

    text += `==============================================\n`;
    text += `End of Report. Generated automatically by ANNAM Storage Platform.\n`;

    downloadBlob(new Blob([text], { type: "text/plain" }), `${username}_work_report.txt`);
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />
      <div className="relative z-10 flex w-full">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-auto p-8">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="mt-2 text-zinc-500">
                  {isSuperadmin 
                    ? "Detailed insights on Admin management and Intern productivity." 
                    : isAdmin 
                    ? "Insights into your projects, assigned interns, and upload trends." 
                    : "Track your data collection contributions and progress."}
                </p>
              </div>

              {/* Intern Work Report Trigger */}
              {isInternOrOther && reportSummary && (
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors">
                      <FileText size={16} />
                      Generate Work Report
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px] bg-zinc-900 border border-zinc-800 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">Work Contribution Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="grid grid-cols-2 gap-3 bg-zinc-950/60 p-4 border border-zinc-800/80 rounded-xl text-sm">
                        <div>
                          <p className="text-zinc-500 text-xs">Contributor</p>
                          <p className="font-semibold text-white mt-0.5">{username}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Role</p>
                          <p className="font-semibold text-emerald-400 mt-0.5 capitalize">{role}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Total Active Period</p>
                          <p className="font-semibold text-white mt-0.5">{reportSummary.monthsCount} Month(s)</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Total Images Uploaded</p>
                          <p className="font-semibold text-white mt-0.5">{reportSummary.totalUploads}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Month-by-Month Summary</p>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 [scrollbar-color:#3f3f46_transparent]">
                          {reportSummary.months.length === 0 ? (
                            <p className="text-zinc-500 text-center py-6 text-sm">No uploads recorded yet.</p>
                          ) : (
                            reportSummary.months.map((m) => (
                              <div key={m.monthKey} className="border border-zinc-850 bg-zinc-950/20 p-3 rounded-lg flex flex-col gap-1 text-xs">
                                <p className="font-semibold text-white text-sm">{m.label}</p>
                                <div className="flex gap-4 text-zinc-400 mt-1">
                                  <span>Images: <strong className="text-zinc-200">{m.imagesCount}</strong></span>
                                  <span>Datasets: <strong className="text-zinc-200">{m.datasetsCount}</strong></span>
                                </div>
                                <p className="text-zinc-500 mt-1">Categories: {m.categories.join(", ")}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                        <button
                          onClick={() => setReportOpen(false)}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition"
                        >
                          Close
                        </button>
                        <button
                          onClick={handleDownloadReport}
                          disabled={reportSummary.totalUploads === 0}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition disabled:opacity-40"
                        >
                          <Download size={13} />
                          Download Report
                        </button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {loading ? (
              <div className="flex h-60 items-center justify-center text-zinc-500">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* 1. SUPERADMIN ANALYTICS VIEW */}
                {isSuperadmin && superadminAnalytics && (
                  <>
                    <div className="grid gap-5 md:grid-cols-4">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-emerald-300 border-emerald-500/25 bg-emerald-500/10"><Images size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{datasets.length}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">Total Images</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-violet-300 border-violet-500/25 bg-violet-500/10"><Crown size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{users.filter(u => u.role === "admin").length}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">Total Admins</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-amber-300 border-amber-500/25 bg-amber-500/10"><Users size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{users.filter(u => u.role === "intern").length}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">Total Interns</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-sky-300 border-sky-500/25 bg-sky-500/10"><Database size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{projects.length}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">Total Projects</p>
                      </div>
                    </div>

                    {/* Superadmin Visual Comparison Charts */}
                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                        <h3 className="font-semibold text-white text-sm mb-4">Admins Collection Progress</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={superadminAnalytics.adminStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis dataKey="admin" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5" }} />
                              <Bar dataKey="totalImages" name="Images Collected" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                        <h3 className="font-semibold text-white text-sm mb-4">Intern Upload Contribution (Top 8)</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={superadminAnalytics.internStats.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis dataKey="intern" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5" }} />
                              <Bar dataKey="uploadedImages" name="Images Uploaded" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Admin Management Section */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Crown size={18} className="text-violet-300" />
                        <h2 className="text-lg font-semibold text-white">Admin Management Details</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-800 text-left text-zinc-500">
                              <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Admin Username</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Projects Managed</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Assigned Interns</th>
                              <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider">Total Images Collected</th>
                            </tr>
                          </thead>
                          <tbody>
                            {superadminAnalytics.adminStats.map((stat) => (
                              <tr key={stat.admin} className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/10">
                                <td className="py-3.5 font-semibold text-white">{stat.admin}</td>
                                <td className="py-3.5 text-zinc-300 font-mono">{stat.projectsCount}</td>
                                <td className="py-3.5 text-zinc-300 font-mono">{stat.internsCount}</td>
                                <td className="py-3.5 text-right text-emerald-300 font-semibold font-mono">{stat.totalImages}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Intern Contribution Section */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck size={18} className="text-emerald-400" />
                        <h2 className="text-lg font-semibold text-white">Intern Contribution Details</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-800 text-left text-zinc-500">
                              <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Intern Username</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Images Uploaded</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Active Projects</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-wider">Assigned Project Names</th>
                            </tr>
                          </thead>
                          <tbody>
                            {superadminAnalytics.internStats.map((stat) => (
                              <tr key={stat.intern} className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/10">
                                <td className="py-3.5 font-semibold text-white">{stat.intern}</td>
                                <td className="py-3.5 text-emerald-300 font-semibold font-mono">{stat.uploadedImages}</td>
                                <td className="py-3.5 text-zinc-300 font-mono">{stat.projectsCount}</td>
                                <td className="py-3.5 text-zinc-400 max-w-xs truncate">{stat.projects}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. ADMIN ANALYTICS VIEW (Scoped to their owned projects/interns) */}
                {isAdmin && adminAnalytics && (
                  <>
                    <div className="grid gap-5 md:grid-cols-3">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-sky-300 border-sky-500/25 bg-sky-500/10"><Database size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{adminAnalytics.projectsCount}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">My Projects</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-amber-300 border-amber-500/25 bg-amber-500/10"><Users size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{adminAnalytics.internsCount}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">Assigned Interns</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-emerald-300 border-emerald-500/25 bg-emerald-500/10"><Images size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{adminAnalytics.totalImages}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">Total Images in My Projects</p>
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      {/* Project share donut */}
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                        <h3 className="font-semibold text-white text-sm mb-4">Project Image Volumes</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="relative h-48 w-48 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={adminAnalytics.projectShareData} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                                  {adminAnalytics.projectShareData.map((entry, index) => (
                                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5" }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex-1 space-y-2 w-full">
                            {adminAnalytics.projectShareData.slice(0, 4).map((entry, index) => (
                              <div key={entry.name} className="flex items-center justify-between text-xs bg-zinc-950/40 border border-zinc-800/40 rounded-xl px-3 py-1.5">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                  <span className="text-zinc-300 font-medium truncate">{entry.name}</span>
                                </div>
                                <span className="text-white font-mono font-semibold shrink-0">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Intern upload contribution list */}
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                        <h3 className="font-semibold text-white text-sm mb-4">Intern Contribution Split</h3>
                        {adminAnalytics.internContributionData.length === 0 ? (
                          <p className="text-xs text-zinc-500 py-12 text-center">No intern uploads registered under your projects yet.</p>
                        ) : (
                          <div className="h-48 overflow-y-auto space-y-2 pr-1 [scrollbar-color:#3f3f46_transparent]">
                            {adminAnalytics.internContributionData.map((item, index) => (
                              <div key={item.name} className="flex items-center justify-between text-xs bg-zinc-950/45 border border-zinc-800/45 rounded-xl px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500 font-semibold">{index + 1}.</span>
                                  <span className="text-white font-medium">{item.name}</span>
                                </div>
                                <span className="text-emerald-400 font-mono font-bold">{item.value} uploads</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category Mix in Admin Projects */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                      <h3 className="font-semibold text-white text-sm mb-4">Category Distribution (in My Projects)</h3>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={adminAnalytics.categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5" }} />
                            <Bar dataKey="value" name="Images count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                              {adminAnalytics.categoryData.map((entry) => (
                                <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#a1a1aa"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. INTERN / STUDENT / RESEARCHER ANALYTICS VIEW */}
                {isInternOrOther && (
                  <>
                    <div className="grid gap-5 md:grid-cols-3">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-emerald-300 border-emerald-500/25 bg-emerald-500/10"><Images size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{datasets.length}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">My Uploaded Images</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-sky-300 border-sky-500/25 bg-sky-500/10"><Database size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{new Set(datasets.map(d => d.dataset_name)).size}</p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">My Datasets</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-amber-300 border-amber-500/25 bg-amber-500/10"><Clock3 size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">
                          {datasets[0]?.timestamp ? new Date(datasets[0].timestamp).toLocaleDateString("en-IN") : "—"}
                        </p>
                        <p className="mt-1 text-xs font-medium text-zinc-500">Last Upload Date</p>
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-5">
                      {/* Timeline AreaChart */}
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 xl:col-span-3">
                        <h3 className="font-semibold text-white text-sm mb-4">My Collection Timeline Progress</h3>
                        <div className="h-64">
                          {personalProgress.length === 0 ? (
                            <p className="text-xs text-zinc-500 py-24 text-center">No upload data recorded yet.</p>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={personalProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5" }} />
                                <Area type="monotone" dataKey="count" name="Images" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* Category Mix PieChart */}
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 xl:col-span-2">
                        <h3 className="font-semibold text-white text-sm mb-4">My Category Mix</h3>
                        <div className="flex flex-col items-center">
                          <div className="h-44 w-44">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={personalCategoryMix} innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                                  {personalCategoryMix.map((entry) => (
                                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#a1a1aa"} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5" }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-full mt-3 grid grid-cols-2 gap-1.5 text-[10px]">
                            {personalCategoryMix.map((entry) => (
                              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || "#a1a1aa" }} />
                                <span className="text-zinc-400 truncate">{entry.name} ({entry.value})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <RecentActivity data={activity.filter(a => a.owner === username)} />
                    </div>
                  </>
                )}

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
