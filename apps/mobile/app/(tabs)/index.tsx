import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

  // TanStack Query for dynamic switch status
  const {
    data: switchStatus,
    refetch: refetchSwitchStatus,
    isRefetching: isSwitchRefetching,
  } = useSwitchStatus();

  // TanStack Query for messages & stats
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
      setHeartbeatToast(msg || "Heartbeat confirmed. Inactivity switch reset and safe.");
      if (Platform.OS !== "web") {
        Alert.alert(
          biometricVerified ? "Biometric Pulse Verified" : "Heartbeat Confirmed",
          msg || "Your inactivity timer has been successfully refreshed.",
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
              <Text style={[styles.brandTitle, { color: colors.text }]}>Last Words</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
                {user.name ? `Welcome back, ${user.name}` : "Automated Inactivity Switch"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusPillBadge,
              {
                backgroundColor: isUrgent ? colors.warningSurface : colors.pulseEmeraldSurface,
                borderColor: isUrgent ? colors.warning : colors.pulseEmerald,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isUrgent ? colors.warning : colors.pulseEmerald },
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                { color: isUrgent ? colors.warning : colors.pulseEmerald },
              ]}
            >
              {isUrgent ? "CRITICAL LIMIT" : "ARMED & SAFE"}
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
            <Ionicons name="checkmark-circle" size={18} color={colors.pulseEmerald} />
            <Text style={[styles.toastText, { color: colors.pulseEmerald }]}>
              {heartbeatToast}
            </Text>
          </View>
        ) : null}

        {/* Hero Chamber: Unboxed, Breatheable Focal Instrument */}
        <View style={styles.heroChamber}>
          {/* Spacious Radial Countdown Gauge */}
          <RadialCountdown
            daysRemaining={daysRemaining}
            totalThreshold={triggerDays}
            isUrgent={isUrgent}
          />

          {/* Primary Biometric Life-Pulse Action Button */}
          <LifePulseButton
            onCheckIn={handleCheckIn}
            isLoading={checkingIn}
            style={{ width: "100%", marginTop: 8, marginBottom: 10 }}
          />

          {/* Heartbeat Timestamp & Trigger Meta */}
          <View
            style={[
              styles.heartbeatMetaRow,
              {
                backgroundColor: isDark
                  ? "rgba(16, 185, 129, 0.06)"
                  : "rgba(5, 150, 105, 0.06)",
                borderColor: isDark
                  ? "rgba(16, 185, 129, 0.18)"
                  : "rgba(5, 150, 105, 0.15)",
              },
            ]}
          >
            <Ionicons name="shield-checkmark" size={13} color={colors.pulseEmerald} />
            <Text style={[styles.heartbeatMetaText, { color: colors.textMuted }]}>
              Verified {lastLogin.toLocaleDateString()} at{" "}
              {lastLogin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" • "}
              {triggerDays}d threshold
            </Text>
          </View>
        </View>

        {/* Next Scheduled Dispatch (Conditional) */}
        {soonestMessage && (
          <TouchableOpacity
            style={[
              styles.dispatchCard,
              {
                backgroundColor: colors.surface,
                borderColor: soonestMessage.daysRemaining <= 7 ? colors.warning : colors.border,
              },
            ]}
            onPress={() => router.push(`/messages/${soonestMessage.id}`)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Next dispatch: ${soonestMessage.title || "Untitled Message"}`}
            accessibilityHint="Tap to view message details"
          >
            <View style={styles.dispatchLeft}>
              <View
                style={[
                  styles.dispatchIconBox,
                  {
                    backgroundColor:
                      soonestMessage.deliveryChannel === "WHATSAPP"
                        ? colors.whatsappSurface
                        : colors.primarySurface,
                    borderColor:
                      soonestMessage.deliveryChannel === "WHATSAPP"
                        ? colors.whatsappBorder
                        : colors.primaryBorder,
                  },
                ]}
              >
                <Ionicons
                  name={
                    soonestMessage.deliveryChannel === "WHATSAPP"
                      ? "logo-whatsapp"
                      : "mail-outline"
                  }
                  size={18}
                  color={
                    soonestMessage.deliveryChannel === "WHATSAPP"
                      ? colors.whatsapp
                      : colors.primary
                  }
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.dispatchTitleRow}>
                  <Text style={[styles.dispatchTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                    Next Dispatch: "{soonestMessage.title || "Untitled Message"}"
                  </Text>
                  <View
                    style={[
                      styles.channelMicroBadge,
                      {
                        backgroundColor:
                          soonestMessage.deliveryChannel === "WHATSAPP"
                            ? colors.whatsappSurface
                            : colors.primarySurface,
                        borderColor:
                          soonestMessage.deliveryChannel === "WHATSAPP"
                            ? colors.whatsappBorder
                            : colors.primaryBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.channelMicroBadgeText,
                        {
                          color:
                            soonestMessage.deliveryChannel === "WHATSAPP"
                              ? colors.whatsapp
                              : colors.primary,
                        },
                      ]}
                    >
                      {soonestMessage.deliveryChannel}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.dispatchSub, { color: colors.textMuted }]} numberOfLines={1}>
                  Custom {soonestMessage.triggerAfterDays || triggerDays}d trigger • To{" "}
                  {soonestMessage.recipientName || "Designated Recipient"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Vault Overview Strip */}
        <TouchableOpacity
          style={[
            styles.vaultBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push("/(tabs)/messages")}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open message vault"
        >
          <View style={styles.vaultBarLeft}>
            <View
              style={[
                styles.vaultBarIcon,
                { backgroundColor: colors.primarySurface },
              ]}
            >
              <Ionicons name="mail-unread-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.vaultBarTitle, { color: colors.text }]}>
                {totalMessages} {totalMessages === 1 ? "Message" : "Messages"} Sealed in Vault
              </Text>
              <Text style={[styles.vaultBarSub, { color: colors.textMuted }]}>
                {pendingMessages} armed for delivery • Encrypted at rest
              </Text>
            </View>
          </View>
          <View style={styles.vaultBarAction}>
            <Text style={[styles.vaultBarActionText, { color: colors.primary }]}>View</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Inactivity Safety Net: Clean Vertical Timeline */}
        <View style={[styles.timelineSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.timelineHeaderRow}>
            <Ionicons name="shield-outline" size={18} color={colors.primary} />
            <Text style={[styles.timelineSectionTitle, { color: colors.text }]}>
              Inactivity Safety Net
            </Text>
          </View>
          <Text style={[styles.timelineSectionDesc, { color: colors.textMuted }]}>
            How Last Words prevents accidental dispatches while you travel, fall ill, or rest:
          </Text>

          <View style={styles.timelineList}>
            {/* Step 1 */}
            <View style={styles.timelineStep}>
              <View style={styles.timelineIndicatorColumn}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: colors.primarySurface, borderColor: colors.primary },
                  ]}
                >
                  <View style={[styles.timelineInnerDot, { backgroundColor: colors.primary }]} />
                </View>
                <View style={[styles.timelineConnectingLine, { backgroundColor: colors.border }]} />
              </View>
              <View style={styles.timelineStepBody}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>
                    Advance Reminder
                  </Text>
                  <Text style={[styles.stepBadgeText, { color: colors.primary }]}>14 DAYS PRIOR</Text>
                </View>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                  Gentle push notification to tap your life pulse and refresh your timer.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineStep}>
              <View style={styles.timelineIndicatorColumn}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: colors.warningSurface, borderColor: colors.warning },
                  ]}
                >
                  <View style={[styles.timelineInnerDot, { backgroundColor: colors.warning }]} />
                </View>
                <View style={[styles.timelineConnectingLine, { backgroundColor: colors.border }]} />
              </View>
              <View style={styles.timelineStepBody}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepTitle, { color: colors.warning }]}>
                    Urgent Warning
                  </Text>
                  <Text style={[styles.stepBadgeText, { color: colors.warning }]}>7 DAYS PRIOR</Text>
                </View>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                  High-priority push alert and email sent directly to your registered account.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={[styles.timelineStep, { marginBottom: 0 }]}>
              <View style={styles.timelineIndicatorColumn}>
                <View
                  style={[
                    styles.timelineDot,
                    { backgroundColor: colors.dangerSurface, borderColor: colors.danger },
                  ]}
                >
                  <View style={[styles.timelineInnerDot, { backgroundColor: colors.danger }]} />
                </View>
              </View>
              <View style={styles.timelineStepBody}>
                <View style={styles.stepTitleRow}>
                  <Text style={[styles.stepTitle, { color: colors.danger }]}>
                    Final Grace Period
                  </Text>
                  <Text style={[styles.stepBadgeText, { color: colors.danger }]}>24 HOURS PRIOR</Text>
                </View>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                  Critical emergency notices. Tapping your life pulse cancels dispatch immediately.
                </Text>
              </View>
            </View>
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
    paddingBottom: 48,
  },
  brandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLogoText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  statusPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
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
  heroChamber: {
    alignItems: "center",
    marginVertical: 10,
    paddingVertical: 12,
  },
  heartbeatMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  heartbeatMetaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dispatchCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 14,
  },
  dispatchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dispatchIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dispatchTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  dispatchTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  channelMicroBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  channelMicroBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dispatchSub: {
    fontSize: 12,
    marginTop: 2,
  },
  vaultBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.2,
    marginBottom: 16,
  },
  vaultBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  vaultBarIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  vaultBarTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  vaultBarSub: {
    fontSize: 12,
    marginTop: 2,
  },
  vaultBarAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vaultBarActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  timelineSection: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 18,
  },
  timelineHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  timelineSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  timelineSectionDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: "row",
    marginBottom: 18,
  },
  timelineIndicatorColumn: {
    alignItems: "center",
    width: 24,
    marginRight: 12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineConnectingLine: {
    width: 1.5,
    flex: 1,
    marginVertical: 4,
  },
  timelineStepBody: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
