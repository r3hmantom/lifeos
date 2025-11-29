import { StorageService } from "../storage";

// Types based on api.json
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
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  timezone: string;
  updatedAt: string;
}

const BASE_URL = "http://192.168.1.12:8080/api/v1";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await StorageService.getItem<string>(
    StorageService.KEYS.AUTH_TOKEN
  );

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (error) {
    console.error(`API Request Failed: ${endpoint}`, error);
    throw error;
  }
}

export const ApiService = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const response = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await StorageService.setItem(
        StorageService.KEYS.AUTH_TOKEN,
        response.token
      );
      await StorageService.setItem(
        StorageService.KEYS.USER_DATA,
        response.user
      );
      return response;
    },
    register: async (
      name: string,
      email: string,
      password: string
    ): Promise<AuthResponse> => {
      const response = await request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      await StorageService.setItem(
        StorageService.KEYS.AUTH_TOKEN,
        response.token
      );
      await StorageService.setItem(
        StorageService.KEYS.USER_DATA,
        response.user
      );
      return response;
    },
    logout: async () => {
      await StorageService.clearAll();
    },
  },

  memories: {
    getAll: () =>
      request<{ data: Memory[] }>("/memories").then((res) => res.data || []),
    create: (memory: Omit<Memory, "id" | "isActive">) =>
      request<Memory>("/memories", {
        method: "POST",
        body: JSON.stringify(memory),
      }),
    update: (id: string, memory: Partial<Memory>) =>
      request<Memory>(`/memories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(memory),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/memories/${id}`, { method: "DELETE" }),
  },

  goals: {
    getAll: () =>
      request<{ data: Goal[] }>("/goals").then((res) => res.data || []),
    create: (goal: Omit<Goal, "id" | "isActive">) =>
      request<Goal>("/goals", { method: "POST", body: JSON.stringify(goal) }),
    update: (id: string, goal: Partial<Goal>) =>
      request<Goal>(`/goals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(goal),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/goals/${id}`, { method: "DELETE" }),
  },

  schedule: {
    getDaily: (date: string) =>
      request<{ date: string; items: ScheduleItem[] }>(
        `/schedule?date=${date}`
      ),
    create: (item: Omit<ScheduleItem, "id">) =>
      request<ScheduleItem>("/schedule", {
        method: "POST",
        body: JSON.stringify(item),
      }),
    update: (id: string, item: Partial<ScheduleItem>) =>
      request<ScheduleItem>(`/schedule/${id}`, {
        method: "PATCH",
        body: JSON.stringify(item),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/schedule/${id}`, { method: "DELETE" }),
    generate: (data: ScheduleGenerationRequest) =>
      request<{
        message: string;
        schedule: { date: string; items: ScheduleItem[] };
      }>("/schedule/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  settings: {
    get: () => request<UserSettings>("/settings"),
    update: (settings: Partial<UserSettings>) =>
      request<UserSettings>("/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      }),
  },
};
