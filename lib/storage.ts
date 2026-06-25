import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "video_history";
const MAX_HISTORY = 20;

export type VideoJob = {
  id: string;
  prompt: string;
  videoUrl: string;
  createdAt: number;
  settings: {
    aspectRatio: "16:9" | "9:16" | "1:1";
    duration: "5" | "10";
    quality: "fast" | "standard";
  };
};

export async function saveJob(job: VideoJob): Promise<void> {
  try {
    const existing = await getHistory();
    const updated = [job, ...existing].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Failed to save job to history:", e);
  }
}

export async function getHistory(): Promise<VideoJob[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VideoJob[];
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function deleteJob(id: string): Promise<void> {
  const history = await getHistory();
  const updated = history.filter((j) => j.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}
