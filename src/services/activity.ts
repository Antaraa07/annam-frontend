const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { MOCK_DATA, mockApiCall } from './mock-api';

export async function getRecentActivity() {
  try {
    const username = typeof window !== "undefined" ? localStorage.getItem("username") : null;
    const params = username ? `?username=${encodeURIComponent(username)}` : "";
    const response = await fetch(`${API_URL}/analytics/recent-uploads${params}`);

    if (!response.ok) throw new Error(`Failed to fetch activity: ${response.status}`);
    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data for recent activity:', error);
    return mockApiCall(MOCK_DATA.recentActivity);
  }
}
