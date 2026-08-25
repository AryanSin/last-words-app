import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useTheme } from "../../hooks/use-theme-color";
import { useAuthStore } from "../../store/useAuthStore";

const PRESET_DAYS = [30, 60, 90, 180, 365];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUserTriggerDays = useAuthStore((s) => s.updateUserTriggerDays);

  const [days, setDays] = useState(
    user?.defaultTriggerAfterDays?.toString() || "365",
  );
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSaveTrigger = async () => {
    setStatusMessage("");
    const num = parseInt(days, 10);
    if (isNaN(num) || num < 1) {
      const msg = "Please enter a valid number of days (minimum 1).";
      setStatusMessage(msg);
      if (Platform.OS !== "web") Alert.alert("Invalid Duration", msg);
      return;
    }

    setSaving(true);
    try {
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
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "User"}</Text>
              <Text style={[styles.userEmail, { color: colors.textMuted }]}>
                {user?.email || user?.phoneNumber || "No contact info"}
              </Text>
            </View>
          </View>
        </View>

        {/* Inactivity Threshold Configuration */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Default Inactivity Threshold</Text>
          <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
            How many days of inactivity should pass before your vault messages are dispatched to recipients?
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
                  onPress={() => setDays(preset.toString())}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: isSelected ? "#FFFFFF" : colors.textMuted,
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
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={days}
              onChangeText={setDays}
              keyboardType="number-pad"
              placeholder="e.g. 365"
              placeholderTextColor={colors.textSubtle}
            />
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                saving && styles.buttonDisabled,
              ]}
              onPress={handleSaveTrigger}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
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
        message="Are you sure you want to sign out of your account on this device?"
        confirmText="Sign Out"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={loggingOut}
        iconName="log-out-outline"
        onConfirm={performLogout}
        onCancel={() => setShowLogoutModal(false)}
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
  },
  statusBanner: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
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
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  presetText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    paddingHorizontal: 20,
    borderRadius: 10,
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
  logoutButton: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
