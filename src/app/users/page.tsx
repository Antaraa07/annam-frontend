"use client";

import { useState } from "react";
import { UserPlus, Trash2, RefreshCw, X, Eye, EyeOff, ShieldCheck, FlaskConical, GraduationCap, Briefcase, Crown, Ban } from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import { usePolling } from "@/hooks/usePolling";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ROLES = ["superadmin", "admin", "researcher", "student", "intern"] as const;
type Role = typeof ROLES[number];

interface User { username: string; role: Role; }

const ROLE_META: Record<Role, { label: string; color: string; icon: React.ElementType }> = {
  superadmin: { label: "Superadmin", color: "bg-violet-500/15 text-violet-300 border-violet-500/30", icon: Crown },
  admin:      { label: "Admin",      color: "bg-violet-500/15 text-violet-300 border-violet-500/30",  icon: ShieldCheck },
  researcher: { label: "Researcher", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: FlaskConical },
  student:    { label: "Student",    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",       icon: GraduationCap },
  intern:     { label: "Intern",     color: "bg-amber-500/15 text-amber-300 border-amber-500/30",    icon: Briefcase },
};

function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role] ?? ROLE_META.student;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.color}`}>
      <Icon size={11} /> {m.label}
    </span>
  );
}

function Avatar({ username }: { username: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-white uppercase">
      {username.slice(0, 2)}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // current logged-in user role & username (read once from localStorage)
  const [currentUserRole] = useState<string>(() =>
    typeof window === "undefined" ? "" : localStorage.getItem("role") || ""
  );
  const [currentUsername] = useState<string>(() =>
    typeof window === "undefined" ? "" : localStorage.getItem("username") || ""
  );

  // create form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole]         = useState<Role>("researcher");
  const [showPw, setShowPw]           = useState(false);
  const [creating, setCreating]       = useState(false);
  const [formError, setFormError]     = useState("");

  async function load() {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      // silently keep previous state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  usePolling(load);

  function handleRefresh() { setRefreshing(true); load(); }

  async function handleCreate() {
    setFormError("");
    if (!newUsername.trim()) { setFormError("Username is required."); return; }
    if (newPassword.length < 6) { setFormError("Password must be at least 6 characters."); return; }
    if (currentUserRole === "admin" && (newRole === "admin" || newRole === "superadmin")) {
      setFormError("Admins can only create Researcher, Student, or Intern accounts.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": currentUserRole,
          "X-User-Name": currentUsername,
        },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.detail || "Failed to create user."); return; }
      setUsers((prev) => [...prev, { username: newUsername.trim(), role: newRole }]);
      setModalOpen(false);
      setNewUsername(""); setNewPassword(""); setNewRole("researcher"); setShowPw(false);
    } catch {
      setFormError("Network error.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(targetUsername: string, role: Role) {
    if (currentUserRole === "admin") {
      const targetUser = users.find((u) => u.username === targetUsername);
      if (targetUser?.role === "admin" || targetUser?.role === "superadmin" || targetUsername === currentUsername) {
        alert("Permission denied: Admins cannot change their own role or other Admin/Superadmin roles.");
        return;
      }
      if (role === "admin" || role === "superadmin") {
        alert("Permission denied: Admins cannot promote users to Admin or Superadmin.");
        return;
      }
    }
    const res = await fetch(`${API_URL}/users/${targetUsername}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-User-Role": currentUserRole,
        "X-User-Name": currentUsername,
      },
      body: JSON.stringify({ role }),
    });
    if (res.ok) setUsers((prev) => prev.map((u) => u.username === targetUsername ? { ...u, role } : u));
    else {
      const errData = await res.json().catch(() => ({ detail: "Role update failed" }));
      alert(errData.detail || "Failed to update role");
    }
  }

  async function handleDelete(targetUsername: string, targetRole: Role) {
    if (currentUserRole === "admin" && targetRole !== "intern") {
      alert("Permission denied: Admins can only delete Intern accounts.");
      return;
    }
    if (currentUserRole !== "superadmin" && currentUserRole !== "admin") {
      alert("Permission denied: Only Superadmin and Admin can delete accounts.");
      return;
    }
    if (!confirm(`Delete user "${targetUsername}"? This cannot be undone.`)) return;
    const res = await fetch(`${API_URL}/users/${targetUsername}`, {
      method: "DELETE",
      headers: {
        "X-User-Role": currentUserRole,
        "X-User-Name": currentUsername,
      },
    });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.username !== targetUsername));
    else {
      const errData = await res.json().catch(() => ({ detail: "Delete failed" }));
      alert(errData.detail || "Failed to delete user");
    }
  }

  // Determine allowed roles for modal creation based on user role
  const availableCreateRoles = currentUserRole === "admin"
    ? ROLES.filter((r) => r !== "superadmin" && r !== "admin")
    : ROLES;

  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-8">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Users</h1>
                <p className="text-zinc-200">Manage platform accounts and roles</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
                {(currentUserRole === "superadmin" || currentUserRole === "admin") && (
                  <button
                    onClick={() => { setFormError(""); setModalOpen(true); }}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                  >
                    <UserPlus size={15} />
                    Create User
                  </button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="mb-6 grid grid-cols-5 gap-4">
              {ROLES.map((r) => {
                const m = ROLE_META[r];
                const count = users.filter((u) => u.role === r).length;
                const Icon = m.icon;
                return (
                  <div key={r} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${m.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-300">{m.label}s</p>
                      <p className="text-xl font-bold text-white">{loading ? "—" : count}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800">
                    {(currentUserRole === "superadmin"
                      ? ["User", "Role", "Change Role", "Actions"]
                      : ["User", "Role", "Actions"]
                    ).map((h) => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-200 ${h === "Actions" ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={currentUserRole === "superadmin" ? 4 : 3} className="py-16 text-center text-sm text-zinc-300">Loading…</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={currentUserRole === "superadmin" ? 4 : 3} className="py-16 text-center text-sm text-zinc-300">No users found.</td></tr>
                  ) : users.map((u) => {
                    const isSelf = u.username === currentUsername;
                    const isTargetAdmin = u.role === "admin" || u.role === "superadmin";

                    // Determine if role can be modified
                    const canModifyRole = currentUserRole === "superadmin";

                    // Determine if user can be deleted
                    const canDelete = currentUserRole === "superadmin"
                      ? (!isSelf)
                      : currentUserRole === "admin"
                        ? (u.role === "intern")
                        : false;

                    return (
                      <tr key={u.username} className="border-b border-zinc-800 transition hover:bg-zinc-800/40">
                        {/* User */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar username={u.username} />
                            <span className="font-medium text-white">{u.username}</span>
                            {isSelf && (
                              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">You</span>
                            )}
                          </div>
                        </td>

                        {/* Role badge */}
                        <td className="px-5 py-3"><RoleBadge role={u.role} /></td>

                        {/* Role change - ONLY for superadmin */}
                        {currentUserRole === "superadmin" && (
                          <td className="px-5 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.username, e.target.value as Role)}
                              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{ROLE_META[r].label}</option>
                              ))}
                            </select>
                          </td>
                        )}

                        {/* Delete */}
                        <td className="px-5 py-3 text-right">
                          {canDelete ? (
                            <button
                              onClick={() => handleDelete(u.username, u.role)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-500 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          ) : (
                            <div className="flex justify-end">
                              <div
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-500/40 bg-red-500/15 text-red-400 cursor-not-allowed shadow-sm transition-transform hover:scale-105"
                                title={
                                  currentUserRole === "admin"
                                    ? "Action prohibited: Admins can only delete Intern accounts"
                                    : "Action prohibited: Only Superadmin can delete accounts"
                                }
                              >
                                <Ban size={15} />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
      </div>
      {/* Create User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Create User</h2>
              <button onClick={() => setModalOpen(false)} className="text-zinc-300 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-200">Username</label>
                <input
                  type="text"
                  placeholder="e.g. researcher2"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-200">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-300"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-300">Share this password with the user — they can change it from Settings.</p>
              </div>

              {/* Role */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-200">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableCreateRoles.map((r) => {
                    const m = ROLE_META[r];
                    const Icon = m.icon;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewRole(r)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors ${
                          newRole === r
                            ? `${m.color} border-current`
                            : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600"
                        }`}
                      >
                        <Icon size={16} />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </div>
        )}
    </AppShell>
  );
}
