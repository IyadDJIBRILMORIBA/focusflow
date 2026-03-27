import { Task, UserProfile } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:4000/api';
export const AUTH_TOKEN_STORAGE_KEY = 'focusflow_auth_token';

type Listener<T> = (value: T) => void;

const profileListeners = new Map<string, Set<Listener<UserProfile | null>>>();
const taskListeners = new Map<string, Set<Listener<Task[]>>>();

let profilePollingTimer: number | null = null;
let taskPollingTimer: number | null = null;

type ApiTask = Omit<Task, 'deadline' | 'createdAt' | 'completedAt'> & {
  deadline: string;
  createdAt: string;
  completedAt?: string | null;
};

type ApiProfile = Omit<UserProfile, 'lastActive'> & {
  lastActive?: string | null;
};

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function mapTaskFromApi(task: ApiTask): Task {
  return {
    ...task,
    deadline: new Date(task.deadline),
    createdAt: new Date(task.createdAt),
    completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
  };
}

function mapTaskToApi(task: Partial<Task>) {
  const payload: Record<string, unknown> = {};

  if (task.title !== undefined) payload.title = task.title;
  if (task.description !== undefined) payload.description = task.description;
  if (task.estimatedDuration !== undefined) payload.estimatedDuration = task.estimatedDuration;
  if (task.deadline !== undefined) payload.deadline = task.deadline.toISOString();
  if (task.priority !== undefined) payload.priority = task.priority;
  if (task.energyRequired !== undefined) payload.energyRequired = task.energyRequired;
  if (task.category !== undefined) payload.category = task.category;
  if (task.tags !== undefined) payload.tags = task.tags;
  if (task.status !== undefined) payload.status = task.status;
  if (task.completedAt !== undefined) payload.completedAt = task.completedAt ? task.completedAt.toISOString() : null;
  if (task.aiFeedback !== undefined) payload.aiFeedback = task.aiFeedback;
  if (task.isOptimistic !== undefined) payload.isOptimistic = task.isOptimistic;
  if (task.subTasks !== undefined) payload.subTasks = task.subTasks;

  return payload;
}

function mapProfileFromApi(profile: ApiProfile): UserProfile {
  return {
    ...profile,
    lastActive: profile.lastActive ? new Date(profile.lastActive) : undefined,
  };
}

function mapProfileToApi(profile: Partial<UserProfile>) {
  const payload: Record<string, unknown> = {};

  if (profile.displayName !== undefined) payload.displayName = profile.displayName;
  if (profile.dailyCapacity !== undefined) payload.dailyCapacity = profile.dailyCapacity;
  if (profile.streak !== undefined) payload.streak = profile.streak;
  if (profile.lastActive !== undefined) payload.lastActive = profile.lastActive ? profile.lastActive.toISOString() : null;
  if (profile.focusScore !== undefined) payload.focusScore = profile.focusScore;
  if (profile.theme !== undefined) payload.theme = profile.theme;
  if (profile.language !== undefined) payload.language = profile.language;
  if (profile.notificationsEnabled !== undefined) payload.notificationsEnabled = profile.notificationsEnabled;

  return payload;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message ?? 'Erreur réseau/API';
    throw new Error(message);
  }

  return data as T;
}

async function refreshProfile(uid: string) {
  const listeners = profileListeners.get(uid);
  if (!listeners || listeners.size === 0) return;

  try {
    const apiProfile = await apiRequest<ApiProfile>('/profile');
    const profile = mapProfileFromApi(apiProfile);
    listeners.forEach((listener) => listener(profile));
  } catch {
    listeners.forEach((listener) => listener(null));
  }
}

async function refreshTasks(uid: string) {
  const listeners = taskListeners.get(uid);
  if (!listeners || listeners.size === 0) return;

  try {
    const apiTasks = await apiRequest<ApiTask[]>('/tasks');
    const tasks = apiTasks.map(mapTaskFromApi).sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
    listeners.forEach((listener) => listener(tasks));
  } catch {
    listeners.forEach((listener) => listener([]));
  }
}

function startProfilePolling(uid: string) {
  if (profilePollingTimer) return;
  profilePollingTimer = window.setInterval(() => {
    refreshProfile(uid).catch(() => undefined);
  }, 10000);
}

function stopProfilePolling() {
  if (!profilePollingTimer) return;
  window.clearInterval(profilePollingTimer);
  profilePollingTimer = null;
}

function startTaskPolling(uid: string) {
  if (taskPollingTimer) return;
  taskPollingTimer = window.setInterval(() => {
    refreshTasks(uid).catch(() => undefined);
  }, 8000);
}

function stopTaskPolling() {
  if (!taskPollingTimer) return;
  window.clearInterval(taskPollingTimer);
  taskPollingTimer = null;
}

export const firebaseService = {
  setAuthToken: (token: string) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  },

  clearAuthToken: () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  },

  getAuthToken: () => getToken(),

  subscribeToProfile: (uid: string, callback: (profile: UserProfile | null) => void) => {
    const listeners = profileListeners.get(uid) ?? new Set();
    listeners.add(callback);
    profileListeners.set(uid, listeners);

    refreshProfile(uid).catch(() => callback(null));
    startProfilePolling(uid);

    return () => {
      const currentListeners = profileListeners.get(uid);
      if (!currentListeners) return;
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        profileListeners.delete(uid);
        stopProfilePolling();
      }
    };
  },

  createProfile: async (profile: UserProfile) => {
    await apiRequest<ApiProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(mapProfileToApi(profile)),
    });
    await refreshProfile(profile.uid);
  },

  updateProfile: async (uid: string, data: Partial<UserProfile>) => {
    await apiRequest<ApiProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(mapProfileToApi(data)),
    });
    await refreshProfile(uid);
  },

  subscribeToTasks: (uid: string, callback: (tasks: Task[]) => void) => {
    const listeners = taskListeners.get(uid) ?? new Set();
    listeners.add(callback);
    taskListeners.set(uid, listeners);

    refreshTasks(uid).catch(() => callback([]));
    startTaskPolling(uid);

    return () => {
      const currentListeners = taskListeners.get(uid);
      if (!currentListeners) return;
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        taskListeners.delete(uid);
        stopTaskPolling();
      }
    };
  },

  addTask: async (task: Omit<Task, 'id'>) => {
    const createdTask = await apiRequest<ApiTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(mapTaskToApi(task)),
    });
    await refreshTasks(task.userId);
    return createdTask.id;
  },

  updateTask: async (taskId: string, data: Partial<Task>) => {
    await apiRequest<ApiTask>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(mapTaskToApi(data)),
    });

    for (const [uid] of taskListeners) {
      await refreshTasks(uid);
    }
  },

  deleteTask: async (taskId: string) => {
    await apiRequest<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });

    for (const [uid] of taskListeners) {
      await refreshTasks(uid);
    }
  },

  deleteAccount: async (_uid: string) => {
    await apiRequest<void>('/account', { method: 'DELETE' });
    firebaseService.clearAuthToken();

    profileListeners.forEach((listeners) => {
      listeners.forEach((listener) => listener(null));
    });
    taskListeners.forEach((listeners) => {
      listeners.forEach((listener) => listener([]));
    });
  },
};
