import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUsage } from "../lib/usage";
import { clearHistory } from "../lib/storage";

const BACKEND_KEY = "backend_url";
const AUTO_SAVE_KEY = "auto_save";
const KEEP_HISTORY_KEY = "keep_history";

export default function SettingsScreen() {
  const [backendUrl, setBackendUrl] = useState("https://your-backend.vercel.app");
  const [autoSave, setAutoSave] = useState(false);
  const [keepHistory, setKeepHistory] = useState(true);
  const [usage, setUsage] = useState({ used: 0, left: 3 });
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const url = await AsyncStorage.getItem(BACKEND_KEY);
        if (url) setBackendUrl(url);
        const as = await AsyncStorage.getItem(AUTO_SAVE_KEY);
        if (as !== null) setAutoSave(as === "true");
        const kh = await AsyncStorage.getItem(KEEP_HISTORY_KEY);
        if (kh !== null) setKeepHistory(kh === "true");
        getUsage().then(setUsage);
      })();
    }, [])
  );

  const handleAutoSave = async (val: boolean) => {
    setAutoSave(val);
    await AsyncStorage.setItem(AUTO_SAVE_KEY, String(val));
  };

  const handleKeepHistory = async (val: boolean) => {
    setKeepHistory(val);
    await AsyncStorage.setItem(KEEP_HISTORY_KEY, String(val));
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear all history?",
      "This will permanently delete all saved generations.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            Alert.alert("Cleared", "History has been deleted.");
          },
        },
      ]
    );
  };

  const handleConfigureBackend = () => {
    Alert.prompt(
      "Backend URL",
      "Enter your Next.js backend URL (e.g. https://your-app.vercel.app)",
      async (url) => {
        if (url) {
          const trimmed = url.trim().replace(/\/$/, "");
          setBackendUrl(trimmed);
          await AsyncStorage.setItem(BACKEND_KEY, trimmed);
        }
      },
      "plain-text",
      backendUrl
    );
  };

  const usedPercent = Math.round((usage.used / 3) * 100);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.title}>Settings</Text>
        </View>

        {/* Usage */}
        <SectionTitle>Usage</SectionTitle>
        <View style={s.block}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.icon, s.iconPurple]}>
                <Text style={s.iconEmoji}>◈</Text>
              </View>
              <View>
                <Text style={s.rowText}>Daily generations</Text>
                <Text style={s.rowSub}>Resets at midnight</Text>
              </View>
            </View>
            <View style={s.usagePill}>
              <Text style={s.usagePillText}>{usage.left} of 3 left</Text>
            </View>
          </View>
          <View style={s.rowDivider} />
          <View style={[s.row, { paddingBottom: 4 }]}>
            <View style={s.usageBar}>
              <View
                style={[s.usageBarFill, { width: `${usedPercent}%` }]}
              />
            </View>
          </View>
        </View>

        <SectionTitle>Connection</SectionTitle>
        <View style={s.block}>
          {editingUrl ? (
            <View style={s.row}>
              <TextInput
                style={s.urlInput}
                value={urlDraft}
                onChangeText={setUrlDraft}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="https://your-app.vercel.app"
                placeholderTextColor="#444"
              />
              <TouchableOpacity
                onPress={async () => {
                  const trimmed = urlDraft.trim().replace(/\/$/, "");
                  setBackendUrl(trimmed);
                  await AsyncStorage.setItem(BACKEND_KEY, trimmed);
                  setEditingUrl(false);
                }}
              >
                <Text style={s.urlSave}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={s.row}
              onPress={() => { setUrlDraft(backendUrl); setEditingUrl(true); }}
              activeOpacity={0.7}
            >
              <View style={s.rowLeft}>
                <View style={[s.icon, s.iconBlue]}>
                  <Text style={s.iconEmoji}>⚡</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.rowText}>Backend URL</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{backendUrl}</Text>
                </View>
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Preferences */}
        <SectionTitle>Preferences</SectionTitle>
        <View style={s.block}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.icon, s.iconGreen]}>
                <Text style={s.iconEmoji}>⬇</Text>
              </View>
              <View>
                <Text style={s.rowText}>Auto-save to library</Text>
                <Text style={s.rowSub}>Save on generation complete</Text>
              </View>
            </View>
            <Switch
              value={autoSave}
              onValueChange={handleAutoSave}
              trackColor={{ false: "#2a2a3a", true: "#6c47ff" }}
              thumbColor="#fff"
            />
          </View>
          <View style={s.rowDivider} />
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.icon, s.iconPurple]}>
                <Text style={s.iconEmoji}>⊙</Text>
              </View>
              <View>
                <Text style={s.rowText}>Keep history</Text>
                <Text style={s.rowSub}>Store past generations on device</Text>
              </View>
            </View>
            <Switch
              value={keepHistory}
              onValueChange={handleKeepHistory}
              trackColor={{ false: "#2a2a3a", true: "#6c47ff" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Danger */}
        <SectionTitle>Data</SectionTitle>
        <View style={s.block}>
          <TouchableOpacity style={s.row} onPress={handleClearHistory} activeOpacity={0.7}>
            <View style={s.rowLeft}>
              <View style={[s.icon, s.iconRed]}>
                <Text style={s.iconEmoji}>✕</Text>
              </View>
              <Text style={[s.rowText, { color: "#f87171" }]}>
                Clear all history
              </Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={s.about}>
          <Text style={s.aboutText}>AI Video Gen · v1.0.0</Text>
          <Text style={s.aboutText}>Built with Expo · fal.ai · Kling v1.6</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "500", color: "#f0f0ff" },

  sectionTitle: {
    fontSize: 11,
    color: "#555",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  block: {
    backgroundColor: "#13131f",
    borderWidth: 0.5,
    borderColor: "#2a2a3a",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
  },
  blockNote: { fontSize: 12, color: "#444", marginBottom: 20, lineHeight: 17, paddingHorizontal: 4 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  rowText: { fontSize: 14, color: "#ccc" },
  rowSub: { fontSize: 11, color: "#555", marginTop: 2 },
  rowDivider: { height: 0.5, backgroundColor: "#1e1e2e", marginHorizontal: 14 },
  chevron: { fontSize: 22, color: "#444" },

  icon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconPurple: { backgroundColor: "#2a1a4a" },
  iconBlue: { backgroundColor: "#0a1a3a" },
  iconGreen: { backgroundColor: "#0a2a1a" },
  iconRed: { backgroundColor: "#2a0a0a" },
  iconEmoji: { fontSize: 14 },

  usagePill: { backgroundColor: "#1e1e2e", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  usagePillText: { fontSize: 12, color: "#a78bfa", fontWeight: "500" },
  usageBar: { flex: 1, height: 4, backgroundColor: "#1e1e2e", borderRadius: 2, overflow: "hidden", marginHorizontal: 14, marginBottom: 8 },
  usageBarFill: { height: "100%", backgroundColor: "#6c47ff", borderRadius: 2 },

  about: { marginTop: 32, alignItems: "center", gap: 4 },
  aboutText: { fontSize: 12, color: "#333" },

  urlInput: {
    flex: 1,
    color: "#e0e0ff",
    fontSize: 13,
    paddingVertical: 4,
  },
  urlSave: {
    color: "#6c47ff",
    fontSize: 13,
    fontWeight: "500",
    paddingLeft: 12,
  },
});
