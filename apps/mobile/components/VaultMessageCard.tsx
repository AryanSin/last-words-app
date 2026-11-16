import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../hooks/use-theme-color";
import { MessageItem } from "../hooks/useMessages";

interface VaultMessageCardProps {
  item: MessageItem;
  onPress: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const VaultMessageCard: React.FC<VaultMessageCardProps> = ({
  item,
  onPress,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const { colors, isDark } = useTheme();

  const isEditable = item.status !== "SENT";
  const isUrgent = (item.daysRemaining ?? 999) <= 7 && item.status === "PENDING";

  const renderStatusBadge = () => {
    switch (item.status) {
      case "SENT":
        return (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.successSurface,
                borderColor: colors.success,
              },
            ]}
          >
            <Ionicons name="checkmark-done" size={12} color={colors.success} />
            <Text style={[styles.badgeText, { color: colors.success }]}>DISPATCHED</Text>
          </View>
        );
      case "FAILED":
        return (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.dangerSurface,
                borderColor: colors.danger,
              },
            ]}
          >
            <Ionicons name="alert-circle" size={12} color={colors.danger} />
            <Text style={[styles.badgeText, { color: colors.danger }]}>FAILED</Text>
          </View>
        );
      case "PENDING":
      default:
        return (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isUrgent ? colors.warningSurface : colors.pulseEmeraldSurface,
                borderColor: isUrgent ? colors.warning : colors.pulseEmerald,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: isUrgent ? colors.warning : colors.pulseEmerald },
              ]}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isUrgent ? colors.warning : colors.pulseEmerald },
              ]}
            >
              {item.daysRemaining !== undefined
                ? `${item.daysRemaining}D REMAINING`
                : "ARMED"}
            </Text>
          </View>
        );
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isUrgent ? colors.warning : colors.border,
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {/* Header: Title and Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.titleWrapper}>
            <View style={styles.lockRow}>
              <Ionicons name="lock-closed" size={13} color={colors.primary} />
              <Text style={[styles.securityTag, { color: colors.primary }]}>
                AES-256 GCM
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item.title || "Untitled Last Words Message"}
            </Text>
            <Text style={[styles.recipient, { color: colors.textMuted }]}>
              To: {item.recipientName || item.recipientEmail || item.recipientPhone || "Designated Recipient"}
            </Text>
          </View>
          {renderStatusBadge()}
        </View>

        {/* Message preview snippet */}
        <View
          style={[
            styles.previewBox,
            { backgroundColor: isDark ? "#090D16" : "#F8FAFC", borderColor: colors.borderSubtle },
          ]}
        >
          <Text style={[styles.previewText, { color: colors.textMuted }]} numberOfLines={2}>
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Footer Details & Action Buttons */}
      <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
        <View style={styles.channelInfo}>
          <View
            style={[
              styles.channelChip,
              {
                backgroundColor:
                  item.deliveryChannel === "WHATSAPP"
                    ? "rgba(16, 185, 129, 0.12)"
                    : colors.primarySurface,
              },
            ]}
          >
            <Ionicons
              name={
                item.deliveryChannel === "WHATSAPP"
                  ? "logo-whatsapp"
                  : item.deliveryChannel === "BOTH"
                    ? "paper-plane"
                    : "mail"
              }
              size={12}
              color={item.deliveryChannel === "WHATSAPP" ? "#10B981" : colors.primary}
            />
            <Text
              style={[
                styles.channelChipText,
                {
                  color: item.deliveryChannel === "WHATSAPP" ? "#10B981" : colors.primary,
                },
              ]}
            >
              {item.deliveryChannel}
            </Text>
          </View>

          <Text style={[styles.triggerText, { color: colors.textSubtle }]}>
            {item.triggerAfterDays ? `${item.triggerAfterDays}d trigger` : "Account Default"}
          </Text>
        </View>

        <View style={styles.actions}>
          {isEditable && onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={[styles.actionBtn, { backgroundColor: colors.primarySurface }]}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onDelete}
            style={[styles.actionBtn, { backgroundColor: colors.dangerSurface }]}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  titleWrapper: {
    flex: 1,
  },
  lockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  securityTag: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  recipient: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  previewBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
  },
  channelInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  channelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  channelChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  triggerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
  },
});

