import { fal } from "@fal-ai/client";
import { getUserId } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

const MODEL_MAP: Record<string, string> = {
  fast: "fal-ai/kling-video/v1.6/standard/text-to-video",
  standard: "fal-ai/kling-video/v1.6/pro/text-to-video",
};

const DAILY_LIMIT = 3;
const today = () => new Date().toISOString().split("T")[0];

export async function POST(req: Request) {
  try {
    // Verify auth
    const userId = await getUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized", tokenReceived: !!req.headers.get("Authorization") }, { status: 401 });
    }

    // Check usage
    const { data: usage } = await supabase
      .from("usage")
      .select("*")
      .eq("user_id", userId)
      .single();
  
    console.log("userId:", userId);
    console.log("usage:", JSON.stringify(usage));
    console.log("fetchError:", JSON.stringify(fetchError));

    if (usage && usage.date === today() && usage.count >= DAILY_LIMIT) {
      return Response.json({ error: "Daily limit reached" }, { status: 429 });
    }

    const { prompt, settings } = await req.json();
    if (!prompt) {
      return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    const model = MODEL_MAP[settings?.quality] ?? MODEL_MAP.fast;

    const { request_id } = await fal.queue.submit(model, {
      input: {
        prompt: prompt.slice(0, 400),
        duration: settings?.duration === "10" ? "10" : "5",
        aspect_ratio: settings?.aspectRatio ?? "16:9",
        negative_prompt: "blurry, low quality, distorted, text, watermark",
      },
    });

    // Increment usage
    if (usage && usage.date === today()) {
      await supabase
        .from("usage")
        .update({ count: usage.count + 1 })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("usage")
        .upsert({ user_id: userId, date: today(), count: 1 });
    }

    return Response.json({ requestId: request_id, model, debug: { userId, usage } });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}