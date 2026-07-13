"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const ADMIN_ONLY_PATHS = ["/users"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (pathname === "/login") {
      setAuthorized(true);
      return;
    }

    if (!username) {
      router.push("/login");
      return;
    }

    const isAdminOnly = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
    if (isAdminOnly && role !== "admin") {
      router.push("/");
      return;
    }

    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized && pathname !== "/login") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="text-sm text-zinc-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
