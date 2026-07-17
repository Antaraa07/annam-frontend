import { Project } from "@/types/project";
import { Dataset } from "@/types/dataset";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getUsername(): string {
  return typeof window !== "undefined" ? (localStorage.getItem("username") || "") : "";
}

export async function createProject(input: {
  name: string;
  description: string;
  label_classes?: string[];
}) {
  const form = new FormData();
  form.append("name", input.name);
  form.append("description", input.description);
  if (input.label_classes) form.append("label_classes", JSON.stringify(input.label_classes));
  form.append("username", getUsername());

  const res = await fetch(`${API_URL}/projects`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
  return (await res.json()) as Project;
}

export async function deleteProject(projectId: string) {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(projectId)}?username=${getUsername()}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete project");
  return res.json();
}

export async function listMyProjects() {
  const res = await fetch(`${API_URL}/projects?username=${getUsername()}`);
  if (!res.ok) throw new Error("Failed to load projects");
  return res.json() as Promise<Project[]>;
}

export async function listAssignedProjects() {
  const res = await fetch(`${API_URL}/my-projects?username=${getUsername()}`);
  if (!res.ok) throw new Error("Failed to load assigned projects");
  return res.json() as Promise<Project[]>;
}

export async function getProject(projectId: string) {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(projectId)}?username=${getUsername()}`
  );
  if (!res.ok) throw new Error("Failed to load project");
  return res.json() as Promise<Project>;
}

export async function assignUser(projectId: string, assignUsername: string) {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(projectId)}/assign?username=${getUsername()}&assign_username=${encodeURIComponent(assignUsername)}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to assign user");
  return res.json();
}

export async function unassignUser(projectId: string, assignUsername: string) {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(projectId)}/assign?username=${getUsername()}&assign_username=${encodeURIComponent(assignUsername)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to unassign user");
  return res.json();
}

export async function getProjectStats(projectId: string): Promise<{
  total_images: number;
  recent_uploads: Dataset[];
  label_counts?: Record<string, number>;
}> {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(projectId)}/stats?username=${getUsername()}`
  );
  if (!res.ok) throw new Error("Failed to load project stats");
  return res.json();
}

export async function bulkUploadToProject(params: {
  projectId: string;
  files: File[];
}) {
  const form = new FormData();
  params.files.forEach((f) => form.append("files", f));
  form.append("username", getUsername());

  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(params.projectId)}/bulk-upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) throw new Error("Bulk upload failed");
  return res.json() as Promise<{ uploaded_count: number; files: string[] }>;
}

export async function updateProjectStatus(projectId: string, status: string) {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(projectId)}/status?status=${encodeURIComponent(status)}&username=${encodeURIComponent(getUsername())}`,
    { method: "PATCH" }
  );
  if (!res.ok) throw new Error("Failed to update project status");
  return res.json() as Promise<Project>;
}

export async function bulkDownloadFromProject(projectId: string): Promise<Blob | null> {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(projectId)}/bulk-download?username=${getUsername()}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
  return res.blob();
}

export async function getProjectImages(projectId: string, page?: number, limit?: number): Promise<Dataset[]> {
  const url = new URL(`${API_URL}/projects/${encodeURIComponent(projectId)}/images`);
  url.searchParams.append("username", getUsername());
  if (page !== undefined) url.searchParams.append("page", String(page));
  if (limit !== undefined) url.searchParams.append("limit", String(limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load project images");
  return res.json();
}
