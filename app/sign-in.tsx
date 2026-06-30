import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSignIn, useSignUp, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

export default function SignInScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: "oauth_apple" });
  const router = useRouter();

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing info", "Enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        if (!signInLoaded) return;
        const result = await signIn.create({ identifier: email, password });
        if (result.status === "complete") {
          await setActiveSignIn({ session: result.createdSessionId });
          router.replace("/");
        }
      } else {
        if (!signUpLoaded) return;
        await signUp.create({ emailAddress: email, password });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
      }
    } catch (e: any) {
      Alert.alert("Error", e.errors?.[0]?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUpLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActiveSignUp({ session: result.createdSessionId });
        router.replace("/");
      }
    } catch (e: any) {
      Alert.alert("Error", e.errors?.[0]?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    try {
      const flow = provider === "google" ? startGoogleFlow : startAppleFlow;
      const { createdSessionId, setActive } = await flow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (e: any) {
      Alert.alert("Error", "Sign-in failed. Try again.");
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.scroll}>
          <Text style={s.title}>Verify your email</Text>
          <Text style={s.subtitle}>Enter the code we sent you</Text>
          <TextInput
            style={s.input}
            placeholder="123456"
            placeholderTextColor="#444"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={s.btn} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={s.scroll}>
          <Text style={s.sparkIcon}>✦</Text>
          <Text style={s.title}>AI Video Gen</Text>
          <Text style={s.subtitle}>
            {mode === "signin" ? "Sign in to continue" : "Create your account"}
          </Text>

          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor="#444"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor="#444"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={s.btn} onPress={handleEmailAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>{mode === "signin" ? "Sign in" : "Sign up"}</Text>
            )}
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.oauthBtn} onPress={() => handleOAuth("google")}>
            <Text style={s.oauthText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.oauthBtn} onPress={() => handleOAuth("apple")}>
            <Text style={s.oauthText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === "signin" ? "signup" : "signin")}>
            <Text style={s.switchText}>
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  scroll: { padding: 24, paddingTop: 80, flex: 1 },
  sparkIcon: { fontSize: 32, color: "#a78bfa", marginBottom: 16, textAlign: "center" },
  title: { fontSize: 26, fontWeight: "500", color: "#f0f0ff", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 32 },
  input: {
    backgroundColor: "#13131f", color: "#e0e0ff", borderRadius: 12,
    padding: 14, fontSize: 15, marginBottom: 12, borderWidth: 0.5, borderColor: "#2a2a3a",
  },
  btn: { backgroundColor: "#6c47ff", borderRadius: 12, padding: 15, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "500", fontSize: 15 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: "#2a2a3a" },
  dividerText: { color: "#555", fontSize: 12, marginHorizontal: 12 },
  oauthBtn: {
    borderWidth: 0.5, borderColor: "#2a2a3a", borderRadius: 12,
    padding: 14, alignItems: "center", marginBottom: 10, backgroundColor: "#13131f",
  },
  oauthText: { color: "#ccc", fontSize: 14, fontWeight: "500" },
  switchText: { color: "#a78bfa", fontSize: 13, textAlign: "center", marginTop: 20 },
});