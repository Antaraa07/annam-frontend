export interface RecentUpload {
  dataset_name: string;
  owner: string;
  version: string;
  created_at?: string | null;
  department?: string | null;
}

export interface ActiveUsersResponse {
  active_users: number;
  top: Array<{ owner: string; activity_count: number }>;
}

export interface StorageUsageBreakdownItem {
  label: string;
  bytes: number;
  percent: number;
}

export interface StorageUsageResponse {
  used_bytes: number;
  used: string;
  quota_bytes: number;
  quota: string;
  used_pct: number;
  breakdown: StorageUsageBreakdownItem[];
}

