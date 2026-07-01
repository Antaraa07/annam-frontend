const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { MOCK_DATA, mockApiCall } from './mock-api';

export async function getRecentActivity() {
  try {
    const response = await fetch(
      `${API_URL}/analytics/recent`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch activity: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data for recent activity:', error);
    return mockApiCall(MOCK_DATA.recentActivity);
  }
}