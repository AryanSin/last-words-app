import { create } from "zustand";
import { api, setOnSessionExpired } from "../services/apiClient";
import {
  syncPushTokenWithBackend,
  unregisterPushTokenFromBackend,
} from "../services/pushNotificationService";
import { StoredUser, tokenStorage } from "../services/tokenStorage";

function decodeJwtPayload(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    let binaryStr = "";
    if (typeof atob === "function") {
      binaryStr = atob(base64);
    } else {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let i = 0;
      while (i < base64.length) {
        const enc1 = chars.indexOf(base64.charAt(i++));
        const enc2 = chars.indexOf(base64.charAt(i++));
        const enc3 = chars.indexOf(base64.charAt(i++));
        const enc4 = chars.indexOf(base64.charAt(i++));
        const chr1 = (enc1 << 2) | (enc2 >> 4);
        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const chr3 = ((enc3 & 3) << 6) | enc4;
        binaryStr += String.fromCharCode(chr1);
        if (enc3 !== 64 && enc3 !== -1) binaryStr += String.fromCharCode(chr2);
        if (enc4 !== 64 && enc4 !== -1) binaryStr += String.fromCharCode(chr3);
      }
    }
    return JSON.parse(binaryStr);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000 - 5000;
}

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
  loginWithGoogle: (idToken: string) => Promise<void>;
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
      const refreshToken = await tokenStorage.getRefreshToken();
      const storedUser = await tokenStorage.getUser();

      // If no stored credentials exist, immediately ensure clean state
      if (!accessToken || !storedUser) {
        await tokenStorage.clearSession();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Check if access token is locally expired
      const expiredLocally = isTokenExpired(accessToken);

      // If locally expired, attempt silent token refresh first
      if (expiredLocally) {
        if (!refreshToken) {
          await tokenStorage.clearSession();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        const refreshed = await get().trySilentTokenRefresh();
        if (!refreshed) {
          // Refresh failed -> Token revoked or expired -> Force user to login again
          await tokenStorage.clearSession();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
      }

      // Verify active session with backend (detect if JWT was revoked or user signed out)
      try {
        const freshUser = await Promise.race([
          api.user.getMe(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("VERIFY_TIMEOUT")), 3500)
          ),
        ]);

        if (freshUser) {
          set({ user: freshUser, isAuthenticated: true, isLoading: false });
          await tokenStorage.setUser(freshUser);

          // Background sync
          get().performBackgroundCheckIn();
          syncPushTokenWithBackend().catch(() => {});
          return;
        }
      } catch (err: any) {
        const msg = String(err?.message || "").toLowerCase();
        const isAuthError =
          msg.includes("unauthorized") ||
          msg.includes("expired") ||
          msg.includes("revoked") ||
          msg.includes("invalid") ||
          msg.includes("failed after token refresh") ||
          msg.includes("session") ||
          msg.includes("401");

        // If backend explicitly rejected the token (signed out or revoked) OR expired locally:
        if (isAuthError || expiredLocally) {
          await tokenStorage.clearSession();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        // If it was just a temporary network timeout / offline status and local JWT is still valid:
        set({ user: storedUser, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch {
      await tokenStorage.clearSession();
      set({ user: null, isAuthenticated: false, isLoading: false });
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

  loginWithGoogle: async (idToken: string) => {
    const res = await api.auth.googleAuth({ idToken });
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
    // 1. Immediately wipe local auth state and tokens so UI transitions instantly
    await tokenStorage.clearSession();
    set({ user: null, isAuthenticated: false, isLoading: false });

    // 2. Dispatch background server revocation without blocking user
    (async () => {
      try {
        await Promise.allSettled([
          unregisterPushTokenFromBackend().catch(() => {}),
          api.auth.logout().catch(() => {}),
        ]);
      } catch {}
    })();
  },
}));

// Automatic seamless logout trigger whenever an API call encounters an expired session
setOnSessionExpired(() => {
  useAuthStore.getState().handleSessionExpired();
});
