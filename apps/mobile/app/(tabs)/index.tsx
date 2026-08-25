import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/use-theme-color";
import { useMessages, useSwitchStatus } from "../../hooks/useMessages";
import { useAuthStore } from "../../store/useAuthStore";

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // Zustand Auth State
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkIn = useAuthStore((s) => s.checkIn);
  const refreshUserProfile = useAuthStore((s) => s.refreshUserProfile);

  // TanStack Query for dynamic switch status (soonest message countdown)
  const {
    data: switchStatus,
    refetch: refetchSwitchStatus,
    isRefetching: isSwitchRefetching,
  } = useSwitchStatus();

  // TanStack Query for messages & stats (auto-updates on creation/deletion)
  const { data: messagesData, refetch: refetchMessages, isRefetching: isMessagesRefetching } =
    useMessages(1, 50);

  const [checkingIn, setCheckingIn] = useState(false);
  const [heartbeatToast, setHeartbeatToast] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated]);

  const onRefresh = async () => {
    await Promise.all([
      refreshUserProfile(),
      refetchMessages(),
      refetchSwitchStatus(),
    ]);
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    setHeartbeatToast("");
    try {
      const msg = await checkIn();
      await refetchSwitchStatus();
      setHeartbeatToast(msg || "Inactivity timer refreshed successfully!");
      if (Platform.OS !== "web") {
        Alert.alert("Heartbeat Confirmed", msg || "Inactivity timer has been successfully refreshed.");
      }
    } catch (err: any) {
      const msg = err.message || "Failed to confirm heartbeat.";
      setHeartbeatToast(msg);
      if (Platform.OS !== "web") {
        Alert.alert("Check-in Failed", msg);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  if (isLoading || !user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Calculate dynamic countdown values from API
  const lastLogin = switchStatus?.lastLoginAt
    ? new Date(switchStatus.lastLoginAt)
    : user.lastLoginAt
      ? new Date(user.lastLoginAt)
      : new Date();

  const daysRemaining =
    switchStatus?.daysRemaining !== undefined
      ? switchStatus.daysRemaining
      : Math.max(
          0,
          (user.defaultTriggerAfterDays || 365) -
            Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)),
        );

  const triggerDays =
    switchStatus?.inactivityThreshold ?? (user.defaultTriggerAfterDays || 365);

  const isUrgent = switchStatus?.isUrgent ?? (daysRemaining <= 7);
  const soonestMessage = switchStatus?.soonestMessage;

  const totalMessages = switchStatus?.totalMessages ?? (messagesData?.total ?? 0);
  const pendingMessages = switchStatus?.pendingMessages ?? (messagesData?.pendingCount ?? 0);

  const isRefetching = isSwitchRefetching || isMessagesRefetching;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name || "User"}</Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isUrgent ? colors.warningSurface : colors.successSurface,
                borderColor: isUrgent ? colors.warning : colors.success,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isUrgent ? colors.warning : colors.success },
              ]}
            >
              {isUrgent ? "URGENT LIMIT" : "ACTIVE SWITCH"}
            </Text>
          </View>
        </View>

        {heartbeatToast ? (
          <View style={[styles.toastCard, { backgroundColor: colors.successSurface, borderColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.toastText, { color: colors.success }]}>{heartbeatToast}</Text>
          </View>
        ) : null}

        {/* Inactivity Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: isUrgent ? colors.warning : colors.border }]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isUrgent ? "alert-circle" : "shield-checkmark"}
              size={24}
              color={isUrgent ? colors.warning : colors.success}
            />
            <Text
              style={[
                styles.statusTitle,
                { color: isUrgent ? colors.warning : colors.success },
              ]}
            >
              {isUrgent ? "Switch Alert: Approaching Threshold" : "Switch Status: Safe"}
            </Text>
          </View>

          <View style={styles.countdownBox}>
            <Text
              style={[
                styles.countdownDays,
                { color: isUrgent ? colors.warning : colors.text },
              ]}
            >
              {daysRemaining}
            </Text>
            <Text style={[styles.countdownLabel, { color: colors.textMuted }]}>
              {soonestMessage
                ? "DAYS LEFT UNTIL SOONEST MESSAGE DISPATCH"
                : "DAYS REMAINING UNTIL DEFAULT TRIGGER"}
            </Text>
          </View>

          {soonestMessage && (
            <TouchableOpacity
              style={[
                styles.soonestBanner,
                {
                  backgroundColor: colors.primarySurface,
                  borderColor: colors.primaryBorder,
                },
              ]}
              onPress={() => router.push(`/messages/${soonestMessage.id}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.soonestTitle, { color: colors.text }]}>
                  Next Dispatch: "{soonestMessage.title || "Untitled Message"}"
                </Text>
                <Text style={[styles.soonestSubtitle, { color: colors.textMuted }]}>
                  Custom {soonestMessage.triggerAfterDays}d trigger • To {soonestMessage.recipientName || "Recipient"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Effective Threshold:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {triggerDays} Days {soonestMessage ? "(Message Override)" : "(Account Default)"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Last Confirmed Check-In:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {lastLogin.toLocaleDateString()} {lastLogin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>

        {/* Primary Check-In Action Button */}
        <TouchableOpacity
          style={[
            styles.checkInButton,
            { backgroundColor: colors.surface, borderColor: colors.primary, shadowColor: colors.primary },
            checkingIn && styles.buttonDisabled,
          ]}
          onPress={handleCheckIn}
          disabled={checkingIn}
          activeOpacity={0.8}
        >
          {checkingIn ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : (
            <>
              <Ionicons name="heart" size={32} color={colors.danger} />
              <Text style={[styles.checkInButtonText, { color: colors.text }]}>I AM ALIVE</Text>
              <Text style={[styles.checkInSubtext, { color: colors.textMuted }]}>
                Tap to refresh timer and prevent message trigger
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Stats Grid - Live synced via TanStack Query */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalMessages}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Vault Messages</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={24} color={colors.warning} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{pendingMessages}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending Delivery</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  countdownBox: {
    alignItems: "center",
    paddingVertical: 12,
  },
  countdownDays: {
    fontSize: 48,
    fontWeight: "800",
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 4,
    textAlign: "center",
  },
  soonestBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  soonestTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  soonestSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  checkInButton: {
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  checkInButtonText: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
    letterSpacing: 1.5,
  },
  checkInSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
});
