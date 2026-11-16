import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useTheme } from "../hooks/use-theme-color";

interface RadialCountdownProps {
  daysRemaining: number;
  totalThreshold: number;
  isUrgent?: boolean;
}

export const RadialCountdown: React.FC<RadialCountdownProps> = ({
  daysRemaining,
  totalThreshold,
  isUrgent = false,
}) => {
  const { colors, isDark } = useTheme();

  const radius = 54;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;

  const validThreshold = Math.max(1, totalThreshold || 365);
  const clampedRemaining = Math.max(0, Math.min(daysRemaining, validThreshold));
  const progressRatio = clampedRemaining / validThreshold;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const activeColor = isUrgent ? colors.warning : colors.pulseEmerald;
  const trackColor = isDark ? "#1E293B" : "#E2E8F0";

  const bufferPercent = Math.round((clampedRemaining / validThreshold) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.svgWrapper}>
        <Svg width={144} height={144} viewBox="0 0 144 144">
          <G rotation="-90" origin="72, 72">
            {/* Background Track Circle */}
            <Circle
              cx="72"
              cy="72"
              r={radius}
              stroke={trackColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated / Active Arc */}
            <Circle
              cx="72"
              cy="72"
              r={radius}
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>

        {/* Center Labels */}
        <View style={styles.innerLabelContainer}>
          <Text style={[styles.daysNumber, { color: isUrgent ? colors.warning : colors.text }]}>
            {daysRemaining}
          </Text>
          <Text style={[styles.daysLabel, { color: colors.textMuted }]}>
            DAYS REMAINING
          </Text>
          <Text
            style={[
              styles.bufferLabel,
              { color: isUrgent ? colors.warning : colors.pulseEmerald },
            ]}
          >
            {isUrgent ? "CRITICAL WINDOW" : `${bufferPercent}% Safe Buffer`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  svgWrapper: {
    width: 144,
    height: 144,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  innerLabelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  daysNumber: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  daysLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: -2,
  },
  bufferLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
});

