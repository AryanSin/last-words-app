import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "last_words_access_token";
const REFRESH_TOKEN_KEY = "last_words_refresh_token";
const USER_KEY = "last_words_user_profile";

export interface StoredUser {
  id: number;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  lastLoginAt?: string;
  defaultTriggerAfterDays?: number | null;
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  async getUser(): Promise<StoredUser | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: StoredUser): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async saveAuthSession(
    accessToken: string,
    refreshToken: string,
    user?: StoredUser,
  ): Promise<void> {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  async clearSession(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  },
};

