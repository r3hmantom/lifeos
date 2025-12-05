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

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: any;
  createdAt?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  chatId?: string;
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
    | "schedule_modified"
    | "goal_proposed"
    | "memory_proposed"
    | "clarification_needed";
  data?: {
    schedule?: Array<{
      title: string;
      description?: string;
      startTime: string; // HH:mm format
      endTime: string; // HH:mm format
      type: string;
    }>;
    modifications?: any[];
    goal?: any;
    memory?: any;
  };
  chatId?: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface ProposedScheduleItem {
  title: string;
  description?: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: string;
}

export interface InsightMetrics {
  productivityScore: number;
  categoryDistribution: Record<string, number>;
  completedTasks: number;
  totalTasks: number;
}

// const BASE_URL = "https://lifeos-backend-production.up.railway.app/api/v1";
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
    console.log("request", `${BASE_URL}${endpoint}`);
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
    batchCreate: (data: { date: string; items: Omit<ScheduleItem, "id">[] }) =>
      request<{ message: string; count: number }>("/schedule/batch", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  assistant: {
    chat: (data: ChatRequest) =>
      request<ChatResponse>("/assistant/chat", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getChats: (limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (offset) params.append("offset", offset.toString());
      const queryString = params.toString();
      return request<{ chats: Chat[] }>(
        `/assistant/chats${queryString ? `?${queryString}` : ""}`
      ).then((res) => res.chats || []);
    },
    getChatMessages: (chatId: string, limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());
      if (offset) params.append("offset", offset.toString());
      const queryString = params.toString();
      return request<{ chatId: string; messages: ChatMessage[] }>(
        `/assistant/chats/${chatId}${queryString ? `?${queryString}` : ""}`
      );
    },
    createChat: (title?: string) =>
      request<Chat>("/assistant/chats", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    updateChat: (chatId: string, title: string) =>
      request<Chat>(`/assistant/chats/${chatId}`, {
        method: "PUT",
        body: JSON.stringify({ title }),
      }),
    deleteChat: (chatId: string) =>
      request<{ message: string }>(`/assistant/chats/${chatId}`, {
        method: "DELETE",
      }),
  },

  insights: {
    get: (startDate?: string, endDate?: string) => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const queryString = params.toString();
      return request<InsightMetrics>(
        `/insights${queryString ? `?${queryString}` : ""}`
      );
    },
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
