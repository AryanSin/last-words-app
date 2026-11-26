import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, RadialGradient, Stop } from "react-native-svg";
import { useTheme } from "../hooks/use-theme-color";

interface RadialCountdownProps {
  daysRemaining: number;
  totalThreshold: number;
  isUrgent?: boolean;
  isLoading?: boolean;
}

export const RadialCountdown: React.FC<RadialCountdownProps> = ({
  daysRemaining,
  totalThreshold,
  isUrgent = false,
  isLoading = false,
}) => {
  const { colors, isDark } = useTheme();

  const size = 210;
  const center = size / 2;
  const radius = 88;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;

  const validThreshold = Math.max(1, totalThreshold || 365);
  const clampedRemaining = Math.max(0, Math.min(daysRemaining, validThreshold));
  const progressRatio = clampedRemaining / validThreshold;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const isCritical = daysRemaining <= 3;
  const effectiveUrgent = isUrgent || daysRemaining <= 7;

  // Track styling
  const trackColor = isDark ? "rgba(56, 189, 248, 0.07)" : "rgba(15, 23, 42, 0.07)";

  // Dynamic gradient IDs
  const arcGradientId = effectiveUrgent ? "arcGradUrgent" : "arcGradSafe";
  const ambientGlowId = effectiveUrgent ? "ambientGlowUrgent" : "ambientGlowSafe";

  const bufferPercent = Math.round((clampedRemaining / validThreshold) * 100);

  // Status colors & text
  const statusColor = isCritical
    ? colors.danger
    : effectiveUrgent
      ? colors.warning
      : colors.pulseEmerald;

  const statusBg = isCritical
    ? colors.dangerSurface
    : effectiveUrgent
      ? colors.warningSurface
      : colors.pulseEmeraldSurface;

  const statusLabel = isCritical
    ? "FINAL WINDOW"
    : effectiveUrgent
      ? "CRITICAL WINDOW"
      : `${bufferPercent}% BUFFER`;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: validThreshold,
        now: clampedRemaining,
        text: `${daysRemaining} days remaining`,
      }}
      accessibilityLabel={`Inactivity countdown: ${daysRemaining} days remaining of ${validThreshold} days threshold`}
    >
      <View style={styles.svgWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            {/* Safe arc gradient: Emerald -> Radiant Sky Cyan */}
            <LinearGradient id="arcGradSafe" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.arcGradientSafeStart} />
              <Stop offset="100%" stopColor={colors.arcGradientSafeEnd} />
            </LinearGradient>

            {/* Urgent arc gradient: Amber -> Crimson Alert */}
            <LinearGradient id="arcGradUrgent" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.arcGradientUrgentStart} />
              <Stop offset="100%" stopColor={colors.arcGradientUrgentEnd} />
            </LinearGradient>

            {/* Ambient center radial glow for safe state */}
            <RadialGradient id="ambientGlowSafe" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.ambientGlowSafe} />
              <Stop offset="100%" stopColor={colors.ambientGlowSafe} stopOpacity="0" />
            </RadialGradient>

            {/* Ambient center radial glow for urgent state */}
            <RadialGradient id="ambientGlowUrgent" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.ambientGlowUrgent} />
              <Stop offset="100%" stopColor={colors.ambientGlowUrgent} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Ambient atmosphere glow circle in center */}
          <Circle
            cx={center}
            cy={center}
            r={radius - 12}
            fill={`url(#${ambientGlowId})`}
          />

          <G transform={`rotate(-90 ${center} ${center})`}>
            {/* Background Track Circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={trackColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Active Progress Arc with chromatic dual-tone gradient */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={`url(#${arcGradientId})`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>

        {/* Center Content */}
        <View style={styles.innerLabelContainer}>
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 6 }} />
              <Text style={[styles.daysLabel, { color: colors.textMuted }]}>
                SYNCING VAULT...
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.daysNumber,
                  { color: effectiveUrgent ? colors.warning : colors.text },
                ]}
                numberOfLines={1}
              >
                {daysRemaining}
              </Text>
              <Text style={[styles.daysLabel, { color: colors.textMuted }]}>
                DAYS REMAINING
              </Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: statusBg,
                    borderColor: statusColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusPillDot,
                    { backgroundColor: statusColor },
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    { color: statusColor },
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  svgWrapper: {
    width: 210,
    height: 210,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  innerLabelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 160,
  },
  daysNumber: {
    fontSize: 54,
    fontWeight: "800",
    letterSpacing: -1.5,
    lineHeight: 60,
    fontVariant: ["tabular-nums"],
  },
  daysLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  statusPillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});

