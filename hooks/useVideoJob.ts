import { useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_KEY = "backend_url";
const DEFAULT_BACKEND = "https://your-backend.vercel.app";
const POLL_INTERVAL_MS = 4000;

export type JobStatus = "idle" | "queued" | "running" | "done" | "error";

export type VideoSettings = {
  aspectRatio: "16:9" | "9:16" | "1:1";
  duration: "5" | "10";
  quality: "fast" | "standard";
};

async function getBackendUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(BACKEND_KEY);
  return stored || DEFAULT_BACKEND;
}

const PROGRESS_STEPS: Record<number, string> = {
  0: "Queuing...",
  1: "Analyzing prompt...",
  3: "Generating frames...",
  8: "Rendering video...",
  14: "Finalizing...",
};

export function useVideoJob() {
  const [status, setStatus] = useState<JobStatus>("idle");
  const [progress, setProgress] = useState("Queuing...");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const cancel = () => {
    cancelledRef.current = true;
    stopPolling();
    setStatus("idle");
    setProgress("Queuing...");
  };

  const generate = async (prompt: string, settings: VideoSettings) => {
    cancelledRef.current = false;
    setStatus("queued");
    setProgress("Queuing...");
    setError(null);
    setVideoUrl(null);

    let tick = 0;

    try {
      const baseUrl = await getBackendUrl();

      const res = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, settings }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error: ${res.status}`);
      }

      const { requestId } = await res.json();

      if (cancelledRef.current) return;
      setStatus("running");

      pollRef.current = setInterval(async () => {
        if (cancelledRef.current) {
          stopPolling();
          return;
        }

        tick++;
        const stepMsg = Object.entries(PROGRESS_STEPS)
          .reverse()
          .find(([t]) => tick >= Number(t));
        if (stepMsg) setProgress(stepMsg[1]);

        try {
          const pollRes = await fetch(`${baseUrl}/api/status/${requestId}`);
          if (!pollRes.ok) return;

          const data = await pollRes.json();

          console.log("poll response:", JSON.stringify(data));

          if (data.status === "COMPLETED") {
            console.log("completed data:", JSON.stringify(data));
            stopPolling();
            setVideoUrl(data.videoUrl);
            setStatus("done");
          } else if (data.status === "FAILED") {
            stopPolling();
            setError(data.error || "Generation failed. Try a different prompt.");
            setStatus("error");
          }
        } catch {
          // network hiccup — keep polling
        }
      }, POLL_INTERVAL_MS);
    } catch (e: any) {
      stopPolling();
      setError(e.message || "Something went wrong.");
      setStatus("error");
    }
  };

  const reset = () => {
    stopPolling();
    cancelledRef.current = false;
    setStatus("idle");
    setProgress("Queuing...");
    setVideoUrl(null);
    setError(null);
  };

  return { generate, cancel, reset, status, progress, videoUrl, error };
}
