export interface Project {
  project_id: string;
  name: string;
  description: string;
  owner: string;
  created_at: string;
  label_classes?: string[];
  assigned_users?: string[];
}

