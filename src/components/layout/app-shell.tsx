"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Topbar  from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

/**
 * AppShell — shared layout wrapper used by every authenticated page.
 *
 * Structure:
 *   ┌──────────┬──────────────────────────────────────────┐
 *   │          │            TOPBAR (user pill)             │
 *   │ SIDEBAR  ├──────────────────────────────────────────┤
 *   │          │            PAGE CONTENT                  │
 *   └──────────┴──────────────────────────────────────────┘
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-zinc-950">
      <MouseTracker />

      {/* Body row: sidebar + content column */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}