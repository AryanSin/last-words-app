import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../hooks/use-theme-color";
import { useMessage, useUpdateMessage } from "../../../hooks/useMessages";

type Channel = "EMAIL" | "WHATSAPP" | "BOTH";

export default function EditMessageScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const messageId = id ? parseInt(id, 10) : undefined;

  const { data: message, isLoading: isFetching, error: fetchError } = useMessage(messageId);
  const updateMutation = useUpdateMessage();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState<Channel>("EMAIL");
  const [triggerDays, setTriggerDays] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize form state when message is loaded
  useEffect(() => {
    if (message) {
      if (message.status === "SENT") {
        if (Platform.OS !== "web") {
          Alert.alert("Cannot Edit", "This message has already been delivered and cannot be edited.");
        }
        router.back();
        return;
      }

      setTitle(message.title || "");
      setContent(message.content || "");
      setRecipientName(message.recipientName || "");
      setRecipientEmail(message.recipientEmail || "");
      setRecipientPhone(message.recipientPhone || "");
      setDeliveryChannel(message.deliveryChannel || "EMAIL");
      setTriggerDays(
        message.triggerAfterDays !== null && message.triggerAfterDays !== undefined
          ? message.triggerAfterDays.toString()
          : "",
      );
    }
  }, [message]);

  const handleSubmit = async () => {
    setErrorMessage("");

    if (!content.trim()) {
      const err = "Message content cannot be empty.";
      setErrorMessage(err);
      if (Platform.OS !== "web") Alert.alert("Validation Error", err);
      return;
    }

    if (
      (deliveryChannel === "EMAIL" || deliveryChannel === "BOTH") &&
      !recipientEmail.trim()
    ) {
      const err = "Please provide a valid recipient email address.";
      setErrorMessage(err);
      if (Platform.OS !== "web") Alert.alert("Validation Error", err);
      return;
    }

    if (
      (deliveryChannel === "WHATSAPP" || deliveryChannel === "BOTH") &&
      !recipientPhone.trim()
    ) {
      const err = "Please provide a recipient WhatsApp number in E.164 format (e.g. +14155552671).";
      setErrorMessage(err);
      if (Platform.OS !== "web") Alert.alert("Validation Error", err);
      return;
    }

    if (!messageId) return;

    try {
      const payload = {
        title: title.trim() || undefined,
        content: content.trim(),
        recipientName: recipientName.trim() || undefined,
        recipientEmail:
          deliveryChannel === "EMAIL" || deliveryChannel === "BOTH"
            ? recipientEmail.trim()
            : undefined,
        recipientPhone:
          deliveryChannel === "WHATSAPP" || deliveryChannel === "BOTH"
            ? recipientPhone.trim()
            : undefined,
        deliveryChannel,
        triggerAfterDays: triggerDays.trim() ? parseInt(triggerDays.trim(), 10) : undefined,
      };

      await updateMutation.mutateAsync({ id: messageId, body: payload });

      if (Platform.OS === "web") {
        router.replace("/(tabs)/messages");
      } else {
        Alert.alert(
          "Message Updated",
          "Your vault message has been successfully updated.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(tabs)/messages"),
            },
          ],
        );
        router.replace("/(tabs)/messages");
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to update message.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") {
        Alert.alert("Update Failed", msg);
      }
    }
  };

  if (isFetching) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (fetchError || !message) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {(fetchError as Error)?.message || "Failed to load message."}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isSaving = updateMutation.isPending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {message.status === "FAILED" && (
            <View style={[styles.failedBanner, { backgroundColor: colors.warningSurface, borderColor: colors.warning }]}>
              <Ionicons name="refresh-circle" size={20} color={colors.warning} />
              <Text style={[styles.failedBannerText, { color: colors.warning }]}>
                This message previously failed delivery. Saving changes will reset it to Pending and re-enable automated delivery.
              </Text>
            </View>
          )}

          {errorMessage ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerSurface, borderColor: colors.danger }]}>
              <Text style={[styles.errorBannerText, { color: colors.danger }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Channel Selector */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Delivery Channel</Text>
            <View style={[styles.channelRow, { backgroundColor: colors.surfaceRaised }]}>
              {(["EMAIL", "WHATSAPP", "BOTH"] as Channel[]).map((ch) => {
                const isSelected = deliveryChannel === ch;
                return (
                  <TouchableOpacity
                    key={ch}
                    style={[
                      styles.channelTab,
                      isSelected && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setDeliveryChannel(ch)}
                  >
                    <Text
                      style={[
                        styles.channelText,
                        { color: isSelected ? "#FFFFFF" : colors.textMuted },
                      ]}
                    >
                      {ch}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Message Title (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Master Vault Password / Important Instructions"
              placeholderTextColor={colors.textSubtle}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Content */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Message Content (Required)</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Write your message here..."
              placeholderTextColor={colors.textSubtle}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Recipient Details */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Recipient Name (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Bob Johnson"
              placeholderTextColor={colors.textSubtle}
              value={recipientName}
              onChangeText={setRecipientName}
            />
          </View>

          {(deliveryChannel === "EMAIL" || deliveryChannel === "BOTH") && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Recipient Email (Required for Email delivery)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="recipient@example.com"
                placeholderTextColor={colors.textSubtle}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          {(deliveryChannel === "WHATSAPP" || deliveryChannel === "BOTH") && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Recipient WhatsApp (Required, E.164 format e.g. +14155552671)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="+14155552671"
                placeholderTextColor={colors.textSubtle}
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}

          {/* Custom Trigger Override */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Custom Inactivity Days Override (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Leave blank to use account default"
              placeholderTextColor={colors.textSubtle}
              value={triggerDays}
              onChangeText={setTriggerDays}
              keyboardType="number-pad"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              isSaving && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 20,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  failedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  failedBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  errorBanner: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
  },
  channelRow: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
  },
  channelTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  channelText: {
    fontSize: 13,
    fontWeight: "600",
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
