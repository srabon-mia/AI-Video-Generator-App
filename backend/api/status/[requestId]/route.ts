// backend/app/api/status/[requestId]/route.ts
// Polls fal.ai for job status and returns the video URL when complete.

import { fal } from "@fal-ai/client";

const MODEL_MAP: Record<string, string> = {
  fast: "fal-ai/kling-video/v1.6/standard/text-to-video",
  standard: "fal-ai/kling-video/v1.6/pro/text-to-video",
};

export async function GET(
  _req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;

    // Try both models — just use standard as fallback
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
      const output = statusResult.response as any;
      return Response.json({
        status: "COMPLETED",
        videoUrl: output?.video?.url ?? null,
      });
    }

    if (statusResult.status === "FAILED") {
      return Response.json({
        status: "FAILED",
        error: "The generation job failed on the AI provider side.",
      });
    }

    // IN_QUEUE or IN_PROGRESS
    return Response.json({ status: statusResult.status });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
