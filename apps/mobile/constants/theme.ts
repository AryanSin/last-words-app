import { Platform } from "react-native";

export const Colors = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceRaised: "#F1F5F9",
    inputBackground: "#FFFFFF",
    card: "#FFFFFF",

    border: "#E2E8F0",
    borderSubtle: "#F1F5F9",

    text: "#0F172A",
    textMuted: "#64748B",
    textSubtle: "#94A3B8",
    textInverse: "#FFFFFF",

    primary: "#2563EB",
    primaryHover: "#1D4ED8",
    primarySurface: "rgba(37, 99, 235, 0.08)",
    primaryBorder: "#BFDBFE",
    tint: "#2563EB",

    success: "#059669",
    successSurface: "rgba(5, 150, 105, 0.1)",
    successBorder: "#A7F3D0",

    warning: "#D97706",
    warningSurface: "rgba(217, 119, 6, 0.1)",
    warningBorder: "#FDE68A",

    danger: "#DC2626",
    dangerSurface: "rgba(220, 38, 38, 0.08)",
    dangerBorder: "#FECACA",

    icon: "#64748B",
    tabIconDefault: "#64748B",
    tabIconSelected: "#2563EB",
    tabBarBackground: "#FFFFFF",
    tabBarBorder: "#E2E8F0",
    headerBackground: "#FFFFFF",
    headerText: "#0F172A",
  },
  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    surfaceRaised: "#334155",
    inputBackground: "#0F172A",
    card: "#1E293B",

    border: "#334155",
    borderSubtle: "#1E293B",

    text: "#F8FAFC",
    textMuted: "#94A3B8",
    textSubtle: "#64748B",
    textInverse: "#0F172A",

    primary: "#3B82F6",
    primaryHover: "#60A5FA",
    primarySurface: "rgba(59, 130, 246, 0.15)",
    primaryBorder: "#1E3A8A",
    tint: "#3B82F6",

    success: "#10B981",
    successSurface: "rgba(16, 185, 129, 0.15)",
    successBorder: "#065F46",

    warning: "#F59E0B",
    warningSurface: "rgba(245, 158, 11, 0.15)",
    warningBorder: "#78350F",

    danger: "#EF4444",
    dangerSurface: "rgba(239, 68, 68, 0.15)",
    dangerBorder: "#7F1D1D",

    icon: "#94A3B8",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#3B82F6",
    tabBarBackground: "#0F172A",
    tabBarBorder: "#334155",
    headerBackground: "#0F172A",
    headerText: "#F8FAFC",
  },
};

export type ThemeColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
