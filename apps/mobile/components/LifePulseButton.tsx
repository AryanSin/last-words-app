import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../hooks/use-theme-color";
import { biometricService, BiometricStatus } from "../services/biometricService";

interface LifePulseButtonProps {
  onCheckIn: (biometricVerified: boolean) => Promise<void>;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const LifePulseButton: React.FC<LifePulseButtonProps> = ({
  onCheckIn,
  isLoading = false,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const [biometricInfo, setBiometricInfo] = useState<BiometricStatus | null>(null);

  // Pulse ring animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    biometricService.getStatus().then(setBiometricInfo);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  const handlePress = async () => {
    if (isLoading) return;

    // Trigger immediate light haptic feedback
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    let verified = false;
    const isBiometricsOn = await biometricService.isEnabled();

    if (isBiometricsOn && biometricInfo?.hasHardware && biometricInfo?.isEnrolled) {
      verified = await biometricService.authenticate(
        "Confirm your identity to refresh the Last Words timer",
      );
      if (!verified) {
        // User cancelled or biometric authentication failed
        return;
      }
    } else {
      // Non-biometric or fallback confirmation
      verified = false;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    await onCheckIn(verified);
  };

  const biometricLabel =
    biometricInfo?.biometricType === "Face ID"
      ? "Verify with Face ID to refresh"
      : biometricInfo?.biometricType === "Touch ID / Fingerprint"
        ? "Verify with Fingerprint to refresh"
        : "Tap to verify life & reset switch";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isDark ? "#0D1826" : "#E0F2FE",
          borderColor: colors.pulseEmerald,
          shadowColor: colors.pulseEmerald,
        },
        isLoading && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.85}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Confirm Life Pulse"
      accessibilityHint={biometricLabel}
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
    >
      {/* Icon with animated subtle pulse ring */}
      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              backgroundColor: colors.pulseEmeraldSurface,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <View
          style={[
            styles.innerCircle,
            { backgroundColor: isDark ? "#064E3B" : "#D1FAE5" },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.pulseEmerald} size="small" />
          ) : (
            <Ionicons
              name={
                biometricInfo?.biometricType === "Face ID"
                  ? "scan-outline"
                  : "finger-print-outline"
              }
              size={28}
              color={colors.pulseEmerald}
            />
          )}
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.mainText, { color: isDark ? "#FFFFFF" : colors.text }]}>
          CONFIRM LIFE PULSE
        </Text>
        <Text style={[styles.subText, { color: colors.textMuted }]}>
          {biometricLabel}
        </Text>
      </View>

      <View
        style={[
          styles.actionArrow,
          {
            backgroundColor: colors.pulseEmeraldSurface,
            borderColor: isDark ? "rgba(16, 185, 129, 0.35)" : "rgba(5, 150, 105, 0.3)",
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons name="checkmark" size={18} color={colors.pulseEmerald} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  disabled: {
    opacity: 0.65,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  innerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
  },
  mainText: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  actionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

