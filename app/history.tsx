import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { getHistory, clearHistory, VideoJob } from "../lib/storage";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

export default function HistoryScreen() {
  const [history, setHistory] = useState<VideoJob[]>([]);
  const [selected, setSelected] = useState<VideoJob | null>(null);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  const handleClear = () => {
    Alert.alert(
      "Clear all history?",
      "This will permanently delete all your past generations.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            setHistory([]);
            setSelected(null);
          },
        },
      ]
    );
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return (
        "Today, " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const handleSave = async (url: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(false);
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow access to save videos to your library.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(url);
      Alert.alert("Saved!", "Video saved to your photo library.");
    } catch {
      Alert.alert("Error", "Could not save video.");
    }
  };

  const handleShare = async (url: string) => {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) await Sharing.shareAsync(url);
  };

  if (selected) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelected(null)} style={s.backBtn}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Replay</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={s.playerWrap}>
          <Video
            source={{ uri: selected.videoUrl }}
            style={s.player}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay
          />
          <Text style={s.playerPrompt}>{selected.prompt}</Text>
          <View style={s.playerMeta}>
            <MetaBadge label={selected.settings.aspectRatio} />
            <MetaBadge label={selected.settings.duration + "s"} />
            <MetaBadge label={selected.settings.quality} />
            <Text style={s.metaDate}>{formatDate(selected.createdAt)}</Text>
          </View>
          <View style={s.resultActions}>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleSave(selected.videoUrl)}>
              <Text style={s.actionBtnText}>⬇ Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => handleShare(selected.videoUrl)}>
              <Text style={s.actionBtnText}>↗ Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>History</Text>
          <Text style={s.subtitle}>Your past generations</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={s.clearAll}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>⊙</Text>
          <Text style={s.emptyTitle}>No generations yet</Text>
          <Text style={s.emptyBody}>
            Your completed videos will appear here after you generate them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.item}
              onPress={() => setSelected(item)}
              activeOpacity={0.75}
            >
              <View style={s.itemThumb}>
                <Text style={s.itemThumbIcon}>▶</Text>
              </View>
              <View style={s.itemInfo}>
                <Text style={s.itemPrompt} numberOfLines={2}>
                  {item.prompt}
                </Text>
                <Text style={s.itemMeta}>
                  {formatDate(item.createdAt)} · {item.settings.duration}s ·{" "}
                  {item.settings.aspectRatio}
                </Text>
              </View>
              <Text style={s.itemChevron}>›</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

function MetaBadge({ label }: { label: string }) {
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "500", color: "#f0f0ff" },
  subtitle: { fontSize: 13, color: "#555", marginTop: 2 },
  headerTitle: { fontSize: 17, fontWeight: "500", color: "#f0f0ff" },
  clearAll: { fontSize: 13, color: "#6c47ff", marginTop: 6 },

  backBtn: { paddingVertical: 4 },
  backBtnText: { fontSize: 15, color: "#a78bfa" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: { fontSize: 48, color: "#2a2a3a", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "500", color: "#555", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#444", textAlign: "center", lineHeight: 20 },

  list: { padding: 16 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#13131f",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  itemThumb: {
    width: 56,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#1e1e2e",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemThumbIcon: { color: "#555", fontSize: 16 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemPrompt: { fontSize: 13, color: "#ccc", lineHeight: 18 },
  itemMeta: { fontSize: 11, color: "#555", marginTop: 4 },
  itemChevron: { fontSize: 20, color: "#333" },
  separator: { height: 8 },

  playerWrap: { flex: 1, padding: 20 },
  player: { width: "100%", height: 240, borderRadius: 12, backgroundColor: "#0f0f1f" },
  playerPrompt: { fontSize: 14, color: "#aaa", marginTop: 16, lineHeight: 20 },
  playerMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  metaDate: { fontSize: 12, color: "#555" },

  badge: {
    backgroundColor: "#1e1e2e",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, color: "#888" },

  resultActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, backgroundColor: "#1e1e2e", borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 0.5, borderColor: "#2a2a3a" },
  actionBtnText: { color: "#a78bfa", fontWeight: "500", fontSize: 13 },
});
