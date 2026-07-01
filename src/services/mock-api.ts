// Mock API service for development when backend is unavailable
export const MOCK_DATA = {
  summary: {
    datasets: 42,
    owners: 8,
    departments: 5,
    storage: "2.3 GB"
  },

  owners: [
    { owner: "John Doe", dataset_count: 12 },
    { owner: "Jane Smith", dataset_count: 8 },
    { owner: "Mike Johnson", dataset_count: 7 },
    { owner: "Sarah Wilson", dataset_count: 6 },
    { owner: "David Brown", dataset_count: 5 },
    { owner: "Lisa Davis", dataset_count: 4 }
  ],

  departments: [
    { department: "Computer Science", dataset_count: 15 },
    { department: "Pest", dataset_count: 12 },
    { department: "Disease", dataset_count: 8 },
    { department: "Plant", dataset_count: 7 },
    { department: "insects", dataset_count: 5 }
  ],

  recentActivity: [
    { dataset_name: "Rice Disease Classification", owner: "John Doe", version: "v1.2" },
    { dataset_name: "Tomato Leaf Analysis", owner: "Jane Smith", version: "v2.0" },
    { dataset_name: "Wheat Rust Detection", owner: "Mike Johnson", version: "v1.5" },
    { dataset_name: "Plant Growth Dataset", owner: "Sarah Wilson", version: "v1.0" },
    { dataset_name: "Crop Yield Prediction", owner: "David Brown", version: "v1.1" }
  ],

  recentUploads: [
    {
      dataset_name: "New Rice Dataset",
      owner: "John Doe",
      version: "v1.0",
      created_at: new Date().toISOString(),
      department: "Computer Science"
    },
    {
      dataset_name: "Tomato Disease Images",
      owner: "Jane Smith",
      version: "v1.1",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      department: "Biology"
    },
    {
      dataset_name: "Wheat Classification",
      owner: "Mike Johnson",
      version: "v1.0",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      department: "Physics"
    }
  ],

  activeUsers: {
    active_users: 25,
    top: [
      { owner: "john_doe", activity_count: 25 },
      { owner: "jane_smith", activity_count: 18 },
      { owner: "mike_johnson", activity_count: 12 },
      { owner: "sarah_wilson", activity_count: 9 },
      { owner: "david_brown", activity_count: 7 }
    ]
  },

  storageUsage: {
    used_bytes: 2469606195,
    used: "2.3 GB",
    quota_bytes: 10737418240,
    quota: "10 GB",
    used_pct: 23,
    breakdown: [
      { label: "Images", bytes: 1975684956, percent: 80 },
      { label: "Metadata", bytes: 246960620, percent: 10 },
      { label: "Cache", bytes: 123480310, percent: 5 },
      { label: "Other", bytes: 123480309, percent: 5 }
    ]
  }
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function mockApiCall<T>(data: T, delayMs: number = 300): Promise<T> {
  await delay(delayMs);
  return JSON.parse(JSON.stringify(data)); // Deep clone to prevent mutations
}