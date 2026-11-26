import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmModal } from "../../components/ConfirmModal";
import { SecurityAuthModal } from "../../components/SecurityAuthModal";
import { VaultGuideModal } from "../../components/VaultGuideModal";
import { useTheme } from "../../hooks/use-theme-color";
import { api } from "../../services/apiClient";
import { biometricService, BiometricStatus } from "../../services/biometricService";
import { useAuthStore } from "../../store/useAuthStore";

const PRESET_DAYS = [30, 60, 90, 180, 365];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUserTriggerDays = useAuthStore((s) => s.updateUserTriggerDays);

  const [days, setDays] = useState(
    user?.defaultTriggerAfterDays?.toString() || "365",
  );
  const [daysError, setDaysError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDisableAuthModal, setShowDisableAuthModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const validateDays = (value: string): string => {
    if (!value.trim()) {
      return "Inactivity threshold cannot be empty.";
    }
    const num = parseInt(value.trim(), 10);
    if (isNaN(num) || !/^\d+$/.test(value.trim())) {
      return "Please enter a valid whole number of days.";
    }
    if (num < 1 || num > 3650) {
      return "Inactivity duration must be between 1 and 3,650 days (up to 10 years).";
    }
    return "";
  };

  const handleDaysChange = (text: string) => {
    setDays(text);
    if (statusMessage) setStatusMessage("");
    const err = validateDays(text);
    setDaysError(err);
  };

  const handleSelectPreset = (preset: number) => {
    setDays(preset.toString());
    setDaysError("");
    if (statusMessage) setStatusMessage("");
  };

  // Biometric preferences state
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    biometricService.getStatus().then((status) => {
      setBiometricStatus(status);
      if (status.hasHardware && status.isEnrolled) {
        biometricService.isEnabled().then(setBiometricsEnabled);
      }
    });
  }, []);

  const handleToggleBiometrics = async (val: boolean) => {
    if (val) {
      if (biometricStatus?.hasHardware && biometricStatus?.isEnrolled) {
        // Require verification before turning on
        const verified = await biometricService.authenticate(
          `Confirm your ${biometricStatus.biometricType} identity to enable biometric pulse verification`,
        );
        if (!verified) return;
      }
      setBiometricsEnabled(true);
      await biometricService.setEnabled(true);
      setStatusMessage(`${biometricStatus?.biometricType || "Biometric"} pulse check-in enabled.`);
    } else {
      // Disabling Face ID / biometric pulse check-in MUST require authentication
      if (biometricStatus?.hasHardware && biometricStatus?.isEnrolled) {
        const verified = await biometricService.authenticate(
          `Confirm your ${biometricStatus.biometricType} to disable pulse check-in`,
          { allowFallbackOnUnsupported: false, fallbackLabel: "Enter Password" },
        );
        if (verified) {
          setBiometricsEnabled(false);
          await biometricService.setEnabled(false);
          setStatusMessage(`${biometricStatus.biometricType} pulse check-in disabled.`);
          if (Platform.OS !== "web") {
            Alert.alert(
              "Biometrics Disabled",
              `${biometricStatus.biometricType} pulse check-in has been disabled.`,
            );
          }
          return;
        }
      }

      // Biometric prompt was cancelled, failed, or device has no enrolled biometrics/web:
      // Show Password Authentication Modal
      setShowDisableAuthModal(true);
    }
  };

  const handleVerifyPasswordToDisable = async (password: string): Promise<boolean> => {
    try {
      const res = await api.user.verifyPassword(password);
      if (res?.verified) {
        setShowDisableAuthModal(false);
        setBiometricsEnabled(false);
        await biometricService.setEnabled(false);
        setStatusMessage(
          `${biometricStatus?.biometricType || "Biometric"} pulse check-in disabled.`,
        );
        if (Platform.OS !== "web") {
          Alert.alert(
            "Biometrics Disabled",
            `${biometricStatus?.biometricType || "Biometric"} pulse check-in has been disabled.`,
          );
        }
        return true;
      }
      return false;
    } catch (err: any) {
      throw new Error(err.message || "Incorrect password. Please try again.");
    }
  };

  const handleRetryBiometricsInModal = async () => {
    if (!biometricStatus?.hasHardware || !biometricStatus?.isEnrolled) return;
    const verified = await biometricService.authenticate(
      `Confirm your ${biometricStatus.biometricType} to disable pulse check-in`,
      { allowFallbackOnUnsupported: false },
    );
    if (verified) {
      setShowDisableAuthModal(false);
      setBiometricsEnabled(false);
      await biometricService.setEnabled(false);
      setStatusMessage(`${biometricStatus.biometricType} pulse check-in disabled.`);
      if (Platform.OS !== "web") {
        Alert.alert(
          "Biometrics Disabled",
          `${biometricStatus.biometricType} pulse check-in has been disabled.`,
        );
      }
    }
  };

  const handleCancelDisableModal = () => {
    setShowDisableAuthModal(false);
    // Keep switch ON since authentication was not completed
    setBiometricsEnabled(true);
  };

  const handleSaveTrigger = async () => {
    setStatusMessage("");
    const err = validateDays(days);
    if (err) {
      setDaysError(err);
      return;
    }
    setDaysError("");
    setSaving(true);
    try {
      const num = parseInt(days.trim(), 10);
      await updateUserTriggerDays(num);
      setStatusMessage(`Default inactivity trigger set to ${num} days.`);
      if (Platform.OS !== "web") {
        Alert.alert("Updated", `Default inactivity trigger set to ${num} days.`);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to update default trigger days.";
      setStatusMessage(msg);
      if (Platform.OS !== "web") {
        Alert.alert("Update Failed", msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      router.replace("/(auth)/login");
    } catch (err) {
      setShowLogoutModal(false);
      router.replace("/(auth)/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Screen Header */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Security</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Inactivity switch configuration, biometrics, and safety nets
          </Text>
        </View>

        {statusMessage ? (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: colors.primarySurface,
                borderColor: colors.primaryBorder,
              },
            ]}
          >
            <Text style={[styles.statusBannerText, { color: colors.primary }]}>{statusMessage}</Text>
          </View>
        ) : null}

        {/* User Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.userHeader}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.userNameRow}>
                <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "User"}</Text>
                <View
                  style={[
                    styles.memberBadge,
                    { backgroundColor: colors.pulseEmeraldSurface, borderColor: colors.pulseEmerald },
                  ]}
                >
                  <Text style={[styles.memberBadgeText, { color: colors.pulseEmerald }]}>ACTIVE</Text>
                </View>
              </View>
              <Text style={[styles.userEmail, { color: colors.textMuted }]}>
                {user?.email || user?.phoneNumber || "No contact info"}
              </Text>
            </View>
          </View>
        </View>

        {/* Biometric Security Setting Card */}
        {biometricStatus && biometricStatus.hasHardware && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.biometricRow}>
              <View style={styles.biometricLeft}>
                <View
                  style={[
                    styles.biometricIconBox,
                    {
                      backgroundColor: colors.pulseEmeraldSurface,
                      borderColor: colors.pulseEmerald,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      biometricStatus.biometricType === "Face ID"
                        ? "scan-outline"
                        : "finger-print-outline"
                    }
                    size={22}
                    color={colors.pulseEmerald}
                  />
                </View>
                <View style={styles.biometricTextWrap}>
                  <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
                    {biometricStatus.biometricType} Pulse Check-In
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.textMuted, marginBottom: 0 }]}>
                    Require biometric confirmation when tapping "Confirm Life Pulse"
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: colors.border, true: colors.pulseEmerald }}
                thumbColor={Platform.OS === "android" ? "#FFFFFF" : undefined}
                accessibilityLabel={`${biometricStatus.biometricType} Pulse Check-In`}
              />
            </View>
          </View>
        )}

        {/* Inactivity Threshold Configuration */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Default Inactivity Threshold</Text>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            Sets the default inactivity duration before automated message dispatch begins. Individual messages can override this timeframe. You will receive multiple advance warnings before any dispatch.
          </Text>

          {/* Quick Presets */}
          <View style={styles.presetRow}>
            {PRESET_DAYS.map((preset) => {
              const isSelected = parseInt(days, 10) === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceRaised,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectPreset(preset)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${preset} days inactivity threshold`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: isSelected
                          ? (isDark ? "#080C14" : "#FFFFFF")
                          : colors.textMuted,
                        fontWeight: isSelected ? "800" : "600",
                      },
                    ]}
                  >
                    {preset}d
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: daysError ? colors.danger : colors.border,
                  color: colors.text,
                },
              ]}
              value={days}
              onChangeText={handleDaysChange}
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="done"
              onSubmitEditing={handleSaveTrigger}
              placeholder="e.g. 365"
              placeholderTextColor={colors.textSubtle}
              accessibilityLabel="Inactivity threshold days"
              aria-invalid={!!daysError}
            />
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                (saving || !!daysError || !days.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleSaveTrigger}
              disabled={saving || !!daysError || !days.trim()}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Save inactivity threshold"
              accessibilityState={{ disabled: saving || !!daysError || !days.trim(), busy: saving }}
            >
              {saving ? (
                <ActivityIndicator color={isDark ? "#080C14" : "#FFFFFF"} size="small" />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: isDark ? "#080C14" : "#FFFFFF" },
                  ]}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {daysError ? (
            <View style={styles.inlineErrorRow} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={14} color={colors.danger} />
              <Text style={[styles.inlineErrorText, { color: colors.danger }]}>{daysError}</Text>
            </View>
          ) : null}
        </View>

        {/* Pre-Dispatch Warning Timeline Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="notifications-outline" size={18} color={colors.warning} />
            <Text style={[styles.cardSectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Pre-Dispatch Warning Timeline
            </Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.textMuted, marginTop: 6 }]}>
            To protect against accidental dispatches if you are traveling or offline, Last Words alerts you through multiple channels before sending any message:
          </Text>

          <View style={styles.timelineList}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>14 Days Remaining: Gentle Reminder</Text>
                <Text style={[styles.timelineDesc, { color: colors.textMuted }]}>
                  Push notification reminding you to open the app or confirm life pulse.
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.warning }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.warning }]}>7 Days Remaining: Urgent Notice</Text>
                <Text style={[styles.timelineDesc, { color: colors.textMuted }]}>
                  High-priority push alert and warning email sent to your registered address.
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.danger }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.danger }]}>24 Hours Remaining: Final Grace Period</Text>
                <Text style={[styles.timelineDesc, { color: colors.textMuted }]}>
                  Final critical notice. Any check-in immediately halts dispatch and resets the full countdown.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vault Guide & FAQ Card */}
        <TouchableOpacity
          style={[
            styles.guideCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => setShowGuideModal(true)}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open Vault Guide & FAQ"
        >
          <View style={styles.guideCardLeft}>
            <View
              style={[
                styles.guideIconBox,
                {
                  backgroundColor: colors.primarySurface,
                  borderColor: colors.primaryBorder,
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons name="help-buoy-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guideTitle, { color: colors.text }]}>Vault Guide & FAQ</Text>
              <Text style={[styles.guideSubtitle, { color: colors.textMuted }]}>
                Confidentiality, safety nets, and recipient dispatch explained
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Cryptographic Protection Badge */}
        <View
          style={[
            styles.cryptoCard,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? "rgba(56, 189, 248, 0.25)" : colors.primaryBorder,
            },
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cryptoTitle, { color: colors.text }]}>AES-256 GCM Protection</Text>
            <Text style={[styles.cryptoSubtitle, { color: colors.textMuted }]}>
              All stored messages are encrypted at rest with random IVs and verification tags.
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.dangerSurface,
              borderColor: colors.danger,
            },
            loggingOut && styles.buttonDisabled,
          ]}
          onPress={() => setShowLogoutModal(true)}
          disabled={loggingOut}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Sign Out of Last Words"
          accessibilityState={{ disabled: loggingOut, busy: loggingOut }}
        >
          {loggingOut ? (
            <ActivityIndicator color={colors.danger} size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={[styles.logoutButtonText, { color: colors.danger }]}>Sign Out of Last Words</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Cross-Platform Custom Sign Out Confirmation Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Sign Out"
        message="Are you sure you want to sign out of your Last Words account on this device?"
        confirmText="Sign Out"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={loggingOut}
        iconName="log-out-outline"
        onConfirm={performLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Security Authentication Modal for Disabling Biometrics */}
      <SecurityAuthModal
        visible={showDisableAuthModal}
        title={`Disable ${biometricStatus?.biometricType || "Biometric"} Check-In`}
        description={`Authentication is required to disable ${biometricStatus?.biometricType || "biometric"} pulse check-in. Confirm with your account password or biometric verification.`}
        biometricType={biometricStatus?.biometricType || "Face ID"}
        hasBiometrics={Boolean(biometricStatus?.hasHardware && biometricStatus?.isEnrolled)}
        onRetryBiometrics={handleRetryBiometricsInModal}
        onVerifyPassword={handleVerifyPasswordToDisable}
        onCancel={handleCancelDisableModal}
      />

      {/* Vault Guide & FAQ Modal */}
      <VaultGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  statusBanner: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.2,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
  },
  memberBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  biometricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  biometricLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  biometricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  biometricTextWrap: {
    flex: 1,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  presetText: {
    fontSize: 13,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  inlineErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  inlineErrorText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cryptoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  timelineList: {
    gap: 12,
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  timelineDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  cryptoTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  cryptoSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.2,
    marginBottom: 16,
  },
  guideCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  guideIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  guideSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 48,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
