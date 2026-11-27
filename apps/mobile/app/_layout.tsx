import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme as NavDarkTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import {
  DarkTheme as ExpoDarkTheme,
  ThemeProvider as ExpoThemeProvider,
  Stack,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
import { useAuthStore } from "../store/useAuthStore";

WebBrowser.maybeCompleteAuthSession();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  const initAuth = useAuthStore((s) => s.initAuth);
  const performBackgroundCheckIn = useAuthStore((s) => s.performBackgroundCheckIn);
  const trySilentTokenRefresh = useAuthStore((s) => s.trySilentTokenRefresh);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const segments = useSegments();
  const router = useRouter();

  // Global Auth Guard: automatically navigates to login on session expiration, or to tabs on login
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  useEffect(() => {
    // Initialize authentication from storage
    initAuth();

    // Refresh last login and slide mobile refresh token when user returns to active app
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        performBackgroundCheckIn();
        trySilentTokenRefresh().catch(() => {});
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [initAuth, performBackgroundCheckIn, trySilentTokenRefresh]);

  const vaultTheme = {
    ...NavDarkTheme,
    ...ExpoDarkTheme,
    dark: true,
    colors: {
      ...NavDarkTheme.colors,
      ...ExpoDarkTheme.colors,
      primary: colors.primary,
      background: "#080C14",
      card: "#090D16",
      text: "#F8FAFC",
      border: "#1E293B",
      notification: "#EF4444",
    },
  };

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: "#080C14" }}>
      <QueryClientProvider client={queryClient}>
        <NavThemeProvider value={vaultTheme}>
          <ExpoThemeProvider value={vaultTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#080C14" },
              }}
            >
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "#080C14" },
                }}
              />
              <Stack.Screen
                name="(auth)/login"
                options={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "#080C14" },
                }}
              />
              <Stack.Screen
                name="messages/create"
                options={{
                  presentation: "modal",
                  headerShown: true,
                  title: "New Message",
                  headerStyle: { backgroundColor: colors.headerBackground },
                  headerTintColor: colors.headerText,
                  contentStyle: { backgroundColor: "#080C14" },
                }}
              />
              <Stack.Screen
                name="messages/[id]"
                options={{
                  headerShown: true,
                  title: "Message Details",
                  headerStyle: { backgroundColor: colors.headerBackground },
                  headerTintColor: colors.headerText,
                  contentStyle: { backgroundColor: "#080C14" },
                }}
              />
              <Stack.Screen
                name="messages/[id]/edit"
                options={{
                  presentation: "modal",
                  headerShown: true,
                  title: "Edit Message",
                  headerStyle: { backgroundColor: colors.headerBackground },
                  headerTintColor: colors.headerText,
                  contentStyle: { backgroundColor: "#080C14" },
                }}
              />
            </Stack>
            <StatusBar style="light" />
          </ExpoThemeProvider>
        </NavThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
