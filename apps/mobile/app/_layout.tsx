import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import "react-native-reanimated";
import { Colors } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
import { useAuthStore } from "../store/useAuthStore";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const scheme = useColorScheme() ?? "dark";
  const colors = Colors[scheme];

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

  useEffect(() => {
    // Initialize authentication from storage
    initAuth();

    // Refresh last login when user returns to active app
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        performBackgroundCheckIn();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [initAuth, performBackgroundCheckIn]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen
            name="messages/create"
            options={{
              presentation: "modal",
              headerShown: true,
              title: "New Message",
              headerStyle: { backgroundColor: colors.headerBackground },
              headerTintColor: colors.headerText,
            }}
          />
          <Stack.Screen
            name="messages/[id]"
            options={{
              headerShown: true,
              title: "Message Details",
              headerStyle: { backgroundColor: colors.headerBackground },
              headerTintColor: colors.headerText,
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
            }}
          />
        </Stack>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
