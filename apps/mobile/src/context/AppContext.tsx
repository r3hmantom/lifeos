import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiService, User } from '../services/api';
import { StorageService } from '../services/storage';

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCreatedMemory: boolean;
  hasCreatedGoal: boolean;
  isScheduleGenerated: boolean;
  insightsRefreshTrigger: number;
  scheduleRefreshTrigger: number;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkState: () => Promise<void>;
  refreshInsights: () => void;
  refreshSchedule: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCreatedMemory, setHasCreatedMemory] = useState(false);
  const [hasCreatedGoal, setHasCreatedGoal] = useState(false);
  const [isScheduleGenerated, setIsScheduleGenerated] = useState(false);
  const [insightsRefreshTrigger, setInsightsRefreshTrigger] = useState(0);
  const [scheduleRefreshTrigger, setScheduleRefreshTrigger] = useState(0);

  const checkState = async () => {
    try {
      const token = await StorageService.getItem<string>(StorageService.KEYS.AUTH_TOKEN);
      const userData = await StorageService.getItem<User>(StorageService.KEYS.USER_DATA);

      if (token && userData) {
        setUser(userData);

        // Sync state with API
        try {
          const memories = await ApiService.memories.getAll();
          setHasCreatedMemory(memories.length > 0);

          const goals = await ApiService.goals.getAll();
          setHasCreatedGoal(goals.length > 0);

          const today = new Date().toISOString().split('T')[0];
          const schedule = await ApiService.schedule.getDaily(today);
          setIsScheduleGenerated(schedule.items && schedule.items.length > 0);
        } catch (apiError) {
          console.warn("Failed to sync state with API", apiError);
        }
      } else {
        setUser(null);
        setHasCreatedMemory(false);
        setHasCreatedGoal(false);
        setIsScheduleGenerated(false);
      }
    } catch (e) {
      console.error('Error checking app state', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkState();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await ApiService.auth.login(email, password);
      setUser(response.user);
      await checkState(); // Refresh flags
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await ApiService.auth.register(name, email, password);
      setUser(response.user);
      await checkState();
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await ApiService.auth.logout();
      setUser(null);
      setHasCreatedMemory(false);
      setHasCreatedGoal(false);
      setIsScheduleGenerated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInsights = () => {
    setInsightsRefreshTrigger(prev => prev + 1);
  };

  const refreshSchedule = () => {
    setScheduleRefreshTrigger(prev => prev + 1);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        hasCreatedMemory,
        hasCreatedGoal,
        isScheduleGenerated,
        insightsRefreshTrigger,
        scheduleRefreshTrigger,
        login,
        register,
        logout,
        checkState,
        refreshInsights,
        refreshSchedule
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

