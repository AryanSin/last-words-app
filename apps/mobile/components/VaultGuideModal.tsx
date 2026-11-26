import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../hooks/use-theme-color";

export interface VaultGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

interface GuideItem {
  question: string;
  answer: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    iconName: "shield-checkmark-outline",
    question: "Are recipients notified when I write or arm a message?",
    answer:
      "No. All messages are encrypted at rest and held strictly confidential. Designated recipients are never alerted or contacted until your switch triggers.",
  },
  {
    iconName: "time-outline",
    question: "What if I travel off-grid, lose my phone, or fall ill?",
    answer:
      "You are protected by our Inactivity Safety Net. The system sends multiple advance warnings at 14 days, 7 days, and 24 hours prior to release. Any check-in from your device immediately resets the countdown.",
  },
  {
    iconName: "finger-print-outline",
    question: "How does the Life Pulse check-in work?",
    answer:
      "A single tap on 'Confirm Life Pulse' authenticates your identity with Face ID, Touch ID, or fingerprint verification and resets your timer in under two seconds.",
  },
  {
    iconName: "create-outline",
    question: "Can I update or delete a message after arming it?",
    answer:
      "Yes. As long as a message is pending, you can edit its content, change the recipient, switch delivery channels, or delete it permanently at any time.",
  },
  {
    iconName: "mail-unread-outline",
    question: "What will recipients receive upon dispatch?",
    answer:
      "Recipients receive a dignified notice via Email containing your message title, your authored instructions or farewell, and a cryptographic verification timestamp.",
  },
];

export function VaultGuideModal({ visible, onClose }: VaultGuideModalProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal={true}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: colors.primarySurface,
                    borderColor: colors.primaryBorder,
                  },
                ]}
              >
                <Ionicons name="help-buoy-outline" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Vault Guide & FAQ</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  How Last Words protects you & your messages
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close Vault Guide"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Guide Q&A Items */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {GUIDE_ITEMS.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.faqHeader}>
                  <Ionicons name={item.iconName} size={18} color={colors.primary} />
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>
                    {item.question}
                  </Text>
                </View>
                <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>
                  {item.answer}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Dismiss CTA */}
          <TouchableOpacity
            style={[
              styles.dismissButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={onClose}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close Vault Guide"
          >
            <Text style={styles.dismissButtonText}>Got It, Thanks</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6px)",
      },
    }),
  },
  modalContainer: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "82%",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollList: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 12,
  },
  faqCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    lineHeight: 18,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 26,
  },
  dismissButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  dismissButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
