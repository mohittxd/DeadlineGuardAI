export interface Task {
  id: string;
  name: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  deadline: string; // ISO or local date-time string
  duration: number; // in minutes
  completed: boolean;
  createdAt: string;
  matrixQuadrant?: "doFirst" | "schedule" | "delegate" | "defer"; // Eisenhower quadrant
  tacticalHint?: string;
  category?: string;
  completedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface TimerState {
  secondsRemaining: number;
  isActive: boolean;
  duration: number; // original duration in seconds
  taskId: string | null; // linked task ID
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  longestStreak: number;
  completedToday: boolean;
  frequency: "Daily" | "Every Focus Block";
  lastCompletedDate?: string; // YYYY-MM-DD
  streakFreezeUsedToday?: boolean; // grace period indicator
  streakFreezesRemaining?: number; // e.g. 1 per week
}

export interface WeeklyGoal {
  id: string;
  name: string;
  type: "checkbox" | "numeric";
  completed: boolean;
  targetValue?: number;
  currentValue?: number;
  unit?: string; // e.g. "pages", "miles", "focus sessions"
  weekStartDate: string; // YYYY-MM-DD representing start of the week
  status: "active" | "completed" | "missed" | "rolled_over";
  archived: boolean;
  createdAt: string;
}

export interface HabitHistoryEntry {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  isFrozen: boolean;
}


export interface AIRecommendation {
  combatReadinessRating: number;
  threatAssessment: "Green" | "Amber" | "Red";
  risksDetected: string[];
  recommendations: string[];
  motivationalQuote: string;
}
