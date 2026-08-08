"use client";

import { Input } from "@/components/ui/input";

const CATEGORIES = ["Damage", "Deficiency", "Disease", "Normal", "Other", "Pest"];

interface Props {
  search: string;
  setSearch: (v: string) => void;
  owner: string;
  setOwner: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  owners: string[];
  roleFilter?: string;
  setRoleFilter?: (v: string) => void;
  currentUserRole?: string;
}

export default function SearchFilter({
  search, setSearch,
  owner, setOwner,
  category, setCategory,
  owners,
  roleFilter = "",
  setRoleFilter,
  currentUserRole = "",
}: Props) {
  const sortedOwners = [...owners].sort((a, b) => a.localeCompare(b));
  const hideOwnerFilters = currentUserRole === "intern" || currentUserRole === "student";

  return (
    <div className={`mb-6 grid gap-3 ${setRoleFilter && !hideOwnerFilters ? "md:grid-cols-4" : !hideOwnerFilters ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
      <Input
        placeholder="Search datasets…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border-zinc-800 bg-zinc-900 text-white placeholder-zinc-600"
      />

      {setRoleFilter && !hideOwnerFilters && (
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        >
          <option value="">All Contributor Roles</option>
          <option value="intern">Intern</option>
          <option value="researcher">Researcher</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
      )}

      {!hideOwnerFilters && (
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        >
          <option value="">All Owners</option>
          {sortedOwners.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}

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
