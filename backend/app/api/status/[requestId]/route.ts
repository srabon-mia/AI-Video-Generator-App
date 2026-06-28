import { fal } from "@fal-ai/client";

const MODEL_MAP: Record<string, string> = {
  fast: "fal-ai/kling-video/v1.6/standard/text-to-video",
  standard: "fal-ai/kling-video/v1.6/pro/text-to-video",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    let statusResult: any;
    let usedModel = MODEL_MAP.fast;

    try {
      statusResult = await fal.queue.status(usedModel, {
        requestId,
        logs: false,
      });
    } catch {
      usedModel = MODEL_MAP.standard;
      statusResult = await fal.queue.status(usedModel, {
        requestId,
        logs: false,
      });
    }

    if (statusResult.status === "COMPLETED") {
      const resultRes = await fetch(statusResult.response_url, {
        headers: { "Authorization": `Key ${process.env.FAL_KEY}` }
      });
      const result = await resultRes.json();
      console.log("result:", JSON.stringify(result));

      const videoUrl =
        result?.video?.url ??
        result?.videos?.[0]?.url ??
        result?.url ??
        null;

      return Response.json({
        status: "COMPLETED",
        videoUrl,
      });
    }

    if (statusResult.status === "FAILED") {
      return Response.json({
        status: "FAILED",
        error: "The generation job failed on the AI provider side.",
      });
    }

    return Response.json({ status: statusResult.status });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}