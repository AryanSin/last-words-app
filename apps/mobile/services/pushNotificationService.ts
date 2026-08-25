import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./apiClient";

const PUSH_TOKEN_KEY = "lastwords_device_push_token";

export async function getOrGenerateDeviceToken(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (existing) return existing;

    const deviceId =
      Constants.installationId ||
      Constants.sessionId ||
      `device_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, deviceId);
    return deviceId;
  } catch {
    return `device_${Platform.OS}_${Date.now()}`;
  }
}

export async function syncPushTokenWithBackend(): Promise<void> {
  try {
    const token = await getOrGenerateDeviceToken();
    if (token) {
      await api.user.registerPushToken(token, Platform.OS);
    }
  } catch {}
}

export async function unregisterPushTokenFromBackend(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (token) {
      await api.user.removePushToken(token);
    }
  } catch {}
}
