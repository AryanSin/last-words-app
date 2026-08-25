import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useTheme } from "../../hooks/use-theme-color";
import { useDeleteMessage, useMessage } from "../../hooks/useMessages";

export default function MessageDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const messageId = id ? parseInt(id, 10) : undefined;

  const { data: message, isLoading, error } = useMessage(messageId);
  const deleteMutation = useDeleteMessage();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isEditable = message && message.status !== "SENT";

  const performDelete = async () => {
    if (!messageId) return;
    try {
      await deleteMutation.mutateAsync(messageId);
      setShowDeleteModal(false);
      router.replace("/(tabs)/messages");
    } catch (err: any) {
      if (Platform.OS !== "web") {
        Alert.alert("Delete Failed", err.message || "Failed to delete message");
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !message) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Message Not Found</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textMuted }]}>
            {(error as Error)?.message || "The requested vault message could not be loaded."}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>Return to Vault</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const createdDate = message.createdAt ? new Date(message.createdAt) : null;
  const sentDate = message.sentAt ? new Date(message.sentAt) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Title & Status */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{message.title || "Untitled Vault Message"}</Text>
            {message.status === "SENT" ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.successSurface, borderColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>DELIVERED</Text>
              </View>
            ) : message.status === "FAILED" ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.dangerSurface, borderColor: colors.danger }]}>
                <Ionicons name="alert-circle" size={14} color={colors.danger} />
                <Text style={[styles.statusText, { color: colors.danger }]}>FAILED</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: colors.warningSurface, borderColor: colors.warning }]}>
                <Ionicons name="time" size={14} color={colors.warning} />
                <Text style={[styles.statusText, { color: colors.warning }]}>
                  {message.daysRemaining !== undefined
                    ? `${message.daysRemaining}D UNTIL TRIGGER`
                    : "PENDING"}
                </Text>
              </View>
            )}
          </View>

          {message.status === "SENT" && sentDate && (
            <View style={[styles.sentInfoRow, { borderTopColor: colors.border }]}>
              <Ionicons name="send" size={14} color={colors.success} />
              <Text style={[styles.sentInfoText, { color: colors.success }]}>
                Dispatched on {sentDate.toLocaleDateString()} at{" "}
                {sentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          )}
        </View>

        {/* Failed Delivery Notice */}
        {message.status === "FAILED" && (
          <View style={[styles.failedBanner, { backgroundColor: colors.dangerSurface, borderColor: colors.danger }]}>
            <Ionicons name="warning" size={22} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.failedBannerTitle, { color: colors.danger }]}>Delivery Failed</Text>
              <Text style={[styles.failedBannerText, { color: colors.textMuted }]}>
                {message.lastError ||
                  "The dispatch could not be completed after maximum retries. You can edit the recipient info to retry."}
              </Text>
            </View>
          </View>
        )}

        {/* Full Message Content Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.textMuted }]}>Message Content</Text>
          <View style={[styles.contentBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.contentText, { color: colors.text }]} selectable>
              {message.content}
            </Text>
          </View>
        </View>

        {/* Recipient & Channel Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.textMuted }]}>Recipient & Delivery Channels</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Recipient Name</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{message.recipientName || "None specified"}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Delivery Channel</Text>
            <View style={[styles.channelBadge, { backgroundColor: colors.primarySurface }]}>
              <Ionicons
                name={
                  message.deliveryChannel === "WHATSAPP"
                    ? "logo-whatsapp"
                    : message.deliveryChannel === "BOTH"
                      ? "paper-plane"
                      : "mail"
                }
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.channelBadgeText, { color: colors.primary }]}>{message.deliveryChannel}</Text>
            </View>
          </View>

          {message.recipientEmail ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Recipient Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} selectable>
                  {message.recipientEmail}
                </Text>
              </View>
            </>
          ) : null}

          {message.recipientPhone ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Recipient WhatsApp</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} selectable>
                  {message.recipientPhone}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Inactivity Threshold & Timestamps */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardSectionTitle, { color: colors.textMuted }]}>Trigger & Timestamps</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Inactivity Delay</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {message.triggerAfterDays
                ? `${message.triggerAfterDays} Days (Custom override)`
                : "Account Default"}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Vaulted On</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {createdDate
                ? `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "N/A"}
            </Text>
          </View>

          {sentDate && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Delivered On</Text>
                <Text style={[styles.infoValue, { color: colors.success }]}>
                  {sentDate.toLocaleDateString()}{" "}
                  {sentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Delivery Audit History */}
        {message.deliveryEvents && message.deliveryEvents.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardSectionTitle, { color: colors.textMuted }]}>Delivery Audit Log</Text>
            {message.deliveryEvents.map((evt, idx) => (
              <View key={evt.id || idx} style={[styles.eventItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventChannel}>
                    <Ionicons
                      name={evt.channel === "WHATSAPP" ? "logo-whatsapp" : "mail"}
                      size={14}
                      color={colors.textMuted}
                    />
                    <Text style={[styles.eventChannelText, { color: colors.text }]}>{evt.channel}</Text>
                    <Text style={[styles.eventRecipient, { color: colors.textMuted }]}>({evt.recipient})</Text>
                  </View>
                  <View
                    style={[
                      styles.eventBadge,
                      {
                        backgroundColor: evt.success ? colors.successSurface : colors.dangerSurface,
                        borderColor: evt.success ? colors.success : colors.danger,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eventBadgeText,
                        { color: evt.success ? colors.success : colors.danger },
                      ]}
                    >
                      {evt.success ? "SUCCESS" : "FAILED"}
                    </Text>
                  </View>
                </View>
                {evt.error && <Text style={[styles.eventError, { color: colors.danger }]}>{evt.error}</Text>}
                <Text style={[styles.eventTime, { color: colors.textSubtle }]}>
                  {new Date(evt.createdAt).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {isEditable && (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/messages/${message.id}/edit`)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Message</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.deleteButton,
              {
                backgroundColor: colors.dangerSurface,
                borderColor: colors.danger,
              },
              !isEditable && { flex: 1 },
            ]}
            onPress={() => setShowDeleteModal(true)}
            disabled={deleteMutation.isPending}
            activeOpacity={0.8}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Cross-Platform Custom Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Vault Message"
        message="Are you sure you want to permanently delete this message from your vault? This action cannot be reversed."
        confirmText="Delete Message"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        iconName="trash-outline"
        onConfirm={performDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sentInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  sentInfoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  failedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  failedBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  failedBannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  contentBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  channelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  channelBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  eventItem: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventChannel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventChannelText: {
    fontSize: 13,
    fontWeight: "600",
  },
  eventRecipient: {
    fontSize: 12,
  },
  eventBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  eventError: {
    fontSize: 12,
    marginTop: 4,
  },
  eventTime: {
    fontSize: 11,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  backButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
