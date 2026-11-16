import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/use-theme-color";
import { biometricService } from "../../services/biometricService";
import { tokenStorage } from "../../services/tokenStorage";
import { useAuthStore } from "../../store/useAuthStore";

type AuthMode = "login" | "register" | "whatsapp";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const sendWhatsAppOtp = useAuthStore((s) => s.sendWhatsAppOtp);
  const verifyWhatsAppOtp = useAuthStore((s) => s.verifyWhatsAppOtp);

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [canBiometricUnlock, setCanBiometricUnlock] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometrics");

  useEffect(() => {
    (async () => {
      const status = await biometricService.getStatus();
      const hasToken = !!(await tokenStorage.getAccessToken());
      if (status.hasHardware && status.isEnrolled && hasToken) {
        setCanBiometricUnlock(true);
        setBiometricType(status.biometricType);
      }
    })();
  }, []);

  const handleBiometricUnlock = async () => {
    const verified = await biometricService.authenticate("Unlock Last Words");
    if (verified) {
      router.replace("/(tabs)");
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) {
          Alert.alert("Error", "Please enter your name.");
          setLoading(false);
          return;
        }
        await register(name.trim(), email.trim(), password);
        Alert.alert("Success", "Account created successfully!");
      } else {
        await login(email.trim(), password);
      }
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Authentication Failed", err.message || "Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your WhatsApp number (e.g. +14155552671).");
      return;
    }

    setLoading(true);
    try {
      await sendWhatsAppOtp(phoneNumber.trim());
      setOtpSent(true);
      Alert.alert("OTP Sent", "Verification code sent to WhatsApp.");
    } catch (err: any) {
      Alert.alert("OTP Failed", err.message || "Failed to send WhatsApp OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      await verifyWhatsAppOtp(phoneNumber.trim(), otp.trim(), name.trim() || undefined);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.logoTitle, { color: colors.text }]}>LAST WORDS</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Automated Inactivity Messaging & Switch
            </Text>
          </View>

          {/* Mode Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: colors.surfaceRaised }]}>
            {(["login", "register", "whatsapp"] as AuthMode[]).map((tab) => {
              const isSelected = mode === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    isSelected && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    setMode(tab);
                    setOtpSent(false);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: isSelected ? "#FFFFFF" : colors.textMuted },
                    ]}
                  >
                    {tab === "login" ? "Log In" : tab === "register" ? "Sign Up" : "WhatsApp"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Forms */}
          <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {mode === "register" && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Full Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textSubtle}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            {mode !== "whatsapp" ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Email Address</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textSubtle}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSubtle}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleEmailAuth}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {mode === "login" ? "Sign In to Last Words" : "Create Last Words Account"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {!otpSent ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>Your Name (Optional)</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        placeholder="John Doe"
                        placeholderTextColor={colors.textSubtle}
                        value={name}
                        onChangeText={setName}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>WhatsApp Phone Number (E.164)</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        placeholder="+14155552671"
                        placeholderTextColor={colors.textSubtle}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { backgroundColor: colors.primary },
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={handleSendOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Send WhatsApp OTP</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>6-Digit Verification Code</Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        placeholder="123456"
                        placeholderTextColor={colors.textSubtle}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { backgroundColor: colors.primary },
                        loading && styles.buttonDisabled,
                      ]}
                      onPress={handleVerifyOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => setOtpSent(false)}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>Change Phone Number</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>

          {canBiometricUnlock && mode === "login" && (
            <TouchableOpacity
              style={[
                styles.biometricButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceRaised,
                },
              ]}
              onPress={handleBiometricUnlock}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  biometricType === "Face ID" ? "scan-outline" : "finger-print-outline"
                }
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.biometricButtonText, { color: colors.text }]}>
                Unlock with {biometricType}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  form: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 13,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 18,
  },
  biometricButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
