"use client";

import { useEffect, useMemo, useState } from "react";

import MouseTracker from "@/components/ui/mouse-tracker";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

type UserRecord = Record<string, unknown>;

const API_URL = "http://127.0.0.1:8000";

function normalizeUsersPayload(payload: unknown): UserRecord[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as UserRecord[];

  // backend might return { users: [...] }
  if (typeof payload === "object" && payload !== null) {
    const maybeUsers = (payload as { users?: unknown }).users;
    if (Array.isArray(maybeUsers)) return maybeUsers as UserRecord[];
  }

  return [];
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/users`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        setUsers(normalizeUsersPayload(data));
      } catch (e) {
        if (cancelled) return;

        const message =
          e instanceof Error ? e.message : "Failed to load users";

        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(() => {
    const first = users[0];
    if (!first) return [] as string[];

    const keys = Object.keys(first);
    const preferred = ["name", "username", "email", "role", "department"];

    return [
      ...preferred.filter((k) => keys.includes(k)),
      ...keys.filter((k) => !preferred.includes(k)),
    ];
  }, [users]);

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
                <h1 className="text-2xl font-bold text-white">Users</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Manage platform users and view their assigned details.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                <p className="text-xs font-medium text-zinc-400">Total</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {loading ? "—" : users.length}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">User Directory</p>
                  <p className="text-xs text-zinc-500">
                    Showing {loading ? "loading…" : users.length} records.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-zinc-500">API</p>
                  <p className="text-xs font-mono text-zinc-300">GET /users</p>
                </div>
              </div>

              <div className="p-6">
                {loading && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                    <div className="animate-pulse text-sm text-zinc-400">
                      Loading users…
                    </div>
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
                    <p className="text-sm font-semibold text-red-200">
                      Failed to load users
                    </p>
                    <p className="mt-1 text-xs text-red-200/80">{error}</p>
                  </div>
                )}

                {!loading && !error && users.length === 0 && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6">
                    <p className="text-sm font-semibold text-white">No users found</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      The backend returned an empty dataset.
                    </p>
                  </div>
                )}

                {!loading && !error && users.length > 0 && (
                  <div className="overflow-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          {columns.length === 0 ? (
                            <th className="w-full py-3 pl-4 text-left text-xs font-medium text-zinc-500">
                              User
                            </th>
                          ) : (
                            columns.map((col) => (
                              <th
                                key={col}
                                className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/60 px-4 py-3 text-left text-xs font-medium text-zinc-400"
                              >
                                {col}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-zinc-950/30 transition-colors"
                          >
                            {columns.length === 0 ? (
                              <td className="border-b border-zinc-800 px-4 py-3 text-sm text-zinc-200">
                                {JSON.stringify(u)}
                              </td>
                            ) : (
                              columns.map((col) => {
                                const v = u[col];
                                return (
                                  <td
                                    key={col}
                                    className="border-b border-zinc-800 px-4 py-3 text-sm text-zinc-200"
                                  >
                                    {v === null || v === undefined ? "—" : String(v)}
                                  </td>
                                );
                              })
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-xs text-zinc-500">
              Tip: This page is read-only for now (based on the existing backend endpoint).
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}



