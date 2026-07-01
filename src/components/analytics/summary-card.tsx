"use client";

import { motion } from "framer-motion";

interface Props {
  title: string;
  value: string | number;
}

export default function SummaryCard({
  title,
  value,
}: Props) {
  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <p className="text-sm text-zinc-500">
        {title}
      </p>

      <h2 className="mt-3 text-3xl font-bold text-white">
        {value}
      </h2>
    </motion.div>
  );
}