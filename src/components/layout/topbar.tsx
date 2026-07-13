"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/datasets": "Datasets",
  "/upload": "Raw Data Upload",
  "/analytics": "Analytics",
  "/users": "Users",
  "/projects": "Projects",
  "/settings": "Settings",
};

export default function Topbar() {
  const pathname = usePathname();
  const [user, setUser] = useState({ username: "", role: "" });

  useEffect(() => {
    setUser({
      username: localStorage.getItem("username") || "",
      role: localStorage.getItem("role") || "",
    });
  }, []);

  const title = PAGE_TITLES[pathname] ?? "ANNAM";

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-8">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-zinc-400">ANNAM Storage Platform</p>
      </div>

      {user.username && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user.username}</p>
            <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-400 uppercase">
            {user.username.slice(0, 2)}
          </div>
        </div>
      )}
    </header>
  );
}
