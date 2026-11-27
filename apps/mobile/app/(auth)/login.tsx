import { Ionicons } from "@expo/vector-icons";
import { exchangeCodeAsync } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleIcon } from "../../components/GoogleIcon";
import { useResponsive } from "../../hooks/useResponsive";
import { useTheme } from "../../hooks/use-theme-color";
import { biometricService } from "../../services/biometricService";
import { tokenStorage } from "../../services/tokenStorage";
import { useAuthStore } from "../../store/useAuthStore";

WebBrowser.maybeCompleteAuthSession();

type AuthMode = "login" | "register";

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isWide } = useResponsive();

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [canBiometricUnlock, setCanBiometricUnlock] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometrics");

  // Google OAuth Configuration
  // Google strictly separates client types in Google Cloud Console.
  // A 'Web application' client type strictly disallows mobile custom scheme URIs (e.g. mobile:// or com.lastwords.app:/).
  // Native mobile platforms require their own Android/iOS Client IDs created in Google Cloud Console.
  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "840121535735-1thurhpb5ie0nlfclljnn84jo1snsp1s.apps.googleusercontent.com";
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID &&
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID !== webClientId
      ? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
      : undefined);

  const androidRedirectUri = useMemo(() => {
    if (androidClientId && androidClientId.endsWith(".apps.googleusercontent.com")) {
      const clientPrefix = androidClientId.replace(".apps.googleusercontent.com", "");
      return `com.googleusercontent.apps.${clientPrefix}:/oauthredirect`;
    }
    return "com.lastwords.app:/oauthredirect";
  }, [androidClientId]);

  const authConfig = useMemo(() => {
    return {
      webClientId,
      iosClientId: iosClientId || (Platform.OS === "ios" ? "ios-client-id-pending" : undefined),
      androidClientId:
        androidClientId || (Platform.OS === "android" ? "android-client-id-pending" : undefined),
      redirectUri: Platform.select({
        android: androidRedirectUri,
        ios: "com.lastwords.app:/oauthredirect",
        default: undefined,
      }),
      shouldAutoExchangeCode: false,
      selectAccount: true,
    };
  }, [webClientId, iosClientId, androidClientId, androidRedirectUri]);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest(authConfig);

  useEffect(() => {
    if (request) {
      console.log("\n=======================================================");
      console.log("👉 GOOGLE OAUTH CONFIGURATION:");
      console.log("Client ID:   ", (request as any).clientId);
      console.log("Redirect URI:", request.redirectUri);
      console.log("Add this exact Redirect URI to Google Cloud Console");
      console.log("under Authorized redirect URIs for the above Client ID.");
      console.log("=======================================================\n");
    }
  }, [request]);

  const handleGoogleSignInWithToken = useCallback(
    async (idToken: string) => {
      await loginWithGoogle(idToken);
      router.replace("/(tabs)");
    },
    [loginWithGoogle, router],
  );

  const handleGoogleAuthPress = async () => {
    // Prevent sending a Web Client ID with custom scheme on Android
    if (Platform.OS === "android" && !androidClientId) {
      Alert.alert(
        "Android Client ID Required",
        "Google rejects 'Web' Client IDs with custom mobile URI schemes (custom scheme URIs are not allowed for 'WEB' client type).\n\n" +
          "To enable Google Sign-In on Android:\n" +
          "1. Open Google Cloud Console -> Credentials\n" +
          "2. Click Create Credentials -> OAuth client ID\n" +
          "3. Select Application type: 'Android'\n" +
          "4. Package name: com.lastwords.app\n" +
          "5. Add your SHA-1 certificate fingerprint\n" +
          "6. Put EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in apps/mobile/.env",
        [{ text: "OK" }],
      );
      return;
    }

    // Prevent sending a Web Client ID with custom scheme on iOS
    if (Platform.OS === "ios" && !iosClientId) {
      Alert.alert(
        "iOS Client ID Required",
        "Google rejects 'Web' Client IDs with custom mobile URI schemes (custom scheme URIs are not allowed for 'WEB' client type).\n\n" +
          "To enable Google Sign-In on iOS:\n" +
          "1. Open Google Cloud Console -> Credentials\n" +
          "2. Click Create Credentials -> OAuth client ID\n" +
          "3. Select Application type: 'iOS'\n" +
          "4. Bundle ID: com.lastwords.app\n" +
          "5. Put EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in apps/mobile/.env",
        [{ text: "OK" }],
      );
      return;
    }

    if (!request) {
      Alert.alert(
        "Google Sign-In Initializing",
        "Google Sign-In is still preparing. Please try again in a moment.",
      );
      return;
    }

    setGoogleLoading(true);
    try {
      const res = await promptAsync();
      if (res?.type === "success") {
        let token =
          res.params?.id_token ||
          (res as any).authentication?.idToken ||
          res.params?.access_token ||
          (res as any).authentication?.accessToken;

        if (!token && res.params?.code && request.clientId) {
          const tokenResult = await exchangeCodeAsync(
            {
              clientId: request.clientId,
              code: res.params.code,
              redirectUri: request.redirectUri,
              extraParams: request.codeVerifier
                ? { code_verifier: request.codeVerifier }
                : undefined,
            },
            Google.discovery,
          );
          token = tokenResult.idToken || tokenResult.accessToken;
        }

        if (token) {
          await handleGoogleSignInWithToken(token);
        } else {
          Alert.alert(
            "Google Sign-In",
            "No authentication token was received from Google. Please try again.",
          );
        }
      } else if (res?.type === "error") {
        Alert.alert(
          "Google Sign-In Failed",
          res.error?.message || "Google authentication failed. Please try again.",
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Google Sign-In Error",
        err?.message || "Unable to complete Google sign-in.",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const status = await biometricService.getStatus();
      const hasToken = !!(await tokenStorage.getAccessToken());
      if (status.hasHardware && status.isEnrolled && hasToken) {
        setCanBiometricUnlock(true);
        setBiometricType(status.biometricType);
      }
    })();
  }, []);

  const handleBiometricUnlock = async () => {
    const verified = await biometricService.authenticate("Unlock Last Words");
    if (verified) {
      router.replace("/(tabs)");
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) {
          Alert.alert("Error", "Please enter your name.");
          setLoading(false);
          return;
        }
        await register(name.trim(), email.trim(), password);
        Alert.alert("Success", "Account created successfully!");
      } else {
        await login(email.trim(), password);
      }
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Authentication Failed", err.message || "Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.brandLogoBox,
                { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
              ]}
            >
              <Text style={[styles.brandLogoText, { color: colors.primary }]}>LW</Text>
            </View>
            <Text style={[styles.logoTitle, { color: colors.text }]}>LAST WORDS</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Automated Inactivity Messaging & Switch
            </Text>
          </View>

          {/* Mode Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: colors.surfaceRaised }]}>
            {(["login", "register"] as AuthMode[]).map((tab) => {
              const isSelected = mode === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    isSelected && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    setMode(tab);
                  }}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityLabel={tab === "login" ? "Log In" : "Sign Up"}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: isSelected ? "#FFFFFF" : colors.textMuted },
                    ]}
                  >
                    {tab === "login" ? "Log In" : "Sign Up"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Forms */}
          <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {mode === "register" && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Full Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textSubtle}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  accessibilityLabel="Full Name"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSubtle}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                accessibilityLabel="Email Address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSubtle}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleEmailAuth}
                accessibilityLabel="Password"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                (loading || googleLoading) && styles.buttonDisabled,
              ]}
              onPress={handleEmailAuth}
              disabled={loading || googleLoading}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={mode === "login" ? "Sign In to Last Words" : "Create Last Words Account"}
              accessibilityState={{ disabled: loading || googleLoading, busy: loading }}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? "#080C14" : "#FFFFFF"} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: isDark ? "#080C14" : "#FFFFFF" },
                  ]}
                >
                  {mode === "login" ? "Sign In to Last Words" : "Create Last Words Account"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Authentication Button */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
                (googleLoading || loading) && styles.buttonDisabled,
              ]}
              onPress={handleGoogleAuthPress}
              disabled={googleLoading || loading}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={mode === "login" ? "Sign In with Google" : "Sign Up with Google"}
              accessibilityState={{ disabled: googleLoading || loading, busy: googleLoading }}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <GoogleIcon size={20} />
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>
                    {mode === "login" ? "Sign In with Google" : "Sign Up with Google"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {canBiometricUnlock && mode === "login" && (
            <TouchableOpacity
              style={[
                styles.biometricButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceRaised,
                },
              ]}
              onPress={handleBiometricUnlock}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Unlock with ${biometricType}`}
            >
              <Ionicons
                name={
                  biometricType === "Face ID" ? "scan-outline" : "finger-print-outline"
                }
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.biometricButtonText, { color: colors.text }]}>
                Unlock with {biometricType}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  scrollContentWide: {
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  brandLogoBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  brandLogoText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  form: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  primaryButton: {
    minHeight: 52,
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 18,
  },
  biometricButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
