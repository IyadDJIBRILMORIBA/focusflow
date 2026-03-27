export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  dailyCapacity: number; // in minutes
  streak?: number;
  lastActive?: Date;
  focusScore?: number;
  theme?: 'light' | 'dark' | 'system';
  language?: 'fr' | 'en';
  notificationsEnabled?: boolean;
}

export interface SubTask {
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  estimatedDuration: number; // in minutes
  deadline: Date;
  priority: 'low' | 'medium' | 'high';
  energyRequired: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'health' | 'other';
  tags: string[];
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  aiFeedback?: string;
  isOptimistic?: boolean;
  subTasks?: SubTask[];
}
