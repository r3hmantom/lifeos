import React, { createContext, useState, useEffect, useContext } from 'react';
import { ApiService, User } from '../services/api';
import { StorageService } from '../services/storage';

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCreatedMemory: boolean;
  hasCreatedGoal: boolean;
  isScheduleGenerated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkState: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCreatedMemory, setHasCreatedMemory] = useState(false);
  const [hasCreatedGoal, setHasCreatedGoal] = useState(false);
  const [isScheduleGenerated, setIsScheduleGenerated] = useState(false);

  const checkState = async () => {
    try {
      const token = await StorageService.getItem<string>(StorageService.KEYS.AUTH_TOKEN);
      const userData = await StorageService.getItem<User>(StorageService.KEYS.USER_DATA);
      const memoryFlag = await StorageService.getItem<boolean>(StorageService.KEYS.HAS_CREATED_MEMORY);
      const goalFlag = await StorageService.getItem<boolean>(StorageService.KEYS.HAS_CREATED_GOAL);
      const scheduleFlag = await StorageService.getItem<boolean>(StorageService.KEYS.SCHEDULE_GENERATED);

      if (token && userData) {
        setUser(userData);
      } else {
        setUser(null);
      }

      setHasCreatedMemory(!!memoryFlag);
      setHasCreatedGoal(!!goalFlag);
      setIsScheduleGenerated(!!scheduleFlag);
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

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        hasCreatedMemory,
        hasCreatedGoal,
        isScheduleGenerated,
        login,
        register,
        logout,
        checkState
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

