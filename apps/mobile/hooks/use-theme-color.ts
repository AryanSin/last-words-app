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
  theme: "dark";
  isDark: true;
  colors: ThemeColors;
} {
  return {
    theme: "dark",
    isDark: true,
    colors: Colors.dark,
  };
}
