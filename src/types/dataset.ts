export interface Dataset {
  image_id: string;
  filename?: string;

  dataset_name: string;

  owner: string;

  "lab/dept": string;

  version: string;

  description?: string;

  project_id?: string;

  label?: string;
}