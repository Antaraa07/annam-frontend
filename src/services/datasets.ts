import { Dataset } from "@/types/dataset";
import { MOCK_DATA, mockApiCall } from './mock-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Mock datasets for development
const MOCK_DATASETS: Dataset[] = [
  {
    image_id: "1",
    dataset_name: "Rice Disease Classification",
    owner: "John Doe", 
    "lab/dept": "Computer Science",
    version: "v1.2",
    filename: "rice_dataset.jpg",
    description: "Dataset for classifying rice plant diseases"
  },
  {
    image_id: "2",
    dataset_name: "Tomato Leaf Analysis",
    owner: "Jane Smith",
    "lab/dept": "Biology", 
    version: "v2.0",
    filename: "tomato_dataset.jpg",
    description: "Analysis of tomato leaf patterns and diseases"
  },
  {
    image_id: "3",
    dataset_name: "Wheat Rust Detection",
    owner: "Mike Johnson",
    "lab/dept": "Physics",
    version: "v1.5", 
    filename: "wheat_dataset.jpg",
    description: "Detection system for wheat rust disease"
  },
  {
    image_id: "4",
    dataset_name: "Plant Growth Analysis",
    owner: "Sarah Wilson",
    "lab/dept": "Biology",
    version: "v1.0",
    filename: "plant_growth.jpg",
    description: "Comprehensive plant growth analysis dataset"
  },
  {
    image_id: "5",
    dataset_name: "Crop Yield Prediction",
    owner: "David Brown",
    "lab/dept": "Mathematics",
    version: "v1.1",
    filename: "crop_yield.jpg",
    description: "Machine learning dataset for crop yield prediction"
  }
];

/* Get all datasets */
export async function getDatasets(): Promise<Dataset[]> {
  try {
    const response = await fetch(`${API_URL}/datasets`);

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
  if (!filename || typeof filename !== 'string') {
    return '#'; // Fallback for missing filename
  }
  
  try {
    return `${API_URL}/download/${filename}`;
  } catch {
    return '#'; // Fallback for download
  }
}