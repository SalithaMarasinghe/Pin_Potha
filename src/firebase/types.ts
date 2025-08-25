export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetHours: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  userId: string;
  date: Date;
  hours: number;
  notes?: string;
  createdAt: Date;
}

export const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#6366f1', // indigo-500
];
