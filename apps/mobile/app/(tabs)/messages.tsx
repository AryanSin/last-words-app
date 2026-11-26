import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmModal } from "../../components/ConfirmModal";
import { VaultGuideModal } from "../../components/VaultGuideModal";
import { VaultMessageCard } from "../../components/VaultMessageCard";
import { useResponsive } from "../../hooks/useResponsive";
import { useTheme } from "../../hooks/use-theme-color";
import { MessageItem, useDeleteMessage, useMessages } from "../../hooks/useMessages";

type FilterTab = "ALL" | "ARMED" | "DISPATCHED";

export default function MessagesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isWide, width } = useResponsive();

  // TanStack Query: Fetch messages (auto-cached and synchronized)
  const { data, isLoading, isRefetching, refetch } = useMessages(1, 50);
  const deleteMutation = useDeleteMessage();

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const rawMessages = data?.messages || [];

  const pendingCount = useMemo(
    () => rawMessages.filter((m) => m.status === "PENDING").length,
    [rawMessages],
  );
  const sentCount = useMemo(
    () => rawMessages.filter((m) => m.status === "SENT").length,
    [rawMessages],
  );

  const filteredMessages = useMemo(() => {
    return rawMessages.filter((item) => {
      // Tab filter
      if (activeTab === "ARMED" && item.status !== "PENDING") return false;
      if (activeTab === "DISPATCHED" && item.status !== "SENT") return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(query);
        const nameMatch = (item.recipientName || "").toLowerCase().includes(query);
        const emailMatch = (item.recipientEmail || "").toLowerCase().includes(query);
        const phoneMatch = (item.recipientPhone || "").toLowerCase().includes(query);
        const contentMatch = (item.content || "").toLowerCase().includes(query);
        return titleMatch || nameMatch || emailMatch || phoneMatch || contentMatch;
      }

      return true;
    });
  }, [rawMessages, activeTab, searchQuery]);

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
            {rawMessages.length} {rawMessages.length === 1 ? "message" : "messages"} sealed in vault
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.guideBtn,
              { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
            ]}
            onPress={() => setShowGuideModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open Vault Guide & FAQ"
          >
            <Ionicons name="help-circle-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.composeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/messages/create")}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Compose new message"
          >
            <Ionicons name="add" size={18} color={isDark ? "#080C14" : "#FFFFFF"} />
            <Text style={[styles.composeBtnText, { color: isDark ? "#080C14" : "#FFFFFF" }]}>Compose</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.textSubtle} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by title, recipient, or address..."
          placeholderTextColor={colors.textSubtle}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search Vault Messages"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear Search Query"
          >
            <Ionicons name="close-circle" size={16} color={colors.textSubtle} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Segment Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            {
              backgroundColor: activeTab === "ALL" ? colors.primarySurface : colors.surfaceRaised,
              borderColor: activeTab === "ALL" ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setActiveTab("ALL")}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "ALL" }}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: activeTab === "ALL" ? colors.primary : colors.textMuted },
            ]}
          >
            All ({rawMessages.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            {
              backgroundColor:
                activeTab === "ARMED" ? colors.pulseEmeraldSurface : colors.surfaceRaised,
              borderColor: activeTab === "ARMED" ? colors.pulseEmerald : colors.border,
            },
          ]}
          onPress={() => setActiveTab("ARMED")}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "ARMED" }}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: activeTab === "ARMED" ? colors.pulseEmerald : colors.textMuted },
            ]}
          >
            Armed ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            {
              backgroundColor:
                activeTab === "DISPATCHED" ? colors.primarySurface : colors.surfaceRaised,
              borderColor: activeTab === "DISPATCHED" ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setActiveTab("DISPATCHED")}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "DISPATCHED" }}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: activeTab === "DISPATCHED" ? colors.primary : colors.textMuted },
            ]}
          >
            Dispatched ({sentCount})
          </Text>
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
          contentContainerStyle={[
            styles.listContent,
            isWide && styles.listContentWide,
          ]}
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
                  { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
                ]}
              >
                <Ionicons name="mail-open-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery ? "No Matching Messages Found" : "No Messages Armed Yet"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {searchQuery
                  ? "Try checking for typos or searching a different recipient or keyword."
                  : "Compose a confidential message, credential instructions, or personal farewell. Recipients are never notified until your inactivity switch triggers."}
              </Text>
              <View style={styles.emptyActions}>
                {searchQuery ? (
                  <TouchableOpacity
                    style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setSearchQuery("")}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Clear Search"
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.emptyBtnText, { color: isDark ? "#080C14" : "#FFFFFF" }]}>
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                      onPress={() => router.push("/messages/create")}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Arm Your First Message"
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.emptyBtnText, { color: isDark ? "#080C14" : "#FFFFFF" }]}>
                        Arm Your First Message
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.emptySecondaryBtn,
                        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
                      ]}
                      onPress={() => setShowGuideModal(true)}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Learn How It Works"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="help-circle-outline" size={16} color={colors.textMuted} />
                      <Text style={[styles.emptySecondaryBtnText, { color: colors.text }]}>
                        Learn How It Works
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
          isWide && {
            right: Math.max(24, (width - 820) / 2 + 16),
            bottom: 32,
          },
        ]}
        onPress={() => router.push("/messages/create")}
        activeOpacity={0.85}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Compose new message"
      >
        <Ionicons name="add" size={28} color={isDark ? "#080C14" : "#FFFFFF"} />
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  listContentWide: {
    maxWidth: 820,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 110,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  guideBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
    justifyContent: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  composeBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterTabText: {
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
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptySecondaryBtn: {
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptySecondaryBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyActions: {
    marginTop: 20,
    gap: 10,
    width: "100%",
    maxWidth: 280,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
