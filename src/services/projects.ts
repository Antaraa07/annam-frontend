import { Project } from "@/types/project";
import { Dataset } from "@/types/dataset";
import { MOCK_DATA, mockApiCall } from "./mock-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Mock project data - dynamically filtered by project ID
const getMockProjectStats = (projectId: string) => ({
  total_images: 4,
  recent_uploads: [
    {
      image_id: `${projectId}_1`,
      dataset_name: `${projectId} Rice Sample 1`,
      owner: "antara",
      "lab/dept": "Computer Science",
      version: "v1.0",
      filename: `${projectId}_rice_1.jpg`,
      description: "Healthy rice leaf sample",
      project_id: projectId,
      label: "healthy",
    },
    {
      image_id: `${projectId}_2`,
      dataset_name: `${projectId} Rice Sample 2`,
      owner: "antara",
      "lab/dept": "Computer Science",
      version: "v1.0",
      filename: `${projectId}_rice_2.jpg`,
      description: "Diseased rice leaf sample",
      project_id: projectId,
      label: "diseased",
    },
  ] as Dataset[],
});

const getMockProjectImages = (projectId: string): Dataset[] => {
  const stats = getMockProjectStats(projectId);

  return [
    ...stats.recent_uploads,

    {
      image_id: `${projectId}_3`,
      dataset_name: `${projectId} Rice Sample 3`,
      owner: "antara",
      "lab/dept": "Computer Science",
      version: "v1.0",
      filename: `${projectId}_rice_3.jpg`,
      description: "Healthy rice leaf sample",
      project_id: projectId,
      label: "healthy",
    },

    {
      image_id: `${projectId}_4`,
      dataset_name: `${projectId} Rice Sample 4`,
      owner: "antara",
      "lab/dept": "Computer Science",
      version: "v1.0",
      filename: `${projectId}_rice_4.jpg`,
      description: "Diseased rice leaf sample",
      project_id: projectId,
      label: "diseased",
    },
  ];
};

export async function createProject(input: {
  name: string;
  description: string;
  label_classes?: string[];
}) {
  const form = new FormData();

  form.append("name", input.name);
  form.append("description", input.description);

  if (input.label_classes) {
    form.append(
      "label_classes",
      JSON.stringify(input.label_classes)
    );
  }

  form.append("username", "antara");

  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to create project: ${res.status} ${text}`
    );
  }

  return (await res.json()) as Project;
}

export async function deleteProject(projectId: string) {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(projectId)}?username=antara`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete project");
  return res.json();
}

export async function listMyProjects() {
  const res = await fetch(
    `${API_URL}/projects?username=antara`
  );

  if (!res.ok) {
    throw new Error("Failed to load projects");
  }

  return res.json() as Promise<Project[]>;
}

export async function getProject(projectId: string) {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(
      projectId
    )}?username=antara`
  );

  if (!res.ok) {
    throw new Error("Failed to load project");
  }

  return res.json() as Promise<Project>;
}

export async function getProjectStats(
  projectId: string
): Promise<{
  total_images: number;
  recent_uploads: Dataset[];
}> {
  try {
    const res = await fetch(
      `${API_URL}/projects/${encodeURIComponent(
        projectId
      )}/stats?username=antara`
    );

    if (!res.ok) {
      throw new Error("Failed to load project stats");
    }

    return res.json();
  } catch (error) {
    console.warn(
      `API unavailable, using mock project stats for ${projectId}:`,
      error
    );

    return mockApiCall(
      getMockProjectStats(projectId)
    );
  }
}

export async function bulkUploadToProject(params: {
  projectId: string;
  files: File[];
  label?: string;
}) {
  const form = new FormData();

  params.files.forEach((f) =>
    form.append("files", f)
  );

  if (params.label !== undefined) {
    form.append("label", params.label);
  }

  form.append("username", "antara");

  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(
      params.projectId
    )}/bulk-upload`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!res.ok) {
    throw new Error("Bulk upload failed");
  }

  return res.json() as Promise<{
    uploaded_count: number;
    files: string[];
  }>;
}

export async function bulkDownloadFromProject(
  projectId: string
): Promise<Blob> {
  try {
    const res = await fetch(
      `${API_URL}/projects/${encodeURIComponent(
        projectId
      )}/bulk-download?username=antara`
    );

    if (!res.ok) {
      throw new Error(
        `Failed to download project files: ${res.status}`
      );
    }

    return res.blob();
  } catch (error) {
    console.warn(
      "Bulk download API unavailable:",
      error
    );

    throw new Error(
      "Bulk download not available"
    );
  }
}

export async function getProjectImages(
  projectId: string
): Promise<Dataset[]> {
  try {
    const res = await fetch(
      `${API_URL}/projects/${encodeURIComponent(
        projectId
      )}/images?username=antara`
    );

    if (!res.ok) {
      throw new Error("Failed to load project images");
    }

    const images = (await res.json()) as Dataset[];

    return images.filter(
      (img) =>
        img.project_id === projectId ||
        img.dataset_name.includes(projectId) ||
        img.filename?.includes(projectId)
    );
  } catch (error) {
    console.warn(
      `API unavailable, using mock project images for ${projectId}:`,
      error
    );

    return mockApiCall(
      getMockProjectImages(projectId)
    );
  }
}