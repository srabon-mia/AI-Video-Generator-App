// backend/app/api/generate/route.ts
// Deploy this as a Next.js app on Vercel.
// Set FAL_KEY in your Vercel environment variables — never in the mobile app.

import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY!,
});

const MODEL_MAP: Record<string, string> = {
  fast: "fal-ai/kling-video/v1.6/standard/text-to-video",
  standard: "fal-ai/kling-video/v1.6/pro/text-to-video",
};

export async function POST(req: Request) {
  try {
    const { prompt, settings } = await req.json();

    if (!prompt || typeof prompt !== "string") {
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

    return Response.json({ requestId: request_id, model });
  } catch (e: any) {
    console.error("Generate error:", e);
    return Response.json({ error: e.message || "Generation failed." }, { status: 500 });
  }
}
