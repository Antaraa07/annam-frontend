"use client";
import AppShell from "@/components/layout/app-shell";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Database, FileText, Download, BarChart3, Users, Crown, ShieldCheck, HardDrive, Images, Activity } from "lucide-react";
import { 
  Bar, 
  BarChart, 
  ComposedChart,
  Line,
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


import SummaryCard from "@/components/analytics/summary-card";
import RecentActivity from "@/components/analytics/recent-activity";
import CropDistribution from "@/components/dashboard/crop-distribution";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getSummary, getOwners } from "@/services/analytics";
import { getRecentActivity } from "@/services/activity";
import { getDatasets } from "@/services/datasets";
import { usePolling } from "@/hooks/usePolling";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { downloadBlob } from "@/utils/download";
import type { Dataset } from "@/types/dataset";
import type { Project } from "@/types/project";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CHART_COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#ec4899", "#f97316", "#0ea5e9", "#14b8a6"];

const CATEGORY_COLORS: Record<string, string> = {
  Healthy: "#10b981",
  Disease: "#f43f5e",
  Pest: "#eab308",
  "Disease Damage": "#a855f7",
  "Pest Damage": "#f97316",
  Damage: "#06b6d4",
  Unclassified: "#71717a",
};

const TOOLTIP_STYLE = {
  background: "rgba(15, 15, 18, 0.92)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "14px",
  color: "#f4f4f5",
  fontSize: "13px",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(251, 169, 83, 0.08)",
  backdropFilter: "blur(12px)",
};

interface Summary {
  datasets: number;
  owners: number;
  storage: string;
}

type UserEntry = { username: string; role: string };

