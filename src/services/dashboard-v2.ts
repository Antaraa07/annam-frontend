const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { MOCK_DATA, mockApiCall } from './mock-api';

import type {
  ActiveUsersResponse,
  RecentUpload,
  StorageUsageResponse,
} from "@/types/dashboard-v2";

export async function getRecentUploads(limit: number = 5) {
  try {
    const response = await fetch(
      `${API_URL}/analytics/recent-uploads?limit=${encodeURIComponent(
        String(limit)
      )}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch recent uploads: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as RecentUpload[];
  } catch (error) {
    console.warn('API unavailable, using mock data for recent uploads:', error);
    return mockApiCall(MOCK_DATA.recentUploads.slice(0, limit)) as Promise<RecentUpload[]>;
  }
}

export async function getActiveUsers(
  windowDays: number = 7,
  topN: number = 5
) {
  try {
    const response = await fetch(
      `${API_URL}/analytics/active-users?window_days=${encodeURIComponent(
        String(windowDays)
      )}&top_n=${encodeURIComponent(String(topN))}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch active users: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as ActiveUsersResponse;
  } catch (error) {
    console.warn('API unavailable, using mock data for active users:', error);
    const mockUsers = {
      ...MOCK_DATA.activeUsers,
      top: MOCK_DATA.activeUsers.top.slice(0, topN)
    };
    return mockApiCall(mockUsers) as Promise<ActiveUsersResponse>;
  }
}

export async function getStorageUsage() {
  try {
    const response = await fetch(`${API_URL}/analytics/storage-usage`);

    if (!response.ok) {
      throw new Error(`Failed to fetch storage usage: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as StorageUsageResponse;
  } catch (error) {
    console.warn('API unavailable, using mock data for storage usage:', error);
    return mockApiCall(MOCK_DATA.storageUsage) as Promise<StorageUsageResponse>;
  }
}

