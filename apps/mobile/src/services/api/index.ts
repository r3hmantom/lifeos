import { StorageService } from '../storage';

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
  priority: 'High' | 'Medium' | 'Low';
  isActive: boolean;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'fixed_commitment' | 'goal_task' | 'routine' | 'other';
  relatedId?: string;
  isCompleted: boolean;
}

const MOCK_DELAY = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ApiService = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      await delay(MOCK_DELAY);
      // Mock login
      if (email === 'test@example.com' && password === 'password') {
        const user = {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        };
        const token = 'mock-jwt-token';
        await StorageService.setItem(StorageService.KEYS.AUTH_TOKEN, token);
        await StorageService.setItem(StorageService.KEYS.USER_DATA, user);
        return { user, token };
      }
      throw new Error('Invalid credentials');
    },
    register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
      await delay(MOCK_DELAY);
      const user = {
        id: Date.now().toString(),
        email,
        name,
      };
      const token = 'mock-jwt-token';
      await StorageService.setItem(StorageService.KEYS.AUTH_TOKEN, token);
      await StorageService.setItem(StorageService.KEYS.USER_DATA, user);
      return { user, token };
    },
    logout: async () => {
      await StorageService.clearAll();
    }
  },

  memories: {
    getAll: async (): Promise<Memory[]> => {
      await delay(MOCK_DELAY);
      const stored = await StorageService.getItem<Memory[]>('MOCK_MEMORIES');
      return stored || [];
    },
    create: async (memory: Omit<Memory, 'id' | 'isActive'>): Promise<Memory> => {
      await delay(MOCK_DELAY);
      const newMemory: Memory = {
        ...memory,
        id: Date.now().toString(),
        isActive: true,
      };
      const current = await ApiService.memories.getAll();
      await StorageService.setItem('MOCK_MEMORIES', [newMemory, ...current]);
      await StorageService.setItem(StorageService.KEYS.HAS_CREATED_MEMORY, true);
      return newMemory;
    }
  },

  goals: {
    getAll: async (): Promise<Goal[]> => {
      await delay(MOCK_DELAY);
      const stored = await StorageService.getItem<Goal[]>('MOCK_GOALS');
      return stored || [];
    },
    create: async (goal: Omit<Goal, 'id' | 'isActive'>): Promise<Goal> => {
      await delay(MOCK_DELAY);
      const newGoal: Goal = {
        ...goal,
        id: Date.now().toString(),
        isActive: true,
      };
      const current = await ApiService.goals.getAll();
      await StorageService.setItem('MOCK_GOALS', [newGoal, ...current]);
      await StorageService.setItem(StorageService.KEYS.HAS_CREATED_GOAL, true);
      return newGoal;
    }
  },

  schedule: {
    getDaily: async (date: string): Promise<{ date: string, items: ScheduleItem[] }> => {
      await delay(MOCK_DELAY);
      const stored = await StorageService.getItem<ScheduleItem[]>('MOCK_SCHEDULE');
      return {
        date,
        items: stored || []
      };
    },
    generate: async (): Promise<{ message: string, schedule: { date: string, items: ScheduleItem[] } }> => {
      await delay(MOCK_DELAY * 2); // AI takes longer
      
      // Generate mock schedule based on existing memories and goals
      const memories = await ApiService.memories.getAll();
      const goals = await ApiService.goals.getAll();
      
      const scheduleItems: ScheduleItem[] = [];
      const today = new Date().toISOString().split('T')[0];

      // Convert memories to schedule items
      memories.forEach((m, i) => {
        scheduleItems.push({
          id: `sch_mem_${i}`,
          title: m.title,
          description: m.description,
          startTime: `${today}T09:00:00`, // Mock time
          endTime: `${today}T10:00:00`,
          type: 'fixed_commitment',
          relatedId: m.id,
          isCompleted: false
        });
      });

      // Convert goals to schedule items
      goals.forEach((g, i) => {
         scheduleItems.push({
          id: `sch_goal_${i}`,
          title: `Work on: ${g.title}`,
          description: g.focus,
          startTime: `${today}T14:00:00`, // Mock time
          endTime: `${today}T15:00:00`,
          type: 'goal_task',
          relatedId: g.id,
          isCompleted: false
        });
      });

      await StorageService.setItem('MOCK_SCHEDULE', scheduleItems);
      await StorageService.setItem(StorageService.KEYS.SCHEDULE_GENERATED, true);

      return {
        message: "Schedule generated successfully",
        schedule: {
          date: today,
          items: scheduleItems
        }
      };
    }
  }
};

