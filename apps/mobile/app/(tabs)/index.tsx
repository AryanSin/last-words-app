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
import { LifePulseButton } from "../../components/LifePulseButton";
import { RadialCountdown } from "../../components/RadialCountdown";
import { useTheme } from "../../hooks/use-theme-color";
import { useMessages, useSwitchStatus } from "../../hooks/useMessages";
import { useAuthStore } from "../../store/useAuthStore";

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

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

  const handleCheckIn = async (biometricVerified: boolean) => {
    setCheckingIn(true);
    setHeartbeatToast("");
    try {
      const msg = await checkIn(biometricVerified);
      await refetchSwitchStatus();
      setHeartbeatToast(msg || "Inactivity timer refreshed successfully!");
      if (Platform.OS !== "web") {
        Alert.alert(
          biometricVerified ? "Biometric Pulse Verified" : "Heartbeat Confirmed",
          msg || "Inactivity timer has been successfully refreshed.",
        );
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
        {/* Brand App Bar */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLeft}>
            <View
              style={[
                styles.brandLogoBox,
                { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
              ]}
            >
              <Text style={[styles.brandLogoText, { color: colors.primary }]}>LW</Text>
            </View>
            <View>
              <View style={styles.brandTitleRow}>
                <Text style={[styles.brandTitle, { color: colors.text }]}>Last Words</Text>
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: isUrgent ? colors.warning : colors.pulseEmerald },
                  ]}
                />
              </View>
              <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
                {user.name ? `Welcome back, ${user.name}` : "Dead-Man's Switch Active"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.badge,
              {
                backgroundColor: isUrgent ? colors.warningSurface : colors.pulseEmeraldSurface,
                borderColor: isUrgent ? colors.warning : colors.pulseEmerald,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isUrgent ? colors.warning : colors.pulseEmerald },
              ]}
            >
              {isUrgent ? "CRITICAL LIMIT" : "SWITCH SAFE"}
            </Text>
          </View>
        </View>

        {heartbeatToast ? (
          <View
            style={[
              styles.toastCard,
              {
                backgroundColor: colors.pulseEmeraldSurface,
                borderColor: colors.pulseEmerald,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.pulseEmerald} />
            <Text style={[styles.toastText, { color: colors.pulseEmerald }]}>
              {heartbeatToast}
            </Text>
          </View>
        ) : null}

        {/* Primary Inactivity Status Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.surface,
              borderColor: isUrgent ? colors.warning : colors.border,
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <View style={styles.statusTitleGroup}>
              <Ionicons
                name={isUrgent ? "alert-circle" : "shield-checkmark"}
                size={20}
                color={isUrgent ? colors.warning : colors.pulseEmerald}
              />
              <Text
                style={[
                  styles.statusTitle,
                  { color: isUrgent ? colors.warning : colors.pulseEmerald },
                ]}
              >
                {isUrgent ? "Warning: Approaching Threshold" : "Switch Status: Armed & Safe"}
              </Text>
            </View>

            <View style={styles.cryptoBadge}>
              <Ionicons name="lock-closed" size={11} color={colors.primary} />
              <Text style={[styles.cryptoBadgeText, { color: colors.primary }]}>
                {switchStatus?.encryptionAlgorithm || "AES-256 GCM"}
              </Text>
            </View>
          </View>

          {/* Radial Countdown Progress Meter */}
          <RadialCountdown
            daysRemaining={daysRemaining}
            totalThreshold={triggerDays}
            isUrgent={isUrgent}
          />

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

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Inactivity Interval:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {triggerDays} Days {soonestMessage ? "(Message Override)" : "(Account Default)"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Last Verified Heartbeat:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {lastLogin.toLocaleDateString()} {lastLogin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>

        {/* Primary Biometric Life-Pulse Action Button */}
        <LifePulseButton onCheckIn={handleCheckIn} isLoading={checkingIn} />

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push("/(tabs)/messages")}
            activeOpacity={0.7}
          >
            <View style={styles.statIconBox}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalMessages}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Last Words Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push("/(tabs)/messages")}
            activeOpacity={0.7}
          >
            <View style={styles.statIconBox}>
              <Ionicons name="timer-outline" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{pendingMessages}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending Delivery</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  brandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandLogoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: "500",
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.2,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  cryptoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cryptoBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  soonestBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
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
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.2,
    alignItems: "center",
  },
  statIconBox: {
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
});
