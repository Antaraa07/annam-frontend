"use client";

import { Input } from "@/components/ui/input";

interface Props {
  search: string;
  setSearch: (value: string) => void;

  owner: string;
  setOwner: (value: string) => void;

  department: string;
  setDepartment: (value: string) => void;

  owners: string[];
  departments: string[];
}

export default function SearchFilter({
  search,
  setSearch,
  owner,
  setOwner,
  department,
  setDepartment,
  owners,
  departments,
}: Props) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">

      {/* Search */}

      <Input
        placeholder="Search datasets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border-zinc-800 bg-zinc-900 text-white"
      />

      {/* Owner */}

      <select
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white"
      >
        <option value="">All Owners</option>

        {(owners || []).map((o, index) => (
          <option key={`owner-${o}-${index}`} value={o}>
            {o}
          </option>
        ))}
      </select>

      {/* Department */}

      <select
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white"
      >
        <option value="">All Departments</option>

        {(departments || []).map((d, index) => (
          <option key={`dept-${d}-${index}`} value={d}>
            {d}
          </option>
        ))}
      </select>

    </div>
  );
}