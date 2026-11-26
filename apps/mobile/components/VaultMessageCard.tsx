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

  const getCardBorderColor = () => {
    if (item.status === "FAILED") return colors.dangerBorder;
    if (item.status === "SENT") return colors.successBorder;
    if (isUrgent) return colors.warning;
    return colors.border;
  };

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
          borderColor: getCardBorderColor(),
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.title || "Untitled message"} to ${item.recipientName || item.recipientEmail || "Designated Recipient"}, status ${item.status === "SENT" ? "delivered" : item.status === "FAILED" ? "delivery failed" : `${item.daysRemaining !== undefined ? `${item.daysRemaining} days remaining` : "armed"}`}`}
        accessibilityHint="Tap to view message details"
      >
        {/* Header: Title and Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.titleWrapper}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
              {item.title || "Untitled Last Words Message"}
            </Text>
            <Text style={[styles.recipient, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
              To: {item.recipientName || item.recipientEmail || "Designated Recipient"}
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
          <Text style={[styles.previewText, { color: colors.textMuted }]} numberOfLines={2} ellipsizeMode="tail">
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
                backgroundColor: colors.primarySurface,
                borderColor: colors.primaryBorder,
              },
            ]}
          >
            <Ionicons
              name="mail"
              size={12}
              color={colors.primary}
            />
            <Text
              style={[
                styles.channelChipText,
                {
                  color: colors.primary,
                },
              ]}
            >
              EMAIL
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Edit message"
              accessibilityHint="Opens editor for this message"
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onDelete}
            style={[styles.actionBtn, { backgroundColor: colors.dangerSurface }]}
            disabled={isDeleting}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Delete message"
            accessibilityHint="Permanently deletes this message"
            accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
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
    minWidth: 0,
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
    flexShrink: 0,
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
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  channelChip: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  channelChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  triggerText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
});

