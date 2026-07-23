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
    // Return success response for mock
    return mockApiCall({ success: true, message: "Dataset deleted (mock)" });
  }
}

/* Image URL */
export function getImageUrl(filename?: string | null) {
  if (!filename) return "/placeholder-image.png";
  if (typeof filename !== 'string') return "/placeholder-image.png";
  
  // Return a placeholder image URL when API is unavailable
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
}

export async function downloadStructured(req: StructuredDownloadRequest): Promise<void> {
  const res = await fetch(`${API_URL}/datasets/download/structured`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(err.detail || "Download failed");
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename=([^;]+)/);
  const filename = match ? match[1] : "annam_export.zip";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}