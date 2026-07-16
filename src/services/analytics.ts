const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import { MOCK_DATA, mockApiCall } from './mock-api';

export async function getSummary(username?: string) {
  try {
    const params = username ? `?username=${encodeURIComponent(username)}` : "";
    const response = await fetch(
      `${API_URL}/analytics/summary${params}`
    );

    if (!response.ok)
      throw new Error(`Failed to fetch summary: ${response.status} ${response.statusText}`);

    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data for summary:', error);
    return mockApiCall(MOCK_DATA.summary);
  }
}

export async function getOwners() {
  try {
    const response = await fetch(
      `${API_URL}/analytics/owners`
    );

    if (!response.ok)
      throw new Error(`Failed to fetch owners: ${response.status} ${response.statusText}`);

    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data for owners:', error);
    return mockApiCall(MOCK_DATA.owners);
  }
}

export async function getDepartments(username?: string) {
  try {
    const params = username ? `?username=${encodeURIComponent(username)}` : "";
    const response = await fetch(
      `${API_URL}/analytics/departments${params}`
    );

    if (!response.ok)
      throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);

    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data for departments:', error);
    return mockApiCall(MOCK_DATA.departments);
  }
}