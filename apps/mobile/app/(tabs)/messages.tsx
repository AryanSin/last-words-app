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
import { VaultMessageCard } from "../../components/VaultMessageCard";
import { useTheme } from "../../hooks/use-theme-color";
import { MessageItem, useDeleteMessage, useMessages } from "../../hooks/useMessages";

export default function MessagesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // TanStack Query: Fetch messages (auto-cached and synchronized)
  const { data, isLoading, isRefetching, refetch } = useMessages(1, 50);
  const deleteMutation = useDeleteMessage();

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const rawMessages = data?.messages || [];
  const filteredMessages = rawMessages;

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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTitleRow}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Last Words Messages</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {rawMessages.length} {rawMessages.length === 1 ? "message" : "messages"} scheduled
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.composeBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/messages/create")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.composeBtnText}>Compose</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <VaultMessageCard
              item={item}
              onPress={() => router.push(`/messages/${item.id}`)}
              onEdit={() => router.push(`/messages/${item.id}/edit`)}
              onDelete={() => setDeleteTargetId(item.id)}
              isDeleting={deleteMutation.isPending && deleteTargetId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconBox,
                  { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                ]}
              >
                <Ionicons name="mail-open-outline" size={40} color={colors.textSubtle} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Create your first message to be dispatched upon confirmed inactivity.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/messages/create")}
              >
                <Text style={styles.emptyBtnText}>Create Last Words Message</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
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
        title="Delete Last Words Message"
        message="Are you sure you want to permanently delete this message? It will be removed from your scheduled switch and cannot be recovered."
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
    paddingBottom: 90,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  composeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  composeBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 30,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: 24,
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
