"use client";

import AppShell from "@/components/layout/app-shell";
import UploadForm from "@/components/upload/upload-form";

export default function UploadPage() {
  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-8">
        <UploadForm />
      </div>
    </AppShell>
  );
}