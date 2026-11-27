import { Platform } from "react-native";

export const Colors = {
  light: {
    background: "#080C14",
    surface: "#0F172A",
    surfaceRaised: "#1E293B",
    inputBackground: "#090D16",
    card: "#111827",

    border: "#1E293B",
    borderSubtle: "#111827",
    borderHighlight: "#334155",

    text: "#F8FAFC",
    textMuted: "#94A3B8",
    textSubtle: "#64748B",
    textInverse: "#080C14",

    primary: "#38BDF8",
    primaryHover: "#7DD3FC",
    primarySurface: "rgba(56, 189, 248, 0.12)",
    primaryBorder: "#0284C7",
    tint: "#38BDF8",

    pulseEmerald: "#10B981",
    pulseEmeraldSurface: "rgba(16, 185, 129, 0.15)",

    success: "#10B981",
    successSurface: "rgba(16, 185, 129, 0.15)",
    successBorder: "#065F46",

    warning: "#F59E0B",
    warningSurface: "rgba(245, 158, 11, 0.15)",
    warningBorder: "#78350F",

    danger: "#EF4444",
    dangerSurface: "rgba(239, 68, 68, 0.15)",
    dangerBorder: "#7F1D1D",

    whatsapp: "#25D366",
    whatsappSurface: "rgba(37, 211, 102, 0.14)",
    whatsappBorder: "#065F46",

    arcGradientSafeStart: "#10B981",
    arcGradientSafeEnd: "#38BDF8",
    arcGradientUrgentStart: "#F59E0B",
    arcGradientUrgentEnd: "#EF4444",
    ambientGlowSafe: "rgba(16, 185, 129, 0.08)",
    ambientGlowUrgent: "rgba(245, 158, 11, 0.12)",

    icon: "#94A3B8",
    tabIconDefault: "#64748B",
    tabIconSelected: "#38BDF8",
    tabBarBackground: "#090D16",
    tabBarBorder: "#1E293B",
    headerBackground: "#080C14",
    headerText: "#F8FAFC",
    cardGlow: "rgba(56, 189, 248, 0.08)",
  },
  dark: {
    background: "#080C14", // Deep Midnight Obsidian
    surface: "#0F172A",    // Obsidian Slate
    surfaceRaised: "#1E293B",
    inputBackground: "#090D16",
    card: "#111827",

    border: "#1E293B",
    borderSubtle: "#111827",
    borderHighlight: "#334155",

    text: "#F8FAFC",
    textMuted: "#94A3B8",
    textSubtle: "#64748B",
    textInverse: "#080C14",

    primary: "#38BDF8", // Radiant Sky Cyan
    primaryHover: "#7DD3FC",
    primarySurface: "rgba(56, 189, 248, 0.12)",
    primaryBorder: "#0284C7",
    tint: "#38BDF8",

    pulseEmerald: "#10B981", // Safe Heartbeat Emerald
    pulseEmeraldSurface: "rgba(16, 185, 129, 0.15)",

    success: "#10B981",
    successSurface: "rgba(16, 185, 129, 0.15)",
    successBorder: "#065F46",

    warning: "#F59E0B",
    warningSurface: "rgba(245, 158, 11, 0.15)",
    warningBorder: "#78350F",

    danger: "#EF4444",
    dangerSurface: "rgba(239, 68, 68, 0.15)",
    dangerBorder: "#7F1D1D",

    whatsapp: "#25D366",
    whatsappSurface: "rgba(37, 211, 102, 0.14)",
    whatsappBorder: "#065F46",

    arcGradientSafeStart: "#10B981", // Living Heartbeat Emerald
    arcGradientSafeEnd: "#38BDF8",   // Radiant Sky Cyan
    arcGradientUrgentStart: "#F59E0B", // Amber Warning
    arcGradientUrgentEnd: "#EF4444",   // Final Crimson
    ambientGlowSafe: "rgba(16, 185, 129, 0.08)",
    ambientGlowUrgent: "rgba(245, 158, 11, 0.12)",

    icon: "#94A3B8",
    tabIconDefault: "#64748B",
    tabIconSelected: "#38BDF8",
    tabBarBackground: "#090D16",
    tabBarBorder: "#1E293B",
    headerBackground: "#080C14",
    headerText: "#F8FAFC",
    cardGlow: "rgba(56, 189, 248, 0.08)",
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
