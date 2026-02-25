import { Task, WeeklyStats } from "../types";
import { API_BASE_URL } from "./apiBase";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const fetchUserData = async (
  token: string
): Promise<{
  tasks: Task[];
  stats: WeeklyStats | null;
  profileImage?: string | null;
  reminderEnabled?: boolean;
  reminderTone?: string | null;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/user/data`, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to fetch data");
  }

  const payload = await response.json();
  return payload.data || { tasks: [], stats: null, profileImage: null };
};

export const saveUserData = async (
  token: string,
  tasks: Task[],
  stats: WeeklyStats,
  profileImage?: string | null,
  reminderSettings?: { reminderEnabled: boolean; reminderTone: string | null }
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/user/data`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({
      tasks,
      stats,
      profileImage,
      reminderEnabled: reminderSettings?.reminderEnabled,
      reminderTone: reminderSettings?.reminderTone,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to save data");
  }
};
