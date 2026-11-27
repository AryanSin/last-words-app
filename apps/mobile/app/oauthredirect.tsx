import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../hooks/use-theme-color";
import { useAuthStore } from "../store/useAuthStore";

export default function OAuthRedirectScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace("/(tabs)");
      return;
    }

    // Fallback: if OAuth did not complete (e.g. cancelled or errored), return to login
    const timer = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 5000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textMuted }]}>
        Completing Google Sign-In...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",
  },
});
