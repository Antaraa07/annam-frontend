"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  Database,
  ImagePlus,
  BarChart3,
  Users,
  Settings,
  FolderKanban,
  LogOut,
} from "lucide-react";


const ALL_MENU_ITEMS = [
  { title: "Dashboard",        href: "/",          icon: LayoutDashboard, adminOnly: false },
  { title: "Datasets",         href: "/datasets",   icon: Database,        adminOnly: false },
  { title: "Raw Data Upload",  href: "/upload",     icon: ImagePlus,       adminOnly: false },
  { title: "Analytics",        href: "/analytics",  icon: BarChart3,       adminOnly: false },
  { title: "Projects",         href: "/projects",   icon: FolderKanban,    adminOnly: false },
  { title: "Users",            href: "/users",      icon: Users,           adminOnly: true  },
  { title: "Settings",         href: "/settings",   icon: Settings,        adminOnly: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState({ username: "", role: "" });

  useEffect(() => {
    setUser({
      username: localStorage.getItem("username") || "",
      role: localStorage.getItem("role") || "",
    });
  }, []);

  const isAdmin = user.role === "admin";
  const menuItems = ALL_MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    router.push("/login");
  };


  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex w-64 flex-col border-r border-zinc-800/60 bg-zinc-950"
    >
      {/* Logo */}
      <div className="px-6 py-7">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
          <h1 className="text-lg font-bold tracking-tight text-white">
            ANNAM
          </h1>
        </div>

        <p className="mt-0.5 pl-4 text-xs text-zinc-500">
          Storage Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3">
        {menuItems.map((item, i) => {
          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: i * 0.05 + 0.15,
                duration: 0.3,
              }}
            >
              <Link
                href={item.href}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-zinc-800"
                    style={{ zIndex: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

                {isActive && (
                  <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-emerald-400" />
                )}

                <item.icon
                  size={16}
                  className="relative z-10 shrink-0"
                />

                <span className="relative z-10">
                  {item.title}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-zinc-800/60 px-4 py-4 space-y-2">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400 border border-emerald-500/20 uppercase">
            {user.username.slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-300 truncate">
              {user.username}
            </p>

            <p className="text-[10px] text-zinc-500 capitalize">
              {user.role}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200"
        >
          <LogOut size={14} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}