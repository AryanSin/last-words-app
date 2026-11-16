import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/use-theme-color";

export interface SecurityAuthModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  biometricType?: string;
  hasBiometrics?: boolean;
  onRetryBiometrics?: () => Promise<void>;
  onVerifyPassword: (password: string) => Promise<boolean>;
  onCancel: () => void;
}

export function SecurityAuthModal({
  visible,
  title = "Security Verification",
  description = "Authentication is required to disable biometric pulse check-in. Please confirm your identity with your account password or biometric verification.",
  biometricType = "Face ID",
  hasBiometrics = true,
  onRetryBiometrics,
  onVerifyPassword,
  onCancel,
}: SecurityAuthModalProps) {
  const { colors } = useTheme();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorText, setErrorText] = useState("");

  if (!visible) return null;

  const handleClose = () => {
    setPassword("");
    setErrorText("");
    setIsVerifying(false);
    onCancel();
  };

  const handleVerify = async () => {
    if (!password.trim()) {
      setErrorText("Please enter your password.");
      return;
    }

    setIsVerifying(true);
    setErrorText("");
    try {
      const verified = await onVerifyPassword(password);
      if (verified) {
        setPassword("");
        setErrorText("");
      } else {
        setErrorText("Incorrect password. Please try again.");
      }
    } catch (err: any) {
      setErrorText(err.message || "Failed to verify password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Security Shield Badge */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: colors.primarySurface,
                borderColor: colors.primaryBorder,
              },
            ]}
          >
            <Ionicons name="shield-checkmark" size={30} color={colors.primary} />
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {description}
          </Text>

          {/* Error Message */}
          {errorText ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: colors.dangerSurface,
                  borderColor: colors.dangerBorder,
                },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorText}</Text>
            </View>
          ) : null}

          {/* Password Input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: errorText ? colors.danger : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your account password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorText) setErrorText("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isVerifying}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Biometric Retry Button */}
          {hasBiometrics && onRetryBiometrics ? (
            <TouchableOpacity
              style={[
                styles.retryBiometricBtn,
                {
                  borderColor: colors.pulseEmerald,
                  backgroundColor: colors.pulseEmeraldSurface,
                },
              ]}
              onPress={async () => {
                setErrorText("");
                await onRetryBiometrics();
              }}
              disabled={isVerifying}
              activeOpacity={0.8}
            >
              <Ionicons
                name={biometricType === "Face ID" ? "scan-outline" : "finger-print-outline"}
                size={18}
                color={colors.pulseEmerald}
              />
              <Text style={[styles.retryBiometricText, { color: colors.pulseEmerald }]}>
                Try {biometricType} Again
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleClose}
              disabled={isVerifying}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                },
                isVerifying && styles.buttonDisabled,
              ]}
              onPress={handleVerify}
              disabled={isVerifying}
              activeOpacity={0.8}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Verify & Disable</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6px)",
      },
    }),
  },
  modalContainer: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1.2,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: "100%",
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  inputWrap: {
    width: "100%",
    position: "relative",
    marginBottom: 14,
  },
  input: {
    width: "100%",
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 44,
    fontSize: 15,
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  retryBiometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: "100%",
    marginBottom: 14,
  },
  retryBiometricText: {
    fontSize: 13,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
