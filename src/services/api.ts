import { DashboardSummary } from "@/types/dashboard";
import { MOCK_DATA, mockApiCall } from './mock-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getSummary(): Promise<DashboardSummary> {
  try {
    const response = await fetch(
      `${API_URL}/analytics/summary`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch summary: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data for dashboard summary:', error);
    return mockApiCall(MOCK_DATA.summary as DashboardSummary);
  }
}

export async function getOwners() {
  try {
    const response = await fetch(
      `${API_URL}/analytics/owners`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch owners: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data for owners:', error);
    return mockApiCall(MOCK_DATA.owners);
  }
}

export async function getDepartments() {
  try {
    const response = await fetch(
      `${API_URL}/analytics/departments`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch departments: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.warn('API unavailable, using mock data for departments:', error);
    return mockApiCall(MOCK_DATA.departments);
  }
}