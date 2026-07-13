const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { MOCK_DATA, mockApiCall } from './mock-api';

import type {
  ActiveUsersResponse,
  RecentUpload,
  StorageUsageResponse,
} from "@/types/dashboard-v2";

function getUsername(): string {
  return typeof window !== "undefined" ? (localStorage.getItem("username") || "") : "";
}

export async function getRecentUploads(limit: number = 5) {
  try {
    const username = getUsername();
    const params = new URLSearchParams({ limit: String(limit) });
    if (username) params.set("username", username);
    const response = await fetch(`${API_URL}/analytics/recent-uploads?${params}`);

    if (!response.ok) throw new Error(`Failed to fetch recent uploads: ${response.status}`);
    return (await response.json()) as RecentUpload[];
  } catch (error) {
    console.warn('API unavailable, using mock data for recent uploads:', error);
    return mockApiCall(MOCK_DATA.recentUploads.slice(0, limit)) as Promise<RecentUpload[]>;
  }
}

export async function getActiveUsers(windowDays: number = 7, topN: number = 5) {
  try {
    const params = new URLSearchParams({ window_days: String(windowDays), top_n: String(topN) });
    const response = await fetch(`${API_URL}/analytics/active-users?${params}`);

    if (!response.ok) throw new Error(`Failed to fetch active users: ${response.status}`);
    return (await response.json()) as ActiveUsersResponse;
  } catch (error) {
    console.warn('API unavailable, using mock data for active users:', error);
    return mockApiCall({ ...MOCK_DATA.activeUsers, top: MOCK_DATA.activeUsers.top.slice(0, topN) }) as Promise<ActiveUsersResponse>;
  }
}

export async function getStorageUsage() {
  try {
    const response = await fetch(`${API_URL}/analytics/storage-usage`);
    if (!response.ok) throw new Error(`Failed to fetch storage usage: ${response.status}`);
    return (await response.json()) as StorageUsageResponse;
  } catch (error) {
    console.warn('API unavailable, using mock data for storage usage:', error);
    return mockApiCall(MOCK_DATA.storageUsage) as Promise<StorageUsageResponse>;
  }
}
