import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/use-theme-color";
import { useCreateMessage } from "../../hooks/useMessages";
import { useAuthStore } from "../../store/useAuthStore";

type Channel = "EMAIL" | "WHATSAPP" | "BOTH";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 5000;
const MAX_NAME_LENGTH = 100;
const PRESET_DELAYS = [30, 60, 90, 180, 365];

interface FieldErrors {
  content?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  triggerDays?: string;
}

export default function CreateMessageScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const createMutation = useCreateMessage();
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState<Channel>("EMAIL");
  const [triggerDays, setTriggerDays] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [touched, setTouched] = useState<{
    content?: boolean;
    recipientEmail?: boolean;
    recipientPhone?: boolean;
    triggerDays?: boolean;
  }>({});

  const validateFields = (
    currentContent: string,
    currentEmail: string,
    currentPhone: string,
    currentChannel: Channel,
    currentDays: string,
  ): FieldErrors => {
    const errs: FieldErrors = {};

    if (!currentContent.trim()) {
      errs.content = "Message content is required.";
    }

    if (currentChannel === "EMAIL" || currentChannel === "BOTH") {
      if (!currentEmail.trim()) {
        errs.recipientEmail = "Recipient email address is required.";
      } else if (!EMAIL_REGEX.test(currentEmail.trim())) {
        errs.recipientEmail = "Enter a valid email address (e.g. name@domain.com).";
      }
    }

    if (currentChannel === "WHATSAPP" || currentChannel === "BOTH") {
      if (!currentPhone.trim()) {
        errs.recipientPhone = "Recipient phone is required for WhatsApp delivery.";
      } else if (!PHONE_REGEX.test(currentPhone.trim())) {
        errs.recipientPhone = "Enter phone in E.164 format (e.g. +14155552671).";
      }
    }

    if (currentDays.trim()) {
      const parsed = parseInt(currentDays.trim(), 10);
      if (isNaN(parsed) || !/^\d+$/.test(currentDays.trim())) {
        errs.triggerDays = "Please enter a valid whole number of days.";
      } else if (parsed < 1 || parsed > 3650) {
        errs.triggerDays = "Inactivity delay must be between 1 and 3,650 days.";
      }
    }

    return errs;
  };

  const fieldErrors = validateFields(
    content,
    recipientEmail,
    recipientPhone,
    deliveryChannel,
    triggerDays,
  );

  const handleBlur = (field: "content" | "recipientEmail" | "recipientPhone" | "triggerDays") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setTouched({
      content: true,
      recipientEmail: true,
      recipientPhone: true,
      triggerDays: true,
    });

    const errors = validateFields(
      content,
      recipientEmail,
      recipientPhone,
      deliveryChannel,
      triggerDays,
    );
    if (Object.keys(errors).length > 0) {
      setErrorMessage("Please resolve the highlighted errors before sealing your message.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    try {
      const payload = {
        title: title.trim() || undefined,
        content: content.trim(),
        recipientName: recipientName.trim() || undefined,
        recipientEmail:
          deliveryChannel === "EMAIL" || deliveryChannel === "BOTH"
            ? recipientEmail.trim().toLowerCase()
            : undefined,
        recipientPhone:
          deliveryChannel === "WHATSAPP" || deliveryChannel === "BOTH"
            ? recipientPhone.trim()
            : undefined,
        deliveryChannel,
        triggerAfterDays: triggerDays.trim() ? parseInt(triggerDays.trim(), 10) : undefined,
      };

      await createMutation.mutateAsync(payload);

      if (Platform.OS === "web") {
        router.replace("/(tabs)/messages");
      } else {
        Alert.alert(
          "Message Armed & Sealed",
          "Your message has been encrypted and armed in your vault. It will remain strictly confidential until inactivity threshold is reached.",
          [
            {
              text: "Done",
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
        Alert.alert("Sealing Failed", msg);
      }
    }
  };

  const loading = createMutation.isPending;

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Security Chamber Banner */}
          <View
            style={[
              styles.securityBanner,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? "rgba(56, 189, 248, 0.2)" : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.securityIconBox,
                { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
              ]}
            >
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.securityTitle, { color: colors.text }]}>
                Encrypted Vault Chamber
              </Text>
              <Text style={[styles.securityDesc, { color: colors.textMuted }]}>
                Zero-Knowledge AES-256-GCM. Recipients are never alerted or notified until your switch triggers.
              </Text>
            </View>
          </View>

          {errorMessage ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.dangerSurface,
                  borderColor: colors.danger,
                },
              ]}
              accessibilityRole="alert"
            >
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={[styles.errorBannerText, { color: colors.danger }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Section 1: Message Payload */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Message Payload</Text>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Message Subject / Title (Optional)</Text>
                {title.length > 0 && (
                  <Text style={[styles.charCounter, { color: colors.textSubtle }]}>
                    {title.length}/{MAX_TITLE_LENGTH}
                  </Text>
                )}
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Master Vault Password / Important Instructions"
                placeholderTextColor={colors.textSubtle}
                value={title}
                onChangeText={setTitle}
                maxLength={MAX_TITLE_LENGTH}
                returnKeyType="next"
                accessibilityLabel="Message Title"
              />
            </View>

            {/* Content */}
            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Confidential Message Body (Required)</Text>
                <Text
                  style={[
                    styles.charCounter,
                    {
                      color:
                        content.length >= MAX_CONTENT_LENGTH
                          ? colors.danger
                          : content.length >= MAX_CONTENT_LENGTH * 0.9
                            ? colors.warning
                            : colors.textSubtle,
                    },
                  ]}
                >
                  {content.length}/{MAX_CONTENT_LENGTH}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor:
                      touched.content && fieldErrors.content ? colors.danger : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter confidential instructions, credentials, or personal farewell. This will remain sealed until your inactivity threshold expires."
                placeholderTextColor={colors.textSubtle}
                value={content}
                onChangeText={(text) => {
                  setContent(text);
                  if (errorMessage) setErrorMessage("");
                }}
                onBlur={() => handleBlur("content")}
                maxLength={MAX_CONTENT_LENGTH}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                accessibilityLabel="Message Content"
                aria-invalid={!!(touched.content && fieldErrors.content)}
              />
              {touched.content && fieldErrors.content ? (
                <View style={styles.inlineErrorRow} accessibilityRole="alert">
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={[styles.inlineErrorText, { color: colors.danger }]}>
                    {fieldErrors.content}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Section 2: Delivery Channels */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="paper-plane-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Route</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Choose how Last Words will autonomously dispatch this message when your switch triggers:
            </Text>

            <View style={styles.channelGrid}>
              {/* Email Channel */}
              <TouchableOpacity
                style={[
                  styles.channelOption,
                  {
                    backgroundColor:
                      deliveryChannel === "EMAIL"
                        ? colors.primarySurface
                        : colors.surfaceRaised,
                    borderColor:
                      deliveryChannel === "EMAIL"
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setDeliveryChannel("EMAIL")}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ selected: deliveryChannel === "EMAIL" }}
                accessibilityLabel="Deliver via Email"
              >
                <View style={styles.channelOptionHeader}>
                  <Ionicons
                    name="mail"
                    size={20}
                    color={deliveryChannel === "EMAIL" ? colors.primary : colors.textMuted}
                  />
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          deliveryChannel === "EMAIL"
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    {deliveryChannel === "EMAIL" && (
                      <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                </View>
                <Text style={[styles.channelOptionTitle, { color: colors.text }]}>Email</Text>
                <Text style={[styles.channelOptionDesc, { color: colors.textMuted }]}>
                  Verified TLS-encrypted direct email dispatch
                </Text>
              </TouchableOpacity>

              {/* WhatsApp Channel */}
              <TouchableOpacity
                style={[
                  styles.channelOption,
                  {
                    backgroundColor:
                      deliveryChannel === "WHATSAPP"
                        ? colors.whatsappSurface
                        : colors.surfaceRaised,
                    borderColor:
                      deliveryChannel === "WHATSAPP"
                        ? colors.whatsapp
                        : colors.border,
                  },
                ]}
                onPress={() => setDeliveryChannel("WHATSAPP")}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ selected: deliveryChannel === "WHATSAPP" }}
                accessibilityLabel="Deliver via WhatsApp"
              >
                <View style={styles.channelOptionHeader}>
                  <Ionicons
                    name="logo-whatsapp"
                    size={20}
                    color={deliveryChannel === "WHATSAPP" ? colors.whatsapp : colors.textMuted}
                  />
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          deliveryChannel === "WHATSAPP"
                            ? colors.whatsapp
                            : colors.border,
                      },
                    ]}
                  >
                    {deliveryChannel === "WHATSAPP" && (
                      <View style={[styles.radioDot, { backgroundColor: colors.whatsapp }]} />
                    )}
                  </View>
                </View>
                <Text style={[styles.channelOptionTitle, { color: colors.text }]}>WhatsApp</Text>
                <Text style={[styles.channelOptionDesc, { color: colors.textMuted }]}>
                  Instant direct message via Meta Cloud API
                </Text>
              </TouchableOpacity>

              {/* Dual Channel */}
              <TouchableOpacity
                style={[
                  styles.channelOption,
                  {
                    backgroundColor:
                      deliveryChannel === "BOTH"
                        ? "rgba(129, 140, 248, 0.12)"
                        : colors.surfaceRaised,
                    borderColor:
                      deliveryChannel === "BOTH"
                        ? "#818CF8"
                        : colors.border,
                  },
                ]}
                onPress={() => setDeliveryChannel("BOTH")}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="radio"
                accessibilityState={{ selected: deliveryChannel === "BOTH" }}
                accessibilityLabel="Deliver via Both Email and WhatsApp"
              >
                <View style={styles.channelOptionHeader}>
                  <Ionicons
                    name="paper-plane"
                    size={20}
                    color={deliveryChannel === "BOTH" ? "#818CF8" : colors.textMuted}
                  />
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          deliveryChannel === "BOTH"
                            ? "#818CF8"
                            : colors.border,
                      },
                    ]}
                  >
                    {deliveryChannel === "BOTH" && (
                      <View style={[styles.radioDot, { backgroundColor: "#818CF8" }]} />
                    )}
                  </View>
                </View>
                <Text style={[styles.channelOptionTitle, { color: colors.text }]}>Dual Resilience</Text>
                <Text style={[styles.channelOptionDesc, { color: colors.textMuted }]}>
                  Simultaneous dispatch via both channels
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 3: Recipient Destination */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Designated Recipient</Text>
            </View>

            {/* Recipient Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Recipient Full Name (Optional)</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Alice Walker"
                placeholderTextColor={colors.textSubtle}
                value={recipientName}
                onChangeText={setRecipientName}
                maxLength={MAX_NAME_LENGTH}
                returnKeyType="next"
                autoCapitalize="words"
                accessibilityLabel="Recipient Name"
              />
            </View>

            {/* Recipient Email (if EMAIL or BOTH) */}
            {(deliveryChannel === "EMAIL" || deliveryChannel === "BOTH") && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  Recipient Email Address (Required)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor:
                        touched.recipientEmail && fieldErrors.recipientEmail
                          ? colors.danger
                          : colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="alice@example.com"
                  placeholderTextColor={colors.textSubtle}
                  value={recipientEmail}
                  onChangeText={(text) => {
                    setRecipientEmail(text);
                    if (errorMessage) setErrorMessage("");
                  }}
                  onBlur={() => handleBlur("recipientEmail")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  accessibilityLabel="Recipient Email"
                  aria-invalid={!!(touched.recipientEmail && fieldErrors.recipientEmail)}
                />
                {touched.recipientEmail && fieldErrors.recipientEmail ? (
                  <View style={styles.inlineErrorRow} accessibilityRole="alert">
                    <Ionicons name="alert-circle" size={14} color={colors.danger} />
                    <Text style={[styles.inlineErrorText, { color: colors.danger }]}>
                      {fieldErrors.recipientEmail}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Recipient Phone (if WHATSAPP or BOTH) */}
            {(deliveryChannel === "WHATSAPP" || deliveryChannel === "BOTH") && (
              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>
                  Recipient WhatsApp Number (E.164 Required)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor:
                        touched.recipientPhone && fieldErrors.recipientPhone
                          ? colors.danger
                          : colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="+14155552671"
                  placeholderTextColor={colors.textSubtle}
                  value={recipientPhone}
                  onChangeText={(text) => {
                    setRecipientPhone(text);
                    if (errorMessage) setErrorMessage("");
                  }}
                  onBlur={() => handleBlur("recipientPhone")}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  accessibilityLabel="Recipient WhatsApp Phone"
                  aria-invalid={!!(touched.recipientPhone && fieldErrors.recipientPhone)}
                />
                {touched.recipientPhone && fieldErrors.recipientPhone ? (
                  <View style={styles.inlineErrorRow} accessibilityRole="alert">
                    <Ionicons name="alert-circle" size={14} color={colors.danger} />
                    <Text style={[styles.inlineErrorText, { color: colors.danger }]}>
                      {fieldErrors.recipientPhone}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.fieldHelper, { color: colors.textSubtle }]}>
                  Include country code with leading + (e.g. +1 for US/Canada, +44 for UK).
                </Text>
              </View>
            )}
          </View>

          {/* Section 4: Custom Inactivity Delay */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="timer-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Custom Inactivity Delay (Optional)</Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Inherits your account threshold ({user?.defaultTriggerAfterDays || 365} days) by default. Set custom days if this message should dispatch earlier or later:
            </Text>

            <View style={styles.presetRow}>
              {PRESET_DELAYS.map((preset) => {
                const isSelected = parseInt(triggerDays, 10) === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceRaised,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setTriggerDays(preset.toString())}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`${preset} days custom delay`}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        {
                          color: isSelected
                            ? (isDark ? "#080C14" : "#FFFFFF")
                            : colors.textMuted,
                          fontWeight: isSelected ? "800" : "600",
                        },
                      ]}
                    >
                      {preset}d
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor:
                    touched.triggerDays && fieldErrors.triggerDays
                      ? colors.danger
                      : colors.border,
                  color: colors.text,
                  marginTop: 10,
                },
              ]}
              placeholder={`Account default (${user?.defaultTriggerAfterDays || 365} days)`}
              placeholderTextColor={colors.textSubtle}
              value={triggerDays}
              onChangeText={(text) => {
                setTriggerDays(text);
                if (errorMessage) setErrorMessage("");
              }}
              onBlur={() => handleBlur("triggerDays")}
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="done"
              accessibilityLabel="Custom Trigger Days"
              aria-invalid={!!(touched.triggerDays && fieldErrors.triggerDays)}
            />
            {touched.triggerDays && fieldErrors.triggerDays ? (
              <View style={styles.inlineErrorRow} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={14} color={colors.danger} />
                <Text style={[styles.inlineErrorText, { color: colors.danger }]}>
                  {fieldErrors.triggerDays}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Section 5: Recipient Dispatch Simulation Preview */}
          <TouchableOpacity
            style={[
              styles.previewToggleCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setShowPreview((p) => !p)}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Toggle Recipient Dispatch Preview"
            accessibilityState={{ expanded: showPreview }}
          >
            <View style={styles.previewToggleLeft}>
              <View
                style={[
                  styles.previewIconBox,
                  { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
                ]}
              >
                <Ionicons
                  name={showPreview ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewToggleTitle, { color: colors.text }]}>
                  Recipient Delivery Preview
                </Text>
                <Text style={[styles.previewToggleSub, { color: colors.textMuted }]}>
                  Simulate what {recipientName || "recipient"} will see upon dispatch
                </Text>
              </View>
            </View>
            <Ionicons
              name={showPreview ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {showPreview && (
            <View
              style={[
                styles.previewContainer,
                {
                  backgroundColor: isDark ? "#090D16" : "#F8FAFC",
                  borderColor: isDark ? "rgba(56, 189, 248, 0.25)" : colors.border,
                },
              ]}
            >
              <View style={styles.previewHeader}>
                <Ionicons name="lock-closed" size={14} color={colors.primary} />
                <Text style={[styles.previewHeaderTitle, { color: colors.primary }]}>
                  AUTONOMOUS DISPATCH PREVIEW
                </Text>
              </View>
              <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.previewField, { color: colors.textMuted }]}>
                To: <Text style={{ color: colors.text, fontWeight: "600" }}>{recipientName || "Designated Recipient"} &lt;{recipientEmail || recipientPhone || "recipient-address"}&gt;</Text>
              </Text>
              <Text style={[styles.previewField, { color: colors.textMuted }]}>
                Subject: <Text style={{ color: colors.text, fontWeight: "700" }}>{title || "Confidential Dispatch from Last Words"}</Text>
              </Text>
              <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.previewContent, { color: colors.text }]}>
                {content || "[Your confidential message payload will appear here...]"}
              </Text>
              <View style={styles.previewFooterNotice}>
                <Text style={[styles.previewFooterText, { color: colors.textSubtle }]}>
                  Dispatched automatically by Last Words Dead Man's Switch after inactivity threshold was reached.
                </Text>
              </View>
            </View>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Seal & Arm in Vault"
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            {loading ? (
              <ActivityIndicator color={isDark ? "#080C14" : "#FFFFFF"} />
            ) : (
              <>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={isDark ? "#080C14" : "#FFFFFF"}
                />
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: isDark ? "#080C14" : "#FFFFFF" },
                  ]}
                >
                  Seal & Arm in Vault
                </Text>
              </>
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
    padding: 16,
    paddingBottom: 48,
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  securityIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  securityDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  charCounter: {
    fontSize: 11,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 130,
  },
  inlineErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  inlineErrorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  fieldHelper: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
  channelGrid: {
    gap: 10,
  },
  channelOption: {
    borderWidth: 1.2,
    borderRadius: 14,
    padding: 14,
  },
  channelOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  channelOptionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  channelOptionDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  presetChipText: {
    fontSize: 12,
  },
  previewToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    marginBottom: 14,
  },
  previewToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  previewIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  previewToggleTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  previewToggleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  previewContainer: {
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  previewDivider: {
    height: 1,
    marginVertical: 10,
  },
  previewField: {
    fontSize: 13,
    marginBottom: 4,
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 8,
  },
  previewFooterNotice: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  previewFooterText: {
    fontSize: 11,
    fontStyle: "italic",
    lineHeight: 15,
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
