import { create } from "zustand";
import { api, setOnSessionExpired } from "../services/apiClient";
import {
  syncPushTokenWithBackend,
  unregisterPushTokenFromBackend,
} from "../services/pushNotificationService";
import { StoredUser, tokenStorage } from "../services/tokenStorage";

export interface AuthState {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  initAuth: () => Promise<void>;
  performBackgroundCheckIn: () => Promise<void>;
  trySilentTokenRefresh: () => Promise<boolean>;
  handleSessionExpired: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  sendWhatsAppOtp: (phoneNumber: string) => Promise<{ expiresInSeconds: number }>;
  verifyWhatsAppOtp: (phoneNumber: string, otp: string, name?: string) => Promise<void>;
  checkIn: (biometricVerified?: boolean) => Promise<string>;
  updateUserTriggerDays: (days: number) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: StoredUser | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  handleSessionExpired: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  trySilentTokenRefresh: async () => {
    try {
      const refreshed = await api.auth.refreshTokensSilently();
      return refreshed;
    } catch {
      return false;
    }
  },

  performBackgroundCheckIn: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) return;

      // Keep token alive on mobile via background refresh
      await get().trySilentTokenRefresh();

      const res = await api.auth.checkIn();
      if (res?.lastLoginAt) {
        const currentUser = get().user;
        if (currentUser) {
          const updated = { ...currentUser, lastLoginAt: res.lastLoginAt };
          await tokenStorage.setUser(updated);
          set({ user: updated });
        }
      }

      // Sync push token in background
      syncPushTokenWithBackend().catch(() => {});
    } catch {
      // Silently ignore background check-in failures
    }
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const storedUser = await tokenStorage.getUser();

      if (accessToken && storedUser) {
        set({ user: storedUser, isAuthenticated: true });

        // Update last login on launch
        get().performBackgroundCheckIn();

        // Sync push token
        syncPushTokenWithBackend().catch(() => {});

        // Fetch fresh profile in background
        api.user.getMe()
          .then((fresh) => {
            if (fresh) {
              set({ user: fresh });
              tokenStorage.setUser(fresh);
            }
          })
          .catch(() => {});
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      await tokenStorage.clearSession();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await api.auth.login({ email, password });
    await tokenStorage.saveAuthSession(res.accessToken, res.refreshToken, res.user);
    set({ user: res.user, isAuthenticated: true });
    syncPushTokenWithBackend().catch(() => {});
  },

  register: async (name, email, password) => {
    const res = await api.auth.register({ name, email, password });
    await tokenStorage.saveAuthSession(res.accessToken, res.refreshToken, res.user);
    set({ user: res.user, isAuthenticated: true });
    syncPushTokenWithBackend().catch(() => {});
  },

  sendWhatsAppOtp: async (phoneNumber) => {
    const res = await api.auth.sendOtp({ phoneNumber });
    return { expiresInSeconds: res.expiresInSeconds };
  },

  verifyWhatsAppOtp: async (phoneNumber, otp, name) => {
    const res = await api.auth.verifyOtp({ phoneNumber, otp, name });
    await tokenStorage.saveAuthSession(res.accessToken, res.refreshToken, res.user);
    set({ user: res.user, isAuthenticated: true });
    syncPushTokenWithBackend().catch(() => {});
  },

  checkIn: async (biometricVerified?: boolean) => {
    const res = await api.auth.checkIn(
      biometricVerified !== undefined
        ? { biometricVerified, authMethod: biometricVerified ? "BIOMETRIC" : "MANUAL" }
        : undefined,
    );
    const currentUser = get().user;
    if (currentUser) {
      const updated = { ...currentUser, lastLoginAt: res.lastLoginAt };
      await tokenStorage.setUser(updated);
      set({ user: updated });
    }
    syncPushTokenWithBackend().catch(() => {});
    return res.message;
  },

  updateUserTriggerDays: async (days) => {
    const updated = await api.user.updateDefaultTrigger({ defaultTriggerAfterDays: days });
    await tokenStorage.setUser(updated);
    set({ user: updated });
  },

  refreshUserProfile: async () => {
    try {
      const profile = await api.user.getMe();
      if (profile) {
        await tokenStorage.setUser(profile);
        set({ user: profile });
      }
    } catch {}
  },

  logout: async () => {
    try {
      await unregisterPushTokenFromBackend();
    } catch {}
    try {
      await api.auth.logout();
    } catch {}
    await tokenStorage.clearSession();
    set({ user: null, isAuthenticated: false });
  },
}));

// Automatic seamless logout trigger whenever an API call encounters an expired session
setOnSessionExpired(() => {
  useAuthStore.getState().handleSessionExpired();
});
