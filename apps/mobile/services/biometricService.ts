import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

const BIOMETRICS_PREFERENCE_KEY = "last_words_biometrics_enabled";

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: "Face ID" | "Touch ID / Fingerprint" | "Biometrics" | "None";
}

export const biometricService = {
  /**
   * Checks whether the device hardware supports biometrics and has enrolled credentials.
   */
  async getStatus(): Promise<BiometricStatus> {
    if (Platform.OS === "web") {
      return {
        hasHardware: false,
        isEnrolled: false,
        biometricType: "None",
      };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: BiometricStatus["biometricType"] = "Biometrics";
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = "Face ID";
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = "Touch ID / Fingerprint";
      }

      return {
        hasHardware,
        isEnrolled,
        biometricType: hasHardware && isEnrolled ? biometricType : "None",
      };
    } catch {
      return {
        hasHardware: false,
        isEnrolled: false,
        biometricType: "None",
      };
    }
  },

  /**
   * Prompts the user for biometric authentication (Face ID, Touch ID, Fingerprint).
   * Gracefully falls back if on web or unsupported hardware unless allowFallbackOnUnsupported is false.
   */
  async authenticate(
    promptMessage = "Confirm your identity for Last Words",
    options?: { allowFallbackOnUnsupported?: boolean; fallbackLabel?: string },
  ): Promise<boolean> {
    const allowFallback = options?.allowFallbackOnUnsupported ?? true;
    if (Platform.OS === "web") {
      return allowFallback;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fall back gracefully when device has no biometrics set up
        return allowFallback;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: "Cancel",
        fallbackLabel: options?.fallbackLabel || "Use Passcode",
        disableDeviceFallback: false,
      });

      return result.success;
    } catch {
      // If biometric prompt fails or is dismissed, return false
      return false;
    }
  },

  /**
   * Checks if user has explicitly enabled biometric check-in/app lock in settings.
   */
  async isEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(BIOMETRICS_PREFERENCE_KEY);
      // Default to true on supported devices
      if (val === null) {
        const status = await biometricService.getStatus();
        return status.hasHardware && status.isEnrolled;
      }
      return val === "true";
    } catch {
      return false;
    }
  },

  /**
   * Sets user's biometric toggle in settings.
   */
  async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(BIOMETRICS_PREFERENCE_KEY, enabled ? "true" : "false");
  },
};

