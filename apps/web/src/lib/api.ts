import axios from "axios";

// Types based on apidocs.json

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  isActive: boolean;
}

export interface Goal {
  id: string;
  title: string;
  focus: string;
  deadline: string;
  priority: "High" | "Medium" | "Low";
  isActive: boolean;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: string;
  relatedId?: string;
  isCompleted: boolean;
}

export interface ScheduleGenerationRequest {
  timezone: string;
  date: string;
  preferences?: {
    startOfDay?: string;
    endOfDay?: string;
  };
  goalIds?: string[];
  memoryIds?: string[];
  customPrompt?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context?: {
    date?: string;
    timezone?: string;
    selectedGoalIds?: string[];
    selectedMemoryIds?: string[];
  };
}

export interface ChatResponse {
  message: string;
  intent:
    | "chat"
    | "schedule_generated"
    | "clarification_needed"
    | "schedule_modified";
  data?: any;
}

export interface BatchScheduleRequest {
  date: string;
  items: ScheduleItem[];
  metadata?: any;
}

export interface InsightMetrics {
  productivityScore: number;
  categoryDistribution: Record<string, number>;
  completedTasks: number;
  totalTasks: number;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  timezone: string;
  updatedAt: string;
}

export interface TimetableSlot {
  id: string;
  userId: string;
  time: string;
  activity: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Client

// const API_URL = "https://lifeos-backend-production.up.railway.app/api/v1";
const API_URL = "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  register: (data: any) => api.post<AuthResponse>("/auth/register", data),
  login: (data: any) => api.post<AuthResponse>("/auth/login", data),
};

export const goalsApi = {
  getAll: () => api.get<{ data: Goal[] }>("/goals"),
  create: (data: Omit<Goal, "id" | "isActive">) =>
    api.post<Goal>("/goals", data),
  update: (id: string, data: Partial<Goal>) =>
    api.patch<Goal>(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
};

export const memoriesApi = {
  getAll: () => api.get<{ data: Memory[] }>("/memories"),
  create: (data: Omit<Memory, "id" | "isActive">) =>
    api.post<Memory>("/memories", data),
  update: (id: string, data: Partial<Memory>) =>
    api.patch<Memory>(`/memories/${id}`, data),
  delete: (id: string) => api.delete(`/memories/${id}`),
};

export const scheduleApi = {
  get: (date: string) =>
    api.get<{ date: string; items: ScheduleItem[] }>("/schedule", {
      params: { date },
    }),
  create: (data: Omit<ScheduleItem, "id" | "isCompleted">) =>
    api.post<ScheduleItem>("/schedule", data),
  update: (id: string, data: Partial<ScheduleItem>) =>
    api.patch<ScheduleItem>(`/schedule/${id}`, data),
  delete: (id: string) => api.delete(`/schedule/${id}`),
  generate: (data: ScheduleGenerationRequest) =>
    api.post<{
      message: string;
      schedule: { date: string; items: ScheduleItem[] } | ScheduleItem[];
    }>("/schedule/generate", data),
  batchCreate: (data: BatchScheduleRequest) =>
    api.post("/schedule/batch", data),
};

export const assistantApi = {
  chat: (data: ChatRequest) => api.post<ChatResponse>("/assistant/chat", data),
};

export const insightsApi = {
  get: (startDate?: string, endDate?: string) =>
    api.get<InsightMetrics>("/insights", { params: { startDate, endDate } }),
};

export const settingsApi = {
  get: () => api.get<UserSettings>("/settings"),
  update: (data: Partial<UserSettings>) =>
    api.patch<UserSettings>("/settings", data),
};

export const userApi = {
  get: () => api.get<User>("/auth/me"),
  update: (data: { name: string }) => api.patch<User>("/auth/profile", data),
};

export default api;
