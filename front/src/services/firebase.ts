import { Task, UserProfile } from '../types';

const PROFILE_STORAGE_KEY = 'focusflow_local_profiles';
const TASK_STORAGE_KEY = 'focusflow_local_tasks';

type PersistedTask = Omit<Task, 'deadline' | 'createdAt' | 'completedAt'> & {
  deadline: string;
  createdAt: string;
  completedAt?: string;
};

const profileListeners = new Map<string, Set<(profile: UserProfile | null) => void>>();
const taskListeners = new Map<string, Set<(tasks: Task[]) => void>>();

function loadProfiles(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([uid, profile]) => {
        const typedProfile = profile as UserProfile & { lastActive?: string };
        return [uid, {
          ...typedProfile,
          lastActive: typedProfile.lastActive ? new Date(typedProfile.lastActive) : undefined,
        }];
      }),
    );
  } catch {
    return {};
  }
}

function saveProfiles(profiles: Record<string, UserProfile>) {
  const serializableProfiles = Object.fromEntries(
    Object.entries(profiles).map(([uid, profile]) => [uid, {
      ...profile,
      lastActive: profile.lastActive ? profile.lastActive.toISOString() : undefined,
    }]),
  );
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(serializableProfiles));
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((task) => {
      const typedTask = task as PersistedTask;
      return {
        ...typedTask,
        deadline: new Date(typedTask.deadline),
        createdAt: new Date(typedTask.createdAt),
        completedAt: typedTask.completedAt ? new Date(typedTask.completedAt) : undefined,
      };
    });
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  const persistedTasks: PersistedTask[] = tasks.map((task) => ({
    ...task,
    deadline: task.deadline.toISOString(),
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt ? task.completedAt.toISOString() : undefined,
  }));

  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(persistedTasks));
}

function generateTaskId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `task_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function notifyProfile(uid: string) {
  const listeners = profileListeners.get(uid);
  if (!listeners || listeners.size === 0) return;

  const profile = loadProfiles()[uid] ?? null;
  listeners.forEach((listener) => listener(profile));
}

function notifyTasks(uid: string) {
  const listeners = taskListeners.get(uid);
  if (!listeners || listeners.size === 0) return;

  const tasks = loadTasks()
    .filter((task) => task.userId === uid)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  listeners.forEach((listener) => listener(tasks));
}

export const firebaseService = {
  subscribeToProfile: (uid: string, callback: (profile: UserProfile | null) => void) => {
    const listeners = profileListeners.get(uid) ?? new Set();
    listeners.add(callback);
    profileListeners.set(uid, listeners);

    callback(loadProfiles()[uid] ?? null);

    return () => {
      const currentListeners = profileListeners.get(uid);
      if (!currentListeners) return;
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        profileListeners.delete(uid);
      }
    };
  },

  createProfile: async (profile: UserProfile) => {
    const profiles = loadProfiles();
    profiles[profile.uid] = {
      ...profile,
      lastActive: profile.lastActive ?? new Date(),
    };
    saveProfiles(profiles);
    notifyProfile(profile.uid);
  },

  updateProfile: async (uid: string, data: Partial<UserProfile>) => {
    const profiles = loadProfiles();
    const currentProfile = profiles[uid];
    if (!currentProfile) return;

    profiles[uid] = {
      ...currentProfile,
      ...data,
    };
    saveProfiles(profiles);
    notifyProfile(uid);
  },

  subscribeToTasks: (uid: string, callback: (tasks: Task[]) => void) => {
    const listeners = taskListeners.get(uid) ?? new Set();
    listeners.add(callback);
    taskListeners.set(uid, listeners);

    const currentTasks = loadTasks()
      .filter((task) => task.userId === uid)
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
    callback(currentTasks);

    return () => {
      const currentListeners = taskListeners.get(uid);
      if (!currentListeners) return;
      currentListeners.delete(callback);
      if (currentListeners.size === 0) {
        taskListeners.delete(uid);
      }
    };
  },

  addTask: async (task: Omit<Task, 'id'>) => {
    const tasks = loadTasks();
    const newTask: Task = {
      ...task,
      id: generateTaskId(),
      createdAt: task.createdAt ?? new Date(),
      completedAt: task.completedAt,
    };

    tasks.push(newTask);
    saveTasks(tasks);
    notifyTasks(newTask.userId);
    return newTask.id;
  },

  updateTask: async (taskId: string, data: Partial<Task>) => {
    const tasks = loadTasks();
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index === -1) return;

    const currentTask = tasks[index];
    const updatedTask: Task = {
      ...currentTask,
      ...data,
      completedAt:
        data.status === 'completed' && !data.completedAt
          ? new Date()
          : data.status === 'pending'
            ? undefined
            : (data.completedAt ?? currentTask.completedAt),
    };

    tasks[index] = updatedTask;
    saveTasks(tasks);
    notifyTasks(updatedTask.userId);
  },

  deleteTask: async (taskId: string) => {
    const tasks = loadTasks();
    const taskToDelete = tasks.find((task) => task.id === taskId);
    if (!taskToDelete) return;

    const nextTasks = tasks.filter((task) => task.id !== taskId);
    saveTasks(nextTasks);
    notifyTasks(taskToDelete.userId);
  },

  deleteAccount: async (uid: string) => {
    const profiles = loadProfiles();
    delete profiles[uid];
    saveProfiles(profiles);

    const tasks = loadTasks();
    const nextTasks = tasks.filter((task) => task.userId !== uid);
    saveTasks(nextTasks);

    notifyProfile(uid);
    notifyTasks(uid);
  },
};
