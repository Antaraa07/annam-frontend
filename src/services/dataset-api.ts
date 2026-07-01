import { Dataset } from "@/types/dataset";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getDatasets(): Promise<Dataset[]> {
  const response = await fetch(
    `${API_URL}/datasets`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch datasets");
  }

  return response.json();
}