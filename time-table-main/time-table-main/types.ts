export type ViewMode = 'Monthly' | 'Weekly' | 'Daily';

export interface Task {
  id: string;
  title: string;
  time: string;
  day: string; // 'Mon', 'Tue', etc.
  category: 'Math' | 'Coding' | 'History' | 'Physics' | 'Gym' | 'Reading' | 'Other';
  status: 'completed' | 'pending' | 'missed';
  priority: 'High' | 'Medium' | 'Low';
  color: string;
  dueDate?: string;
}

export interface WeeklyStats {
  hoursToday: number;
  tasksPlanned: number;
  tasksCompleted: number;
  performance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface TrendData {
  label: string;
  value: number;
  secondaryValue?: number;
}

// --- AI Types ---

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  isThinking?: boolean;
  audioData?: string; // Base64 audio for TTS playback
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K';

export interface GeneratedMedia {
  type: 'image' | 'video';
  url: string;
  prompt: string;
}
