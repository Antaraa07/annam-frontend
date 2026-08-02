"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Database,
  ImagePlus,
  BarChart3,
  Users,
  Settings,
  FolderKanban,
  LogOut,
  ChevronRight,
  Layers,
} from "lucide-react";

const ALL_MENU_ITEMS = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, adminOnly: false, accent: "emerald" },
  { title: "Datasets", href: "/datasets", icon: Database, adminOnly: false, accent: "cyan" },
  { title: "Raw Data Upload", href: "/upload", icon: ImagePlus, adminOnly: false, accent: "violet" },
  { title: "Analytics", href: "/analytics", icon: BarChart3, adminOnly: false, accent: "amber" },
  { title: "Projects", href: "/projects", icon: FolderKanban, adminOnly: false, accent: "sky" },
  { title: "Users", href: "/users", icon: Users, adminOnly: true, accent: "rose" },
  { title: "Settings", href: "/settings", icon: Settings, adminOnly: false, accent: "zinc" },
];


const ACCENT_ACTIVE: Record<string, string> = {
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  cyan: "text-cyan-400    bg-cyan-500/10    border-cyan-500/20",
  violet: "text-violet-400  bg-violet-500/10  border-violet-500/20",
  amber: "text-amber-400   bg-amber-500/10   border-amber-500/20",
  sky: "text-sky-400     bg-sky-500/10     border-sky-500/20",
  rose: "text-rose-400    bg-rose-500/10    border-rose-500/20",
  zinc: "text-zinc-300    bg-zinc-800       border-zinc-700",
};

const ACCENT_ICON: Record<string, string> = {
  emerald: "text-emerald-400",
  cyan: "text-cyan-400",
  violet: "text-violet-400",
  amber: "text-amber-400",
  sky: "text-sky-400",
  rose: "text-rose-400",
  zinc: "text-zinc-400",
};

const ACCENT_GLOW: Record<string, string> = {
  emerald: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  cyan: "shadow-[0_0_12px_rgba(6,182,212,0.15)]",
  violet: "shadow-[0_0_12px_rgba(139,92,246,0.15)]",
  amber: "shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  sky: "shadow-[0_0_12px_rgba(14,165,233,0.15)]",
  rose: "shadow-[0_0_12px_rgba(244,63,94,0.15)]",
  zinc: "",
};

type StoredUser = { username: string; role: string };

function readStoredUser(): StoredUser {
  return {
    username: localStorage.getItem("username") || "",
    role: localStorage.getItem("role") || "",
  };
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StoredUser>(() =>
    typeof window === "undefined" ? { username: "", role: "" } : readStoredUser()
  );

  const menuItems = useMemo(() => {
    const hasAdminAccess = user.role === "admin" || user.role === "superadmin";
    return ALL_MENU_ITEMS.filter((item) => !item.adminOnly || hasAdminAccess);
  }, [user.role]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setUser({ username: "", role: "" });
    router.push("/login");
  };

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex w-64 flex-col border-r border-zinc-800/60 bg-zinc-950 relative"
    >
      {/* Subtle vertical gradient line along the right edge */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-zinc-700/40 to-transparent" />

      {/* Logo section */}
      <div className="px-5 py-5 border-b border-zinc-800/60 bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl blur-md bg-emerald-500/20" />
            <Image
              src="/logo.png"
              alt="ANNAM Logo"
              width={36}
              height={36}
              className="relative object-contain rounded-xl shadow-md"
            />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">ANNAM</h1>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mt-0.5">Storage Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">.........</p>
        {menuItems.map((item, i) => {
          const isActive = pathname === item.href;
          const accentCls = ACCENT_ACTIVE[item.accent] || ACCENT_ACTIVE.zinc;
          const iconCls = isActive ? ACCENT_ICON[item.accent] : "text-zinc-500 group-hover:text-zinc-300";
          const glowCls = isActive ? ACCENT_GLOW[item.accent] : "";

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 + 0.1, duration: 0.28 }}
            >
              <Link
                href={item.href}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                    ? `border ${accentCls} ${glowCls}`
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                  }`}
              >
                {/* Active spring pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 rounded-xl opacity-0`}
                      style={{ zIndex: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* Active left indicator */}
                {isActive && (
                  <div className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full ${ACCENT_ICON[item.accent]?.replace("text-", "bg-")}`} />
                )}

                <item.icon size={17} className={`relative z-10 shrink-0 transition-colors duration-200 ${iconCls}`} />
                <span className="relative z-10 flex-1 text-[14px]">{item.title}</span>
                {isActive && (
                  <ChevronRight size={13} className={`relative z-10 opacity-60 ${ACCENT_ICON[item.accent]}`} />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-zinc-800/60 px-4 py-4 space-y-3">
        {/* Platform badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          <Layers size={14} className="text-zinc-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-zinc-400 truncate">ANNAM Platform</p>
            <p className="text-[10px] text-zinc-600">Agricultural Data Storage</p>
          </div>
        </div>

        {pathname !== "/login" && (
          <button
            onClick={() => (user.username ? handleLogout() : router.push("/login"))}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-400 transition-all duration-200"
          >
            <LogOut size={14} className="shrink-0" />
            <span>{user.username ? "Logout" : "Login"}</span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}
