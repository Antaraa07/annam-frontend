"use client";

import { Input } from "@/components/ui/input";

const CATEGORIES = ["Disease", "Pest", "Damage", "Disease Damage", "Healthy", "Other"];

interface Props {
  search: string;
  setSearch: (v: string) => void;
  owner: string;
  setOwner: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  owners: string[];
}

export default function SearchFilter({
  search, setSearch,
  owner, setOwner,
  category, setCategory,
  owners,
}: Props) {
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-3">
      <Input
        placeholder="Search datasets…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border-zinc-800 bg-zinc-900 text-white placeholder-zinc-600"
      />

      <select
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
      >
        <option value="">All Owners</option>
        {owners.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}
