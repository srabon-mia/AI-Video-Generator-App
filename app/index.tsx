import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useVideoJob } from "../hooks/useVideoJob";
import { canGenerate, incrementUsage, getUsage } from "../lib/usage";
import { saveJob } from "../lib/storage";

const EXAMPLES = [
  "A cinematic drone shot over a misty mountain forest at sunrise",
  "Slow motion ocean waves crashing on a rocky shore with sea spray",
  "A cozy cabin in a snowy forest, smoke rising from chimney at dusk",
  "Abstract geometric shapes morphing and flowing in neon colors",
  "A bustling Tokyo street at night with neon lights and rain reflections",
  "A lone astronaut floating above Earth, stars behind them",
];

type AspectRatio = "16:9" | "9:16" | "1:1";
type Duration = "5" | "10";
type Quality = "fast" | "standard";

export default function GenerateScreen() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<AspectRatio>("16:9");
  const [duration, setDuration] = useState<Duration>("5");
  const [quality, setQuality] = useState<Quality>("fast");
  const [usage, setUsage] = useState({ used: 0, left: 3 });
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const { generate, cancel, status, progress, videoUrl, error } = useVideoJob();

  useEffect(() => {
    getUsage().then(setUsage);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert("Enter a prompt", "Describe the video you want to generate.");
      return;
    }

    const allowed = await canGenerate();
    if (!allowed) {
      Alert.alert(
        "Daily limit reached",
        "You've used all 3 free generations for today. Come back tomorrow!"
      );
      return;
    }

    await generate(prompt.trim(), { aspectRatio: ratio, duration, quality });
    await incrementUsage();
    const updated = await getUsage();
    setUsage(updated);
  };

  const handleSave = async () => {
    if (!videoUrl) return;
    if (!mediaPermission?.granted) {
      const { granted } = await requestMediaPermission();
      if (!granted) {
        Alert.alert("Permission needed", "Allow access to save videos to your library.");
        return;
      }
    }
    try {
      await MediaLibrary.saveToLibraryAsync(videoUrl);
      Alert.alert("Saved!", "Video saved to your photo library.");
    } catch {
      Alert.alert("Error", "Could not save video.");
    }
  };

  const handleShare = async () => {
    if (!videoUrl) return;
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(videoUrl);
    }
  };

  const handleSaveToHistory = async () => {
    if (!videoUrl) return;
    await saveJob({
      id: Date.now().toString(),
      prompt,
      videoUrl,
      createdAt: Date.now(),
      settings: { aspectRatio: ratio, duration, quality },
    });
  };

  useEffect(() => {
    if (status === "done") handleSaveToHistory();
  }, [status]);

  const isLoading = status === "queued" || status === "running";
  const usedFraction = usage.used / 3;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Generate</Text>
            <Text style={s.subtitle}>AI video from text</Text>
          </View>
          <View style={s.sparkBadge}>
            <Text style={s.sparkIcon}>✦</Text>
          </View>
        </View>

        {/* Prompt input */}
        <Text style={s.label}>DESCRIBE YOUR VIDEO</Text>
        <View style={s.promptBox}>
          <TextInput
            style={s.promptInput}
            placeholder="A cinematic drone shot over a misty mountain forest at sunrise..."
            placeholderTextColor="#444"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            maxLength={400}
            editable={!isLoading}
          />
          <View style={s.promptFooter}>
            <Text style={s.charCount}>{prompt.length} / 400</Text>
            {prompt.length > 0 && (
              <TouchableOpacity onPress={() => setPrompt("")}>
                <Text style={s.clearBtn}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Example chips */}
        <Text style={s.label}>EXAMPLES</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.chipsScroll}
          contentContainerStyle={s.chipsContent}
        >
          {EXAMPLES.map((ex) => (
            <TouchableOpacity
              key={ex}
              style={s.chip}
              onPress={() => setPrompt(ex)}
              disabled={isLoading}
            >
              <Text style={s.chipText} numberOfLines={1}>
                {ex.length > 28 ? ex.slice(0, 28) + "…" : ex}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Settings */}
        <Text style={s.label}>SETTINGS</Text>
        <View style={s.settingsCard}>
          <SettingsRow label="Aspect ratio">
            {(["16:9", "9:16", "1:1"] as AspectRatio[]).map((r) => (
              <Pill
                key={r}
                label={r}
                active={ratio === r}
                onPress={() => setRatio(r)}
                disabled={isLoading}
              />
            ))}
          </SettingsRow>
          <View style={s.divider} />
          <SettingsRow label="Duration">
            {(["5s", "10s"] as const).map((d) => (
              <Pill
                key={d}
                label={d}
                active={duration === d.replace("s", "") as Duration}
                onPress={() => setDuration(d.replace("s", "") as Duration)}
                disabled={isLoading}
              />
            ))}
          </SettingsRow>
          <View style={s.divider} />
          <SettingsRow label="Quality">
            {(["fast", "standard"] as Quality[]).map((q) => (
              <Pill
                key={q}
                label={q.charAt(0).toUpperCase() + q.slice(1)}
                active={quality === q}
                onPress={() => setQuality(q)}
                disabled={isLoading}
              />
            ))}
          </SettingsRow>
        </View>

        {/* Usage bar */}
        <View style={s.usageWrap}>
          <View style={s.usageInfo}>
            <Text style={s.usageLabel}>Daily generations</Text>
            <View style={s.usageTrack}>
              <View style={[s.usageFill, { width: `${usedFraction * 100}%` }]} />
            </View>
          </View>
          <Text style={s.usageCount}>{usage.left} of 3 left</Text>
        </View>

        {/* Progress */}
        {isLoading && (
          <View style={s.progressCard}>
            <ActivityIndicator color="#a78bfa" size="small" />
            <View style={s.progressText}>
              <Text style={s.progressLabel}>{progress}</Text>
              <Text style={s.progressSub}>This usually takes 30–90 seconds</Text>
            </View>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={s.errorCard}>
            <Text style={s.errorText}>⚠ {error}</Text>
          </View>
        )}

        {/* Result */}
        {status === "done" && videoUrl && (
          <View style={s.resultCard}>
            <Text style={s.label}>RESULT</Text>
            <Video
              source={{ uri: videoUrl }}
              style={s.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
            <Text style={s.resultPrompt} numberOfLines={2}>
              {prompt}
            </Text>
            <View style={s.resultActions}>
              <TouchableOpacity style={s.actionBtn} onPress={handleSave}>
                <Text style={s.actionBtnText}>⬇ Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
                <Text style={s.actionBtnText}>↗ Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Generate / Cancel button */}
        <TouchableOpacity
          style={[s.genBtn, isLoading && s.genBtnCancel, !prompt.trim() && !isLoading && s.genBtnDisabled]}
          onPress={isLoading ? cancel : handleGenerate}
          disabled={!prompt.trim() && !isLoading}
          activeOpacity={0.85}
        >
          <Text style={s.genBtnText}>
            {isLoading ? "Cancel" : "Generate video"}
          </Text>
        </TouchableOpacity>

        <Text style={s.poweredBy}>Powered by Kling v1.6 via fal.ai</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.settingsRow}>
      <Text style={s.settingsLabel}>{label}</Text>
      <View style={s.pillGroup}>{children}</View>
    </View>
  );
}

function Pill({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.pill, active && s.pillActive]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[s.pillText, active && s.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "500", color: "#f0f0ff" },
  subtitle: { fontSize: 13, color: "#555", marginTop: 2 },
  sparkBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#2a1a5a", alignItems: "center", justifyContent: "center" },
  sparkIcon: { color: "#a78bfa", fontSize: 16 },

  label: { fontSize: 11, color: "#555", letterSpacing: 0.8, marginBottom: 10 },

  promptBox: { backgroundColor: "#13131f", borderWidth: 0.5, borderColor: "#2a2a3a", borderRadius: 14, padding: 14, marginBottom: 20 },
  promptInput: { color: "#e0e0ff", fontSize: 15, lineHeight: 22, minHeight: 90 },
  promptFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "#1e1e2e" },
  charCount: { fontSize: 11, color: "#444" },
  clearBtn: { fontSize: 12, color: "#6c47ff" },

  chipsScroll: { marginBottom: 20 },
  chipsContent: { paddingRight: 20, gap: 8 },
  chip: { backgroundColor: "#13131f", borderWidth: 0.5, borderColor: "#2a2a3a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { color: "#888", fontSize: 12 },

  settingsCard: { backgroundColor: "#13131f", borderWidth: 0.5, borderColor: "#2a2a3a", borderRadius: 14, padding: 14, marginBottom: 16 },
  settingsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  settingsLabel: { fontSize: 13, color: "#aaa" },
  pillGroup: { flexDirection: "row", gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 0.5, borderColor: "#2a2a3a" },
  pillActive: { backgroundColor: "#3d2b8a", borderColor: "#6c47ff" },
  pillText: { fontSize: 12, color: "#666" },
  pillTextActive: { color: "#c4b5fd" },
  divider: { height: 0.5, backgroundColor: "#1e1e2e", marginVertical: 12 },

  usageWrap: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#13131f", borderWidth: 0.5, borderColor: "#2a2a3a", borderRadius: 14, padding: 14, marginBottom: 20 },
  usageInfo: { flex: 1 },
  usageLabel: { fontSize: 11, color: "#555", marginBottom: 7 },
  usageTrack: { height: 4, backgroundColor: "#1e1e2e", borderRadius: 2, overflow: "hidden" },
  usageFill: { height: "100%", backgroundColor: "#6c47ff", borderRadius: 2 },
  usageCount: { fontSize: 13, color: "#a78bfa", fontWeight: "500" },

  progressCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#13131f", borderWidth: 0.5, borderColor: "#3d2b8a", borderRadius: 14, padding: 16, marginBottom: 16 },
  progressText: { flex: 1 },
  progressLabel: { fontSize: 14, color: "#a78bfa" },
  progressSub: { fontSize: 11, color: "#555", marginTop: 3 },

  errorCard: { backgroundColor: "#1a0a0a", borderWidth: 0.5, borderColor: "#5a1a1a", borderRadius: 14, padding: 14, marginBottom: 16 },
  errorText: { color: "#f87171", fontSize: 13 },

  resultCard: { marginBottom: 20 },
  video: { width: "100%", height: 210, borderRadius: 12, backgroundColor: "#0f0f1f" },
  resultPrompt: { fontSize: 12, color: "#666", marginTop: 10, marginBottom: 12, lineHeight: 18 },
  resultActions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, backgroundColor: "#1e1e2e", borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 0.5, borderColor: "#2a2a3a" },
  actionBtnText: { color: "#a78bfa", fontWeight: "500", fontSize: 13 },

  genBtn: { backgroundColor: "#6c47ff", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  genBtnCancel: { backgroundColor: "#2a1a4a" },
  genBtnDisabled: { opacity: 0.35 },
  genBtnText: { color: "#fff", fontWeight: "500", fontSize: 16 },

  poweredBy: { fontSize: 11, color: "#333", textAlign: "center", marginTop: 16 },
});
