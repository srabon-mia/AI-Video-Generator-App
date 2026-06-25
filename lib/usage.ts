import AsyncStorage from "@react-native-async-storage/async-storage";

const USAGE_KEY = "daily_usage";
const DAILY_LIMIT = 3;

type UsageRecord = {
  date: string;
  count: number;
};

const todayStr = () => new Date().toISOString().split("T")[0];

async function readUsage(): Promise<UsageRecord> {
  try {
    const raw = await AsyncStorage.getItem(USAGE_KEY);
    if (!raw) return { date: todayStr(), count: 0 };
    const record: UsageRecord = JSON.parse(raw);
    // Reset if it's a new day
    if (record.date !== todayStr()) {
      return { date: todayStr(), count: 0 };
    }
    return record;
  } catch {
    return { date: todayStr(), count: 0 };
  }
}

export async function getUsage(): Promise<{ used: number; left: number; limit: number }> {
  const record = await readUsage();
  return {
    used: record.count,
    left: Math.max(0, DAILY_LIMIT - record.count),
    limit: DAILY_LIMIT,
  };
}

export async function canGenerate(): Promise<boolean> {
  const { left } = await getUsage();
  return left > 0;
}

export async function incrementUsage(): Promise<void> {
  const record = await readUsage();
  await AsyncStorage.setItem(
    USAGE_KEY,
    JSON.stringify({ date: todayStr(), count: record.count + 1 })
  );
}

export async function resetUsage(): Promise<void> {
  await AsyncStorage.removeItem(USAGE_KEY);
}
