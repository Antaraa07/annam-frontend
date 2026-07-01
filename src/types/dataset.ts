export interface Dataset {
  image_id: string;
  filename?: string; // Made optional to handle missing filenames
  dataset_name: string;
  owner: string;
  "lab/dept": string;
  version: string;
  description?: string; // Made optional as it might not always be present

  // Optional metadata fields (existing datasets may omit these)
  project_id?: string;
  label?: string;
}

