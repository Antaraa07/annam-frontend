"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MouseTracker from "@/components/ui/mouse-tracker";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Invalid credentials");
      }

      const data = await res.json();
      localStorage.setItem("username", data.username);
      localStorage.setItem("role", data.role);

      toast.success("Successfully logged in!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-4">
      <MouseTracker />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl backdrop-blur-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_3px_rgba(52,211,153,0.6)] animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white">ANNAM</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">Storage Platform Console</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              disabled={loading}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(52,211,153,0.15)]"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
            ) : (
              "Log In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
