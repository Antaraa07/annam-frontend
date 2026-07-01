export interface UploadFormData {
  username: string;
  dataset_name: string;
  owner: string;
  lab_dept: string;
  version: string;
  description: string;
  file: File | null;
}