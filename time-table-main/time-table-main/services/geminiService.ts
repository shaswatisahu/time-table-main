import { Task, WeeklyStats, AspectRatio, ImageSize } from "../types";
import { API_BASE_URL } from "./apiBase";

const apiRequest = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.error || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export const sendChatMessage = async (
  message: string,
  history: any[],
  useThinking: boolean = false,
  useGrounding: "none" | "search" | "maps" = "none",
  imagePart?: string
): Promise<{ text: string; audio?: string; grounding?: any }> => {
  return apiRequest("/api/chat", {
    message,
    history,
    useThinking,
    useGrounding,
    imagePart,
  });
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const result = await apiRequest<{ text: string }>("/api/transcribe", { base64Audio });
  return result.text || "";
};

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  size: ImageSize
): Promise<string> => {
  const result = await apiRequest<{ url: string }>("/api/image/generate", {
    prompt,
    aspectRatio,
    size,
  });
  return result.url;
};

export const generateVideo = async (
  prompt: string,
  aspectRatio: "16:9" | "9:16"
): Promise<string> => {
  const result = await apiRequest<{ url: string }>("/api/video/generate", {
    prompt,
    aspectRatio,
  });
  return result.url;
};

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const result = await apiRequest<{ url: string }>("/api/image/edit", {
    base64Image,
    prompt,
  });
  return result.url;
};

export const connectLiveSession = async (
  _onAudioData: (base64: string) => void,
  _onClose: () => void
) => {
  // Live websocket proxying is not implemented in this backend yet.
  throw new Error("Live session is not available in local backend mode.");
};

export const getPerformanceInsights = async (
  stats: WeeklyStats,
  tasks: Task[]
): Promise<string> => {
  const result = await apiRequest<{ text: string }>("/api/insights", { stats, tasks });
  return result.text || "No insights available.";
};
