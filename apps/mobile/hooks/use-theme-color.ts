import { Colors, ThemeColors } from "../constants/theme";
import { useColorScheme } from "./use-color-scheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme() ?? "dark";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function useTheme(): {
  theme: "light" | "dark";
  isDark: boolean;
  colors: ThemeColors;
} {
  const scheme = useColorScheme() ?? "dark";
  const isDark = scheme === "dark";
  return {
    theme: isDark ? "dark" : "light",
    isDark,
    colors: Colors[isDark ? "dark" : "light"],
  };
}
