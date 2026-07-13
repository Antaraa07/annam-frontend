"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KeyRound, User } from "lucide-react";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const inputClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20";

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
    setRole(localStorage.getItem("role") || "");
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />
      <div className="relative z-10 flex w-full">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-auto p-8">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage your account</p>

            <div className="mt-8 max-w-lg space-y-6">

              {/* Account info */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <User size={15} className="text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Account</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">Username</label>
                    <input value={username} readOnly className={`${inputClass} cursor-not-allowed opacity-60`} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">Role</label>
                    <input value={role} readOnly className={`${inputClass} cursor-not-allowed opacity-60 capitalize`} />
                  </div>
                </div>
              </div>

              {/* Change password */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <KeyRound size={15} className="text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Change Password</h2>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">Current password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">New password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">Confirm new password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                      className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
