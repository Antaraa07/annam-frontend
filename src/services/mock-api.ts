// Mock API service - returns empty data when backend is unavailable
export const MOCK_DATA = {
  summary: {
    datasets: 0,
    owners: 0,
    departments: 0,
    storage: "0 B"
  },
  owners: [],
  departments: [],
  recentActivity: [],
  recentUploads: [],
  activeUsers: {
    active_users: 0,
    top: []
  },
  storageUsage: {
    used_bytes: 0,
    used: "0 B",
    quota_bytes: 10737418240,
    quota: "10 GB",
    used_pct: 0,
    breakdown: []
  }
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function mockApiCall<T>(data: T, delayMs: number = 300): Promise<T> {
  await delay(delayMs);
  return JSON.parse(JSON.stringify(data)); // Deep clone to prevent mutations
}