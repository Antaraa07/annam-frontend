"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

export default function OwnerChart({
  data,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

      <h2 className="mb-6 text-lg font-semibold text-white">
        Datasets per Owner
      </h2>

      <ResponsiveContainer
        width="100%"
        height={320}
      >
        <BarChart data={data}>

          <CartesianGrid
            stroke="#333"
          />

          <XAxis
            dataKey="owner"
            stroke="#888"
          />

          <YAxis stroke="#888" />

          <Tooltip />

          <Bar
            dataKey="dataset_count"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />

        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}