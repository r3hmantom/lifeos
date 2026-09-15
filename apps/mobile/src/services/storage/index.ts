import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@lifeos_auth_token',
  USER_DATA: '@lifeos_user_data',
  HAS_CREATED_MEMORY: '@lifeos_has_created_memory',
  HAS_CREATED_GOAL: '@lifeos_has_created_goal',
  SCHEDULE_GENERATED: '@lifeos_schedule_generated',
};

export const StorageService = {
  async setItem(key: string, value: any) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error('Error saving data', e);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading data', e);
      return null;
    }
  },

  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing data', e);
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  },

  KEYS: STORAGE_KEYS,
};

