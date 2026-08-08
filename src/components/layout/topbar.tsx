"use client";

import { useEffect, useState } from "react";

const ROLE_STYLE: Record<string, string> = {
  superadmin: "text-violet-300",
  admin: "text-amber-300",
  intern: "text-emerald-300",
  researcher: "text-cyan-300",
  student: "text-blue-300",
};

export default function Topbar() {
  const [user, setUser] = useState({ username: "", role: "" });

  useEffect(() => {
    setUser({
      username: localStorage.getItem("username") || "",
      role: localStorage.getItem("role") || "",
    });
  }, []);

  if (!user.username) return null;

  const roleCls = ROLE_STYLE[user.role] ?? "text-zinc-400";

  return (
    <div className="flex w-full justify-end px-6 pt-4">
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 shadow-xl backdrop-blur-xl">
        <div className="text-right leading-tight">
          <p className="text-sm font-bold text-white">{user.username}</p>
          <p className={`text-xs font-medium capitalize ${roleCls}`}>
            {user.role}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black uppercase text-white shadow-md">
          {user.username.slice(0, 2)}
        </div>
      </div>
    </div>
  );
}