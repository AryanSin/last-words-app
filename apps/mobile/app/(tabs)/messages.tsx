import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useTheme } from "../../hooks/use-theme-color";
import { MessageItem, useDeleteMessage, useMessages } from "../../hooks/useMessages";

export default function MessagesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // TanStack Query: Fetch messages (auto-cached and synchronized)
  const { data, isLoading, isRefetching, refetch } = useMessages(1, 50);
  const deleteMutation = useDeleteMessage();

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const messages = data?.messages || [];

  const performDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteTargetId(null);
    } catch (err: any) {
      if (Platform.OS !== "web") {
        Alert.alert("Delete Failed", err.message || "Failed to delete message");
      }
    }
  };

  const renderStatusBadge = (item: MessageItem) => {
    switch (item.status) {
      case "SENT":
        return (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: colors.successSurface,
                borderColor: colors.success,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.success }]}>
              DELIVERED
            </Text>
          </View>
        );
      case "FAILED":
        return (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: colors.dangerSurface,
                borderColor: colors.danger,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.danger }]}>
              FAILED
            </Text>
          </View>
        );
      case "PENDING":
      default:
        return (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: colors.warningSurface,
                borderColor: colors.warning,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.warning }]}>
              {item.daysRemaining !== undefined
                ? `${item.daysRemaining}D LEFT`
                : "PENDING"}
            </Text>
          </View>
        );
    }
  };

  const renderItem = ({ item }: { item: MessageItem }) => {
    const isEditable = item.status !== "SENT";

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.push(`/messages/${item.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title || "Untitled Message"}</Text>
              <Text style={[styles.cardRecipient, { color: colors.textMuted }]}>
                To:{" "}
                {item.recipientName ||
                  item.recipientEmail ||
                  item.recipientPhone ||
                  "Specified Recipient"}
              </Text>
            </View>
            {renderStatusBadge(item)}
          </View>

          <Text style={[styles.cardPreview, { color: colors.textMuted }]} numberOfLines={3}>
            {item.content}
          </Text>
        </TouchableOpacity>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.footerInfo}>
            <Ionicons
              name={
                item.deliveryChannel === "WHATSAPP"
                  ? "logo-whatsapp"
                  : item.deliveryChannel === "BOTH"
                    ? "paper-plane"
                    : "mail"
              }
              size={14}
              color={colors.textMuted}
            />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>Channel: {item.deliveryChannel}</Text>
            {item.triggerAfterDays ? (
              <Text style={[styles.footerText, { color: colors.textMuted }]}>• Custom: {item.triggerAfterDays}d</Text>
            ) : (
              <Text style={[styles.footerText, { color: colors.textMuted }]}>• Account Default</Text>
            )}
          </View>

          <View style={styles.actionButtons}>
            {isEditable && (
              <TouchableOpacity
                onPress={() => router.push(`/messages/${item.id}/edit`)}
                style={[styles.actionButton, { backgroundColor: colors.primarySurface }]}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setDeleteTargetId(item.id)}
              style={[styles.actionButton, { backgroundColor: colors.dangerSurface }]}
              disabled={deleteMutation.isPending}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-open-outline" size={48} color={colors.textSubtle} />
              <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>Your Vault is Empty</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSubtle }]}>
                Create your first message to be dispatched upon inactivity.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Create Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        onPress={() => router.push("/messages/create")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Cross-Platform Custom Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteTargetId !== null}
        title="Delete Vault Message"
        message="Are you sure you want to permanently delete this message? It will be removed from your vault and cannot be recovered."
        confirmText="Delete Message"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
        iconName="trash-outline"
        onConfirm={async () => {
          if (deleteTargetId !== null) {
            await performDelete(deleteTargetId);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardRecipient: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 10,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 30,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
