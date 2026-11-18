import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useTheme } from "../../hooks/use-theme-color";
import { useCreateMessage } from "../../hooks/useMessages";

type Channel = "EMAIL" | "WHATSAPP" | "BOTH";

export default function CreateMessageScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const createMutation = useCreateMessage();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const deliveryChannel: Channel = "EMAIL";
  const [triggerDays, setTriggerDays] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    setErrorMessage("");

    if (!content.trim()) {
      const err = "Message content cannot be empty.";
      setErrorMessage(err);
      if (Platform.OS !== "web") Alert.alert("Validation Error", err);
      return;
    }

    if (!recipientEmail.trim()) {
      const err = "Please provide a valid recipient email address.";
      setErrorMessage(err);
      if (Platform.OS !== "web") Alert.alert("Validation Error", err);
      return;
    }

    try {
      const payload = {
        title: title.trim() || undefined,
        content: content.trim(),
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim(),
        deliveryChannel: "EMAIL" as Channel,
        triggerAfterDays: triggerDays.trim() ? parseInt(triggerDays.trim(), 10) : undefined,
      };

      await createMutation.mutateAsync(payload);

      if (Platform.OS === "web") {
        router.replace("/(tabs)/messages");
      } else {
        Alert.alert(
          "Message Scheduled",
          "Your message has been securely encrypted with AES-256 GCM and armed.",
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
      const msg = err?.message || "Failed to create message. Please check input parameters.";
      setErrorMessage(msg);
      if (Platform.OS !== "web") {
        Alert.alert("Save Failed", msg);
      }
    }
  };

  const loading = createMutation.isPending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {errorMessage ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.dangerSurface,
                  borderColor: colors.danger,
                },
              ]}
            >
              <Text style={[styles.errorBannerText, { color: colors.danger }]}>{errorMessage}</Text>
            </View>
          ) : null}

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
              placeholder="Write your message here... This will remain confidential until inactivity threshold is reached."
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

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Recipient Email (Required for delivery)</Text>
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
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Last Words Message</Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
