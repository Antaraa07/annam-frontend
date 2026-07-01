"use client";

import { motion } from "framer-motion";

interface Props {
  title: string;
  value: string;
  index?: number;
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  index = 0,
  isLoading = false,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: "easeOut",
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl transition-colors duration-300 hover:border-emerald-500/40"
    >
      {/* Glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(16,185,129,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        {title}
      </p>

      {isLoading ? (
        <div className="mt-3 h-10 w-24 animate-pulse rounded-lg bg-zinc-800" />
      ) : (
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: index * 0.08 + 0.2,
          }}
          className="mt-3 text-4xl font-bold tracking-tight text-white"
        >
          {value}
        </motion.h2>
      )}
    </motion.div>
  );
}