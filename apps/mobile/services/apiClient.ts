import {
  googleAuthType,
  loginUserType,
  messageCreationBodyType,
  registerUserType,
  sendOtpType,
  updateMessageBodyType,
  userDefaultTriggerUpdateType,
  verifyOtpType,
} from "@shared/types/apiTypes";
import { SwitchStatusDto } from "@shared/types/userTypes";
import { Platform } from "react-native";
import { StoredUser, tokenStorage } from "./tokenStorage";

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === "android") {
    // Android emulator alias for host localhost
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
};

export const API_BASE_URL = getBaseUrl();

interface ApiResponse<T = any> {
  status: "success" | "fail" | "error";
  data?: T;
  message?: string;
  errors?: any;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];
let sessionExpiredHandler: (() => void) | null = null;

export const setOnSessionExpired = (handler: () => void) => {
  sessionExpiredHandler = handler;
};

const triggerSessionExpired = async () => {
  await tokenStorage.clearSession();
  if (sessionExpiredHandler) {
    sessionExpiredHandler();
  }
};

const onTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = await tokenStorage.getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Platform": Platform.OS,
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json().catch(() => ({
    status: "error",
    message: "Failed to parse server response",
  }));

  // Handle Token Expiration and Refresh (401 Unauthorized)
  if (
    response.status === 401 &&
    !isRetry &&
    endpoint !== "/auth/login" &&
    endpoint !== "/auth/register" &&
    endpoint !== "/auth/refresh"
  ) {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      await triggerSessionExpired();
      throw new Error("Session expired. Automatically signing out...");
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Platform": Platform.OS,
          },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshJson: ApiResponse<{ accessToken: string; refreshToken: string }> =
          await refreshResponse.json();

        if (refreshResponse.ok && refreshJson.data) {
          const { accessToken: newAccess, refreshToken: newRefresh } = refreshJson.data;
          await tokenStorage.setAccessToken(newAccess);
          await tokenStorage.setRefreshToken(newRefresh);
          isRefreshing = false;
          onTokenRefreshed(newAccess);
        } else {
          isRefreshing = false;
          onTokenRefreshed(null);
          await triggerSessionExpired();
          throw new Error("Session expired. Automatically signing out...");
        }
      } catch (err) {
        isRefreshing = false;
        onTokenRefreshed(null);
        await triggerSessionExpired();
        throw err;
      }
    }

    // Wait for ongoing refresh to complete
    const retryToken = await new Promise<string | null>((resolve) => {
      addRefreshSubscriber((token) => resolve(token));
    });

    if (retryToken) {
      return apiRequest<T>(endpoint, options, true);
    } else {
      await triggerSessionExpired();
      throw new Error("Authentication failed after token refresh");
    }
  }

  if (!response.ok) {
    throw new Error(json.message || "An unexpected API error occurred");
  }

  return (json.data !== undefined ? json.data : json) as T;
};

export const api = {
  auth: {
    async register(body: registerUserType) {
      return apiRequest<{ accessToken: string; refreshToken: string; user: StoredUser }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },

    async login(body: loginUserType) {
      return apiRequest<{ accessToken: string; refreshToken: string; user: StoredUser }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },

    async googleAuth(body: googleAuthType) {
      return apiRequest<{ accessToken: string; refreshToken: string; user: StoredUser }>(
        "/auth/google",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },

    async sendOtp(body: sendOtpType) {
      return apiRequest<{ message: string; expiresInSeconds: number }>(
        "/auth/whatsapp/send-otp",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },

    async verifyOtp(body: verifyOtpType) {
      return apiRequest<{ accessToken: string; refreshToken: string; user: StoredUser }>(
        "/auth/whatsapp/verify-otp",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
    },

    async checkIn(options?: { biometricVerified?: boolean; authMethod?: string }) {
      return apiRequest<{
        message: string;
        lastLoginAt: string;
        biometricVerified?: boolean;
        authMethod?: string;
      }>("/auth/check-in", {
        method: "POST",
        body: options ? JSON.stringify(options) : undefined,
      });
    },

    async refreshTokensSilently(): Promise<boolean> {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return false;

      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Platform": Platform.OS,
          },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshJson: ApiResponse<{ accessToken: string; refreshToken: string }> =
          await refreshResponse.json();

        if (refreshResponse.ok && refreshJson.data) {
          await tokenStorage.setAccessToken(refreshJson.data.accessToken);
          await tokenStorage.setRefreshToken(refreshJson.data.refreshToken);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    async logout() {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          await apiRequest("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          });
        } catch {
          // Continue local cleanup even if network fails
        }
      }
      await tokenStorage.clearSession();
    },
  },

  messages: {
    async list(page = 1, limit = 50) {
      const res = await apiRequest<any>(
        `/messages?page=${page}&limit=${limit}`,
        { method: "GET" },
      );
      const list = Array.isArray(res) ? res : res?.messages || res?.data || [];
      return {
        messages: list,
        total: list.length,
        page,
        limit,
      };
    },

    async get(id: number) {
      return apiRequest<any>(`/messages/${id}`, { method: "GET" });
    },

    async create(body: messageCreationBodyType) {
      return apiRequest<any>("/messages", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async update(id: number, body: updateMessageBodyType) {
      return apiRequest<any>(`/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },

    async delete(id: number) {
      return apiRequest<any>(`/messages/${id}`, { method: "DELETE" });
    },
  },

  user: {
    async getMe() {
      return apiRequest<StoredUser>("/users/me", { method: "GET" });
    },

    async getSwitchStatus() {
      return apiRequest<SwitchStatusDto>("/users/switch-status", {
        method: "GET",
      });
    },

    async updateDefaultTrigger(body: userDefaultTriggerUpdateType) {
      return apiRequest<StoredUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },

    async registerPushToken(token: string, platform?: string) {
      return apiRequest<{ message: string; token: string }>("/users/push-token", {
        method: "POST",
        body: JSON.stringify({ token, platform }),
      });
    },

    async removePushToken(token: string) {
      return apiRequest<{ message: string }>("/users/push-token", {
        method: "DELETE",
        body: JSON.stringify({ token }),
      });
    },

    async verifyPassword(password: string) {
      return apiRequest<{ verified: boolean; message: string }>(
        "/users/verify-password",
        {
          method: "POST",
          body: JSON.stringify({ password }),
        },
      );
    },
  },
};
