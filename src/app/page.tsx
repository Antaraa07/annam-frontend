"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import StatsCard from "@/components/dashboard/stats-card";
import MouseTracker from "@/components/ui/mouse-tracker";

import RecentUploads from "@/components/dashboard/recent-uploads";
import StorageUsage from "@/components/dashboard/storage-usage";
import ActiveUsers from "@/components/dashboard/active-users";
import ActivityTimeline from "@/components/dashboard/activity-timeline";

import { getSummary } from "@/services/api";
import { DashboardSummary } from "@/types/dashboard";
import type {
  ActiveUsersResponse,
  RecentUpload,
  StorageUsageResponse,
} from "@/types/dashboard-v2";

import {
  getActiveUsers,
  getRecentUploads,
  getStorageUsage,
} from "@/services/dashboard-v2";

import { getRecentActivity } from "@/services/activity";

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUsersResponse | null>(null);
  const [storageUsage, setStorageUsage] = useState<StorageUsageResponse | null>(null);
  const [activity, setActivity] = useState<Array<{ dataset_name: string; owner: string; version: string }>>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [
          summaryData,
          uploadsData,
          activeUsersData,
          storageData,
          activityData,
        ] = await Promise.all([
          getSummary(),
          getRecentUploads(5),
          getActiveUsers(7, 5),
          getStorageUsage(),
          getRecentActivity(),
        ]);

        if (cancelled) return;

        setSummary(summaryData);
        setRecentUploads(uploadsData);
        setActiveUsers(activeUsersData);
        setStorageUsage(storageData);
        setActivity(activityData);
      } catch (error) {
        console.error("Dashboard API Error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    const timer = window.setInterval(() => {
      loadDashboard();
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);


  const stats = [
    {
      title: "Datasets",
      value: summary
        ? summary.datasets.toString()
        : "—",
    },
    {
      title: "Owners",
      value: summary
        ? summary.owners.toString()
        : "—",
    },
    {
      title: "Departments",
      value: summary
        ? summary.departments.toString()
        : "—",
    },
    {
      title: "Storage",
      value: summary ? summary.storage : "—",
    },
  ];

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />

      <div className="relative z-10 flex w-full">
        <Sidebar />

        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-auto p-8">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Overview</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  ANNAM Storage Console • live operational overview
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                <p className="text-xs font-medium text-zinc-400">Status</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-300">Live</p>
                </div>
              </div>
            </div>

            {/* Live Stats Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => (
                <StatsCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  index={index}
                  isLoading={loading}
                />
              ))}
            </div>

            {/* AWS Console-like Grid */}
            <div className="grid gap-6 xl:grid-cols-12">
              <div className="xl:col-span-7">
                <RecentUploads data={recentUploads} isLoading={loading} />
              </div>
              <div className="xl:col-span-5">
                <StorageUsage data={storageUsage} isLoading={loading} />
              </div>

              <div className="xl:col-span-5">
                <ActiveUsers data={activeUsers} isLoading={loading} />
              </div>
              <div className="xl:col-span-7">
                <ActivityTimeline data={activity} isLoading={loading} />
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}