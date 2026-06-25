const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Analysis = {
  id: string;
  image_url: string;
  overlay_url: string;
  annotated_image_url: string;
  segmentation_mask_urls: string[];
  bounding_boxes: {
    label: string;
    confidence: number;
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  }[];
  prediction: string;
  confidence: number;
  modality: string;
  explanation: string;
  engine: Record<string, string>;
  created_at: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type BatchUploadItem = {
  upload_id: string;
  image_url: string;
  filename: string;
};

export type FindingExplanation = {
  finding: string;
  confidence_percentage: number;
  modality: string;
  location: string | null;
  possible_meaning: string;
  general_symptoms: string[];
  questions_to_ask_physician: string[];
  recommended_follow_up: string[];
  urgent_warning_signs: string[];
  disclaimer: string;
};

export type MemoryClearSummary = {
  cleared_analyses: number;
  cleared_chat_messages: number;
  deleted_files: number;
  cleared_pending_uploads: number;
};

export type Me = {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  analysis_count: number;
  last_active: string | null;
};

export type AdminOverview = {
  total_users: number;
  total_analyses: number;
  total_chat_messages: number;
  users: AdminUserRow[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("oncovision_token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error(`Cannot reach the backend API at ${API_URL}. Make sure FastAPI is running on port 8000.`);
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  register: (name: string, email: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/api/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    }),
  googleLogin: (credential: string) =>
    request<{ access_token: string; token_type: string }>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential })
    }),
  upload: (file: File, modality: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("modality", modality);
    return request<{ upload_id: string; image_url: string }>("/api/upload", { method: "POST", body: formData });
  },
  uploadBatch: (files: File[], modality: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("modality", modality);
    return request<{ uploads: BatchUploadItem[] }>("/api/upload/batch", { method: "POST", body: formData });
  },
  predict: (uploadId: string) =>
    request<Analysis>("/api/predict", { method: "POST", body: JSON.stringify({ upload_id: uploadId }) }),
  predictBatch: (uploadIds: string[]) =>
    request<Analysis[]>("/api/predict/batch", { method: "POST", body: JSON.stringify({ upload_ids: uploadIds }) }),
  history: () => request<Analysis[]>("/api/history"),
  chat: (message: string, history: ChatMessage[], analysisId: string) =>
    request<{ reply: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, history, analysis_id: analysisId })
    }),
  clearMemory: () => request<MemoryClearSummary>("/api/memory", { method: "DELETE" }),
  me: () => request<Me>("/api/me"),
  adminOverview: () => request<AdminOverview>("/api/admin/overview")
};
