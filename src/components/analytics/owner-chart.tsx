"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type OwnerChartItem = {
  owner: string;
  dataset_count: number;
};

interface Props {
  data: OwnerChartItem[];
}

export default function OwnerChart({ data }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-md">
      <h2 className="mb-6 text-lg font-semibold text-white tracking-tight">
        Datasets per Owner
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ownerBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="ownerLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fba953" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="owner" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />

          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              background: "rgba(15, 15, 18, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "12px",
              color: "#f4f4f5",
              fontSize: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(12px)",
            }}
          />

          <Bar dataKey="dataset_count" name="Dataset Count" fill="url(#ownerBarGrad)" radius={[8, 8, 0, 0]} barSize={28} />
          <Line type="monotone" dataKey="dataset_count" name="Trend" stroke="url(#ownerLineGrad)" strokeWidth={3} dot={{ r: 5, fill: "#fba953", stroke: "#0f0f11", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#fba953", stroke: "#ffffff", strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}