"use client";

import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import MouseTracker from "@/components/ui/mouse-tracker";
import UploadForm from "@/components/upload/upload-form";

export default function UploadPage() {
  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <MouseTracker />

      <div className="relative z-10 flex w-full">
        <Sidebar />

        <main className="flex flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-auto p-8">
            <UploadForm />
          </div>
        </main>
      </div>
    </div>
  );
}