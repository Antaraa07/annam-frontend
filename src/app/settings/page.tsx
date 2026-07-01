"use client";

import { useMemo, useState } from "react";

import MouseTracker from "@/components/ui/mouse-tracker";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

type SettingSection = {
  id: string;
  title: string;
  description: string;
};

export default function SettingsPage() {
  const sections: SettingSection[] = useMemo(
    () => [
      {
        id: "profile",
        title: "Profile",
        description: "Update basic account information.",
      },
      {
        id: "security",
        title: "Security",
        description: "Password and session preferences.",
      },
      {
        id: "preferences",
        title: "Preferences",
        description: "Workspace and UI preferences.",
      },
    ],
    []
  );

  const [activeId, setActiveId] = useState(sections[0]?.id ?? "profile");

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />

      <div className="relative z-10 flex w-full">
        <Sidebar />

        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-auto p-8">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Configure your account and workspace.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                <p className="text-xs font-medium text-zinc-400">Status</p>
                <p className="mt-1 text-sm font-semibold text-emerald-300">
                  Ready
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-12">
              <div className="xl:col-span-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2">
                  {sections.map((s) => {
                    const isActive = s.id === activeId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveId(s.id)}
                        className={
                          "w-full rounded-xl px-4 py-3 text-left transition-colors " +
                          (isActive
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-300 hover:bg-zinc-950/40 hover:text-white")
                        }
                      >
                        <div className="text-sm font-semibold">{s.title}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {s.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="xl:col-span-8">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
                  <div className="border-b border-zinc-800 px-6 py-5">
                    <p className="text-sm font-semibold text-white">
                      {sections.find((s) => s.id === activeId)?.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {sections.find((s) => s.id === activeId)?.description}
                    </p>
                  </div>

                  <div className="p-6">
                    {activeId === "profile" && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium text-zinc-300">
                            Display name
                          </label>
                          <input
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-white outline-none focus:border-emerald-500/60"
                            defaultValue="Admin"
                            disabled
                          />
                        </div>

                        <div className="grid gap-2">
                          <label className="text-xs font-medium text-zinc-300">
                            Email
                          </label>
                          <input
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-white outline-none focus:border-emerald-500/60"
                            defaultValue="admin@annam.local"
                            disabled
                          />
                        </div>

                        <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
                          <p className="text-xs font-semibold text-zinc-200">
                            Note
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Profile editing UI is present, but backend wiring for saving
                            changes is not implemented in this codebase yet.
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="h-10 rounded-xl bg-zinc-800 px-4 text-sm font-semibold text-zinc-200 opacity-60"
                            disabled
                          >
                            Save changes
                          </button>
                        </div>
                      </div>
                    )}

                    {activeId === "security" && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium text-zinc-300">
                            Change password
                          </label>
                          <input
                            type="password"
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-white outline-none focus:border-emerald-500/60"
                            placeholder="••••••••"
                            disabled
                          />
                        </div>

                        <div className="grid gap-2">
                          <label className="text-xs font-medium text-zinc-300">
                            Two-factor authentication
                          </label>
                          <input
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-white outline-none focus:border-emerald-500/60"
                            defaultValue="Disabled"
                            disabled
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="h-10 rounded-xl bg-zinc-800 px-4 text-sm font-semibold text-zinc-200 opacity-60"
                            disabled
                          >
                            Update security
                          </button>
                        </div>
                      </div>
                    )}

                    {activeId === "preferences" && (
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <label className="text-xs font-medium text-zinc-300">
                            Theme
                          </label>
                          <select
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-white outline-none focus:border-emerald-500/60"
                            defaultValue="dark"
                            disabled
                          >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                          </select>
                        </div>

                        <div className="grid gap-2">
                          <label className="text-xs font-medium text-zinc-300">
                            Data refresh
                          </label>
                          <select
                            className="h-10 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-white outline-none focus:border-emerald-500/60"
                            defaultValue="8s"
                            disabled
                          >
                            <option value="5s">Every 5s</option>
                            <option value="8s">Every 8s</option>
                            <option value="15s">Every 15s</option>
                          </select>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="h-10 rounded-xl bg-zinc-800 px-4 text-sm font-semibold text-zinc-200 opacity-60"
                            disabled
                          >
                            Save preferences
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}



