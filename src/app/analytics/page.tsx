"use client";

import { useState } from "react";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

import SummaryCard from "@/components/analytics/summary-card";
import OwnerChart from "@/components/analytics/owner-chart";
import DepartmentChart from "@/components/analytics/department-chart";
import RecentActivity from "@/components/analytics/recent-activity";

import {
  getSummary,
  getOwners,
  getDepartments,
} from "@/services/analytics";

import { getRecentActivity } from "@/services/activity";
import { usePolling } from "@/hooks/usePolling";

interface Summary {
  datasets: number;
  owners: number;
  departments: number;
  storage: string;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  type OwnerChartItem = { owner: string; dataset_count: number };
  type DepartmentChartItem = { department: string; dataset_count: number };
  type RecentActivityItem = { dataset_name: string; owner: string; version: string };

  const [owners, setOwners] = useState<OwnerChartItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentChartItem[]>([]);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
      try {
        const [summaryData, ownerData, departmentData, activityData] =
          await Promise.all([
            getSummary(),
            getOwners(),
            getDepartments(),
            getRecentActivity(),
          ]);

        setSummary(summaryData);
        setOwners(ownerData);
        setDepartments(departmentData);
        setActivity(activityData);
      } catch (err) {
        console.error("Analytics Error:", err);
      } finally {
        setLoading(false);
      }
    }

  usePolling(loadAnalytics);

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />

      <div className="relative z-10 flex w-full">
        <Sidebar />

        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-auto p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">Analytics</h1>
              <p className="mt-2 text-zinc-500">
                Insights into datasets, owners and departments
              </p>
            </div>

            {loading ? (
              <div className="flex h-60 items-center justify-center text-zinc-500">
                Loading analytics...
              </div>
            ) : (
              <>
                <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard title="Datasets"    value={summary?.datasets    ?? 0} />
                  <SummaryCard title="Owners"      value={summary?.owners      ?? 0} />
                  <SummaryCard title="Departments" value={summary?.departments ?? 0} />
                  <SummaryCard title="Storage"     value={summary?.storage     ?? "0 GB"} />
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <OwnerChart data={owners} />
                  <DepartmentChart data={departments} />
                </div>

                <div className="mt-6">
                  <RecentActivity data={activity} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}