function getPeriodKey(dateStr: string | undefined, period: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.valueOf())) return "";
  
  if (period === "yearly") {
    return d.getFullYear().toString();
  }
  if (period === "monthly") {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`;
  }
  if (period === "weekly") {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    const mm = String(startOfWeek.getMonth() + 1).padStart(2, "0");
    const dd = String(startOfWeek.getDate()).padStart(2, "0");
    return `${startOfWeek.getFullYear()}-${mm}-${dd}`;
  }
  // daily
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatPeriod(periodKey: string, period: string): string {
  if (!periodKey) return "—";
  try {
    if (period === "yearly") {
      return `Year ${periodKey}`;
    }
    if (period === "monthly") {
      const [year, month] = periodKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 2);
      return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date);
    }
    if (period === "weekly") {
      const date = new Date(periodKey);
      const formatted = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
      return `Wk of ${formatted}`;
    }
    // daily
    const date = new Date(periodKey);
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  } catch {
    return periodKey;
  }
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
  const [internPeriod, setInternPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [imageVolumeSource, setImageVolumeSource] = useState<"project" | "raw_data">("project");
  const [internSplitSource, setInternSplitSource] = useState<"project" | "raw_data">("project");

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

  // Personal progress for Interns (Daily, Weekly, Monthly, Yearly)
  const personalProgress = useMemo(() => {
    const myUploads = datasets.filter((d) => d.owner === username);
    const groups: Record<string, number> = {};
    myUploads.forEach((d) => {
      const periodKey = getPeriodKey(d.timestamp, internPeriod);
      if (!periodKey) return;
      groups[periodKey] = (groups[periodKey] || 0) + 1;
    });
    return Object.entries(groups)
      .map(([periodKey, count]) => {
        return { 
          month: formatPeriod(periodKey, internPeriod), 
          count, 
          raw: periodKey 
        };
      })
      .sort((a, b) => a.raw.localeCompare(b.raw));
  }, [datasets, username, internPeriod]);

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

    const adminStats = adminsList.map((admin) => {
      const adminProjects = adminProjectsMap.get(admin) || [];
      const adminProjectIds = new Set(adminProjects.map((p) => p.project_id));
      const interns = new Set<string>();

      adminProjects.forEach((p) => {
        p.assigned_users?.forEach((u) => interns.add(u));
      });

      // Count ALL images collected under this admin:
      // 1. Raw or project images uploaded by the admin (d.owner === admin)
      // 2. Images inside projects owned by this admin (d.project_id in adminProjectIds)
      const totalImages = datasets.filter(
        (d) => d.owner === admin || (d.project_id && adminProjectIds.has(d.project_id))
      ).length;

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

  // Admin scoped analytics (strictly for their managed projects/interns/raw uploads)
  const adminAnalytics = useMemo(() => {
    if (!isAdmin) return null;

    const myProjects = projects.filter((p) => p.owner === username);
    const myProjectIds = new Set(myProjects.map((p) => p.project_id));
    
    const myInterns = new Set<string>();
    myProjects.forEach((p) => {
      p.assigned_users?.forEach((u) => myInterns.add(u));
    });

    const myProjectDatasets = datasets.filter((d) => d.project_id && myProjectIds.has(d.project_id));
    const myRawDatasets = datasets.filter((d) => !d.project_id && (d.owner === username || myInterns.has(d.owner)));
    const allAdminDatasets = datasets.filter((d) => d.owner === username || (d.project_id && myProjectIds.has(d.project_id)) || (d.owner && myInterns.has(d.owner)));

    // Image Volumes calculation based on imageVolumeSource dropdown ("project" vs "raw_data")
    let imageVolumeData: { name: string; value: number }[] = [];

    if (imageVolumeSource === "project") {
      const projectShares: Record<string, number> = {};
      myProjects.forEach((p) => { projectShares[p.name] = 0; });
      myProjectDatasets.forEach((d) => {
        const proj = myProjects.find((p) => p.project_id === d.project_id);
        if (proj) projectShares[proj.name] = (projectShares[proj.name] || 0) + 1;
      });

      imageVolumeData = Object.entries(projectShares)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    } else {
      // Raw Data Image Volumes
      const rawShares: Record<string, number> = {};
      myRawDatasets.forEach((d) => {
        const groupName = d.dataset_name || d["lab/dept"] || d.department || "Raw Uploads";
        rawShares[groupName] = (rawShares[groupName] || 0) + 1;
      });

      imageVolumeData = Object.entries(rawShares)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }

    // Intern Contribution Split calculation based on internSplitSource dropdown ("project" vs "raw_data")
    const internContributions: Record<string, number> = {};
    const targetDatasets = internSplitSource === "project" ? myProjectDatasets : myRawDatasets;
    targetDatasets.forEach((d) => {
      if (d.owner && (myInterns.has(d.owner) || users.some((u) => u.username === d.owner && u.role === "intern"))) {
        internContributions[d.owner] = (internContributions[d.owner] || 0) + 1;
      }
    });

    const internContributionData = Object.entries(internContributions)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Category distribution in admin's datasets
    const categories: Record<string, number> = {};
    allAdminDatasets.forEach((d) => {
      const cat = d["lab/dept"] || d.department || "Unclassified";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      projectsCount: myProjects.length,
      internsCount: myInterns.size,
      totalImages: allAdminDatasets.length,
      imageVolumeData,
      internContributionData,
      categoryData,
      allAdminDatasets,
    };
  }, [isAdmin, projects, datasets, username, imageVolumeSource, internSplitSource, users]);

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
    <AppShell>
      <div className="flex-1 overflow-auto p-8">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="mt-2 text-zinc-300">
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
                          <p className="text-zinc-300 text-sm">Contributor</p>
                          <p className="font-semibold text-white mt-0.5">{username}</p>
                        </div>
                        <div>
                          <p className="text-zinc-300 text-sm">Role</p>
                          <p className="font-semibold text-emerald-400 mt-0.5 capitalize">{role}</p>
                        </div>
                        <div>
                          <p className="text-zinc-300 text-sm">Total Active Period</p>
                          <p className="font-semibold text-white mt-0.5">{reportSummary.monthsCount} Month(s)</p>
                        </div>
                        <div>
                          <p className="text-zinc-300 text-sm">Total Images Uploaded</p>
                          <p className="font-semibold text-white mt-0.5">{reportSummary.totalUploads}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm uppercase font-semibold text-zinc-300 tracking-wider">Month-by-Month Summary</p>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 [scrollbar-color:#3f3f46_transparent]">
                          {reportSummary.months.length === 0 ? (
                            <p className="text-zinc-300 text-center py-6 text-sm">No uploads recorded yet.</p>
                          ) : (
                            reportSummary.months.map((m) => (
                              <div key={m.monthKey} className="border border-zinc-850 bg-zinc-950/20 p-3 rounded-lg flex flex-col gap-1 text-sm">
                                <p className="font-semibold text-white text-sm">{m.label}</p>
                                <div className="flex gap-4 text-zinc-200 mt-1">
                                  <span>Images: <strong className="text-zinc-200">{m.imagesCount}</strong></span>
                                  <span>Datasets: <strong className="text-zinc-200">{m.datasetsCount}</strong></span>
                                </div>
                                <p className="text-zinc-300 mt-1">Categories: {m.categories.join(", ")}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                        <button
                          onClick={() => setReportOpen(false)}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 transition"
                        >
                          Close
                        </button>
                        <button
                          onClick={handleDownloadReport}
                          disabled={reportSummary.totalUploads === 0}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition disabled:opacity-40"
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
              <div className="flex h-60 items-center justify-center text-zinc-300">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* 1. SUPERADMIN ANALYTICS VIEW */}
                {isSuperadmin && superadminAnalytics && (
                  <>
                    <div className="grid gap-5 md:grid-cols-4">
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_24px_rgba(16,185,129,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-emerald-300 border-emerald-500/25 bg-emerald-500/10"><Images size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-emerald-400">{datasets.length}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">Total Images</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-emerald-500/5 blur-xl" />
                      </div>
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_0_24px_rgba(139,92,246,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-violet-300 border-violet-500/25 bg-violet-500/10"><Crown size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-violet-400">{users.filter(u => u.role === "admin").length}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">Total Admins</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-violet-500/5 blur-xl" />
                      </div>
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_24px_rgba(245,158,11,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-amber-300 border-amber-500/25 bg-amber-500/10"><Users size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-amber-400">{users.filter(u => u.role === "intern").length}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">Total Interns</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-amber-500/5 blur-xl" />
                      </div>
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_24px_rgba(6,182,212,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-cyan-300 border-cyan-500/25 bg-cyan-500/10"><Database size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-cyan-400">{projects.length}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">Total Projects</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-cyan-500/5 blur-xl" />
                      </div>
                    </div>

                    {/* Superadmin Visual Comparison Charts */}
                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 hover:border-violet-500/30 transition-all duration-300 backdrop-blur-md shadow-lg">
                        <div className="flex items-center gap-2 mb-5">
                          <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                          <h3 className="font-semibold text-white text-sm">Admins — Collection Progress</h3>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={superadminAnalytics.adminStats} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                  <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.08}/>
                                </linearGradient>
                                <linearGradient id="goldLineGrad1" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#fba953"/>
                                  <stop offset="50%" stopColor="#f59e0b"/>
                                  <stop offset="100%" stopColor="#fbbf24"/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="admin" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={TOOLTIP_STYLE} />
                              <Bar dataKey="totalImages" name="Images Collected" fill="url(#adminBarGrad)" radius={[8, 8, 0, 0]} barSize={28} />
                              <Line type="monotone" dataKey="totalImages" name="Trend" stroke="url(#goldLineGrad1)" strokeWidth={3} dot={{ r: 5, fill: "#fba953", stroke: "#0f0f11", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#fba953", stroke: "#ffffff", strokeWidth: 2 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-md shadow-lg">
                        <div className="flex items-center gap-2 mb-5">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                          <h3 className="font-semibold text-white text-sm">Interns — Upload Contribution (Top 8)</h3>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={superadminAnalytics.internStats.slice(0, 8)} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="internBarGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                                  <stop offset="100%" stopColor="#059669" stopOpacity={0.08}/>
                                </linearGradient>
                                <linearGradient id="emeraldLineGrad1" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#34d399"/>
                                  <stop offset="50%" stopColor="#10b981"/>
                                  <stop offset="100%" stopColor="#059669"/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="intern" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={TOOLTIP_STYLE} />
                              <Bar dataKey="uploadedImages" name="Images Uploaded" fill="url(#internBarGrad)" radius={[8, 8, 0, 0]} barSize={28} />
                              <Line type="monotone" dataKey="uploadedImages" name="Upload Trend" stroke="url(#emeraldLineGrad1)" strokeWidth={3} dot={{ r: 5, fill: "#34d399", stroke: "#0f0f11", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#34d399", stroke: "#ffffff", strokeWidth: 2 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Crop Type Distribution */}
                    <div className="grid gap-6">
                      <CropDistribution datasets={datasets} isLoading={loading} variant="analytics" />
                    </div>

                    {/* Admin Management Section */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-violet-500/20 transition-colors duration-300">
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                          <Crown size={15} className="text-violet-400" />
                        </div>
                        <h2 className="text-base font-semibold text-white">Admin Management Details</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b border-zinc-800/60 text-left">
                              <th className="pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Admin Username</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Projects</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Interns</th>
                              <th className="pb-3 text-right text-xs font-semibold uppercase tracking-widest text-zinc-500">Images</th>
                            </tr>
                          </thead>
                          <tbody>
                            {superadminAnalytics.adminStats.map((stat) => (
                              <tr key={stat.admin} className="border-b border-zinc-800/30 last:border-0 hover:bg-zinc-800/20 transition-colors">
                                <td className="py-3.5 font-semibold text-white">{stat.admin}</td>
                                <td className="py-3.5 text-zinc-300 font-mono">{stat.projectsCount}</td>
                                <td className="py-3.5 text-amber-400 font-mono font-semibold">{stat.internsCount}</td>
                                <td className="py-3.5 text-right font-mono">
                                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-sm font-bold text-emerald-400">{stat.totalImages}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Intern Contribution Section */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 hover:border-emerald-500/20 transition-colors duration-300">
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <ShieldCheck size={15} className="text-emerald-400" />
                        </div>
                        <h2 className="text-base font-semibold text-white">Intern Contribution Details</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b border-zinc-800/60 text-left">
                              <th className="pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Intern</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Images</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Projects</th>
                              <th className="pb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Project Names</th>
                            </tr>
                          </thead>
                          <tbody>
                            {superadminAnalytics.internStats.map((stat) => (
                              <tr key={stat.intern} className="border-b border-zinc-800/30 last:border-0 hover:bg-zinc-800/20 transition-colors">
                                <td className="py-3.5 font-semibold text-white">{stat.intern}</td>
                                <td className="py-3.5 font-mono">
                                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-sm font-bold text-emerald-400">{stat.uploadedImages}</span>
                                </td>
                                <td className="py-3.5 text-cyan-400 font-mono font-semibold">{stat.projectsCount}</td>
                                <td className="py-3.5 text-zinc-300 max-w-xs truncate">{stat.projects}</td>
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
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_24px_rgba(6,182,212,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-cyan-300 border-cyan-500/25 bg-cyan-500/10"><Database size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-cyan-400">{adminAnalytics.projectsCount}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">My Projects</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-cyan-500/5 blur-xl" />
                      </div>
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_24px_rgba(245,158,11,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-amber-300 border-amber-500/25 bg-amber-500/10"><Users size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-amber-400">{adminAnalytics.internsCount}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">Assigned Interns</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-amber-500/5 blur-xl" />
                      </div>
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_24px_rgba(16,185,129,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-emerald-300 border-emerald-500/25 bg-emerald-500/10"><Images size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-emerald-400">{adminAnalytics.totalImages}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">Total Managed Images</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-emerald-500/5 blur-xl" />
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      {/* Image Volumes donut */}
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-cyan-500/20 transition-colors duration-300">
                        <div className="flex items-center justify-between gap-2 mb-5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />
                            <h3 className="font-semibold text-white text-sm">Image Volumes</h3>
                          </div>
                          <Select
                            value={imageVolumeSource}
                            onValueChange={(val) => setImageVolumeSource(val as "project" | "raw_data")}
                          >
                            <SelectTrigger className="w-[120px] h-8 border-zinc-800 bg-zinc-950/80 text-xs font-semibold text-zinc-300">
                              <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-300">
                              <SelectItem value="project">Project</SelectItem>
                              <SelectItem value="raw_data">Raw Data</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {adminAnalytics.imageVolumeData.length === 0 ? (
                          <p className="text-sm text-zinc-300 py-12 text-center">
                            No {imageVolumeSource === "project" ? "project" : "raw data"} volumes recorded.
                          </p>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative h-48 w-48 shrink-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={adminAnalytics.imageVolumeData} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                                    {adminAnalytics.imageVolumeData.map((entry, index) => (
                                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", color: "#f4f4f5" }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-2 w-full max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]">
                              {adminAnalytics.imageVolumeData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between text-sm bg-zinc-950/40 border border-zinc-800/40 rounded-xl px-3 py-1.5">
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                    <span className="text-zinc-300 font-medium truncate">{entry.name}</span>
                                  </div>
                                  <span className="text-white font-mono font-semibold shrink-0">{entry.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Intern upload contribution list */}
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-amber-500/20 transition-colors duration-300">
                        <div className="flex items-center justify-between gap-2 mb-5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <h3 className="font-semibold text-white text-sm">Intern Contribution Split</h3>
                          </div>
                          <Select
                            value={internSplitSource}
                            onValueChange={(val) => setInternSplitSource(val as "project" | "raw_data")}
                          >
                            <SelectTrigger className="w-[120px] h-8 border-zinc-800 bg-zinc-950/80 text-xs font-semibold text-zinc-300">
                              <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-300">
                              <SelectItem value="project">Project</SelectItem>
                              <SelectItem value="raw_data">Raw Data</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {adminAnalytics.internContributionData.length === 0 ? (
                          <p className="text-sm text-zinc-300 py-12 text-center">
                            No intern uploads registered under {internSplitSource === "project" ? "projects" : "raw data"} yet.
                          </p>
                        ) : (
                          <div className="h-48 overflow-y-auto space-y-2 pr-1 [scrollbar-color:#3f3f46_transparent]">
                            {adminAnalytics.internContributionData.map((item, index) => (
                              <div key={item.name} className="flex items-center justify-between text-sm bg-zinc-950/45 border border-zinc-800/45 rounded-xl px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-300 font-semibold">{index + 1}.</span>
                                  <span className="text-white font-medium">{item.name}</span>
                                </div>
                                <span className="text-emerald-400 font-mono font-bold">{item.value} uploads</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Crop & Category Mix in Admin Datasets */}
                    <div className="grid gap-6 xl:grid-cols-2">
                      <CropDistribution datasets={adminAnalytics.allAdminDatasets} isLoading={loading} variant="analytics" />
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-amber-500/20 transition-colors duration-300">
                        <div className="flex items-center gap-2 mb-5">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <h3 className="font-semibold text-white text-sm">Category Distribution (in My Data)</h3>
                        </div>
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={adminAnalytics.categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: "#52525b", fontSize: 11 }} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{ fill: "rgba(245,158,11,0.06)" }} contentStyle={TOOLTIP_STYLE} />
                              <Bar dataKey="value" name="Images count" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                                {adminAnalytics.categoryData.map((entry) => (
                                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#a1a1aa"} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. INTERN / STUDENT / RESEARCHER ANALYTICS VIEW */}
                {isInternOrOther && (
                  <>
                    <div className="grid gap-5 md:grid-cols-3">
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_24px_rgba(16,185,129,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-emerald-300 border-emerald-500/25 bg-emerald-500/10"><Images size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-emerald-400">{datasets.length}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">My Uploaded Images</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-emerald-500/5 blur-xl" />
                      </div>
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_24px_rgba(6,182,212,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-cyan-300 border-cyan-500/25 bg-cyan-500/10"><Database size={18} /></div>
                        <p className="mt-5 text-2xl font-bold text-cyan-400">{new Set(datasets.map(d => d.dataset_name)).size}</p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">My Datasets</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-cyan-500/5 blur-xl" />
                      </div>
                      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_24px_rgba(245,158,11,0.10)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border text-amber-300 border-amber-500/25 bg-amber-500/10"><Clock3 size={18} /></div>
                        <p className="mt-5 text-xl font-bold text-amber-400">
                          {datasets[0]?.timestamp ? new Date(datasets[0].timestamp).toLocaleDateString("en-IN") : "—"}
                        </p>
                        <p className="mt-1 text-sm font-medium text-zinc-400">Last Upload Date</p>
                        <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-amber-500/5 blur-xl" />
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-5">
                      {/* Timeline AreaChart */}
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 xl:col-span-3 flex flex-col justify-between hover:border-emerald-500/20 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <h3 className="font-semibold text-white text-sm">My Collection Timeline</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={internPeriod}
                              onValueChange={(val) => setInternPeriod(val as any)}
                            >
                              <SelectTrigger className="w-[100px] h-8 border-zinc-800 bg-zinc-950/80 text-xs font-semibold text-zinc-300">
                                <SelectValue placeholder="Period" />
                              </SelectTrigger>
                              <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-300">
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="h-64">
                          {personalProgress.length === 0 ? (
                            <p className="text-sm text-zinc-500 py-24 text-center">No upload data recorded yet.</p>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={personalProgress} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="goldAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#fba953" stopOpacity={0.45}/>
                                    <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.15}/>
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="goldLineGrad2" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#fba953"/>
                                    <stop offset="50%" stopColor="#f59e0b"/>
                                    <stop offset="100%" stopColor="#fbbf24"/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "#fba953", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
                                <Area 
                                  type="monotone" 
                                  dataKey="count" 
                                  name="Images" 
                                  stroke="url(#goldLineGrad2)" 
                                  strokeWidth={3.5} 
                                  fillOpacity={1} 
                                  fill="url(#goldAreaGradient)" 
                                  dot={{ r: 5, fill: "#fba953", stroke: "#0f0f11", strokeWidth: 2.5 }} 
                                  activeDot={{ r: 8, fill: "#fba953", stroke: "#ffffff", strokeWidth: 2 }} 
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* Category Mix PieChart */}
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 xl:col-span-2 hover:border-violet-500/20 transition-colors duration-300">
                        <div className="flex items-center gap-2 mb-5">
                          <span className="h-2 w-2 rounded-full bg-violet-400" />
                          <h3 className="font-semibold text-white text-sm">My Category Mix</h3>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="h-44 w-44">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={personalCategoryMix} innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                  {personalCategoryMix.map((entry) => (
                                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#a1a1aa"} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-full mt-3 space-y-1.5">
                            {personalCategoryMix.map((entry) => (
                              <div key={entry.name} className="flex items-center justify-between text-xs bg-zinc-950/40 border border-zinc-800/40 rounded-lg px-2.5 py-1.5">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || "#a1a1aa" }} />
                                  <span className="text-zinc-300 truncate font-medium">{entry.name}</span>
                                </div>
                                <span className="text-white font-mono font-semibold shrink-0">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Crop Type Distribution */}
                    <div className="grid gap-6">
                      <CropDistribution datasets={datasets.filter(d => d.owner === username)} isLoading={loading} variant="analytics" />
                    </div>

                    <div>
                      <RecentActivity data={activity.filter(a => a.owner === username)} />
                    </div>
                  </>
                )}

              </div>
            )}
      </div>
    </AppShell>
  );
}
