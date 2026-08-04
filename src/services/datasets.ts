import { Dataset } from "@/types/dataset";
import { MOCK_DATA, mockApiCall } from './mock-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Mock datasets fallback (empty - no dummy data)
const MOCK_DATASETS: Dataset[] = [];

/* Get all datasets */
export async function getDatasets(): Promise<Dataset[]> {
  try {
    const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
    const isAdmin = role === "admin" || role === "superadmin";
    const url = username && !isAdmin ? `${API_URL}/datasets?username=${username}` : `${API_URL}/datasets`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch datasets");
    }

    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data for datasets:', error);
    return mockApiCall(MOCK_DATASETS);
  }
}

/* Delete dataset */
export async function deleteDataset(
  imageId: string,
  username: string
) {
  try {
    const response = await fetch(
      `${API_URL}/dataset/${imageId}?username=${username}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete dataset");
    }

    return response.json();
  } catch (error) {
    console.warn('API unavailable, simulating dataset deletion:', error);
    return mockApiCall({ success: true, message: "Dataset deleted (mock)" });
  }
}

/* Image URL */
export function getImageUrl(filename?: string | null) {
  if (!filename) return "/placeholder-image.png";
  if (typeof filename !== 'string') return "/placeholder-image.png";
  return `${API_URL}/image/${filename}`;
}

export function getDownloadUrl(filename?: string | null) {
  if (!filename || typeof filename !== 'string') return '#';
  return `${API_URL}/download/${filename}`;
}

export interface StructuredDownloadRequest {
  username?: string;
  group_by: "label" | "category" | "owner" | "dataset_name";
  formats: string[];
  category?: string;
  label?: string;
  owner?: string;
  search?: string;
  project_id?: string;
  source?: string;
  dataset_name?: string;
  limit?: number;
}

export async function downloadStructured(
  req: StructuredDownloadRequest,
  onProgress?: (receivedBytes: number, totalBytes: number | null) => void
): Promise<void> {
  const res = await fetch(`${API_URL}/datasets/download/structured`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(err.detail || "Download failed");
  }

  const contentLengthHeader = res.headers.get("Content-Length");
  const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : null;

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename=([^;]+)/);
  const filename = match ? match[1] : "annam_export.zip";

  if (!res.body) {
    const blob = await res.blob();
    onProgress?.(blob.size, blob.size);
    triggerDownload(blob, filename);
    return;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      receivedBytes += value.length;
      onProgress?.(receivedBytes, totalBytes);
    }
  }

  onProgress?.(receivedBytes, totalBytes ?? receivedBytes);
  const blob = new Blob(chunks as BlobPart[], { type: "application/zip" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildDownloadUrl(req: StructuredDownloadRequest): string {
  const params = new URLSearchParams();
  if (req.username) params.set("username", req.username);
  if (req.group_by) params.set("group_by", req.group_by);
  if (req.formats) params.set("formats", req.formats.join(","));
  if (req.category) params.set("category", req.category);
  if (req.label) params.set("label", req.label);
  if (req.owner) params.set("owner", req.owner);
  if (req.search) params.set("search", req.search);
  if (req.project_id) params.set("project_id", req.project_id);
  if (req.source) params.set("source", req.source);
  if (req.dataset_name) params.set("dataset_name", req.dataset_name);
  if (req.limit) params.set("limit", req.limit.toString());

  return `${API_URL}/datasets/download/structured?${params.toString()}`;
}

export function triggerDirectDownload(req: StructuredDownloadRequest): void {
  const url = buildDownloadUrl(req);
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export interface DeletionRequest {
  request_id: string;
  target_type: "folder" | "image";
  target_id: string;
  requested_by: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
}

export async function createDeletionRequest(target_type: "folder" | "image", target_id: string, requested_by: string): Promise<any> {
  const res = await fetch(`${API_URL}/datasets/deletion-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_type, target_id, requested_by }),
  });
  return res.json();
}

export async function getDeletionRequests(): Promise<DeletionRequest[]> {
  try {
    const res = await fetch(`${API_URL}/datasets/deletion-requests`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function approveDeletionRequest(request_id: string, user_role: string): Promise<any> {
  const res = await fetch(`${API_URL}/datasets/deletion-request/${request_id}/approve`, {
    method: "POST",
    headers: { "X-User-Role": user_role },
  });
  return res.json();
}

export async function rejectDeletionRequest(request_id: string, user_role: string): Promise<any> {
  const res = await fetch(`${API_URL}/datasets/deletion-request/${request_id}/reject`, {
    method: "POST",
    headers: { "X-User-Role": user_role },
  });
  return res.json();
}

export async function downloadRawImagesZip(dataset_name?: string, category?: string): Promise<void> {
  await downloadStructured({
    group_by: "category",
    formats: ["zip"], // ONLY zip containing images
    dataset_name,
    category,
    source: "raw",
  });
}