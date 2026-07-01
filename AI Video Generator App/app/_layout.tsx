import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useRef } from "react";
import { useSegments, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const tokenCache = {
  async getToken(key: string) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
};

export default function RootLayout() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <StatusBar style="light" />
      <AuthGate />
    </ClerkProvider>
  );
}

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
  }, []);

  useEffect(() => {
    if (!isLoaded || !mounted.current) return;
    const inAuthScreen = segments[0] === "sign-in";
    if (!isSignedIn && !inAuthScreen) {
      router.replace("/sign-in");
    } else if (isSignedIn && inAuthScreen) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, segments]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0f", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f0f1a",
          borderTopColor: "#2a2a3a",
          borderTopWidth: 0.5,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: "#a78bfa",
        tabBarInactiveTintColor: "#555",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Generate", tabBarIcon: ({ color }) => <TabIcon name="✦" color={color} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "History", tabBarIcon: ({ color }) => <TabIcon name="⊙" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", tabBarIcon: ({ color }) => <TabIcon name="⚙" color={color} /> }}
      />
      <Tabs.Screen name="sign-in" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  const { Text } = require("react-native");
  return <Text style={{ color, fontSize: 18 }}>{name}</Text>;
}