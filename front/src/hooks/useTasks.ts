import { useState, useEffect, useMemo } from 'react';
import { firebaseService } from '../services/firebase';
import { AppUser, Task, UserProfile } from '../types';
import { startOfDay, isSameDay, isBefore, differenceInMinutes } from 'date-fns';

export function useTasks(user: AppUser | null, profile: UserProfile | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const unsubscribe = firebaseService.subscribeToTasks(user.uid, (taskList) => {
      setTasks(taskList);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const today = startOfDay(new Date());

  const dailyWorkload = useMemo(() => {
    const todayTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      (isSameDay(t.deadline, today) || isBefore(t.deadline, today))
    );
    const totalMinutes = todayTasks.reduce((acc, t) => acc + t.estimatedDuration, 0);
    const capacity = profile?.dailyCapacity || 480;
    return {
      minutes: totalMinutes,
      percentage: Math.round((totalMinutes / capacity) * 100),
      isOverloaded: totalMinutes > capacity
    };
  }, [tasks, profile, today]);

  const calculateConfidence = (task: Task) => {
    if (task.status === 'completed') return 100;
    const now = new Date();
    const daysUntilDeadline = Math.max(1, Math.ceil(differenceInMinutes(task.deadline, now) / (24 * 60)));
    const totalCapacityUntilDeadline = daysUntilDeadline * (profile?.dailyCapacity || 480);
    const tasksBeforeDeadline = tasks.filter(t => 
      t.status !== 'completed' && 
      isBefore(t.deadline, task.deadline)
    );
    const totalWorkloadBefore = tasksBeforeDeadline.reduce((acc, t) => acc + t.estimatedDuration, 0) + task.estimatedDuration;
    return Math.min(100, Math.max(0, Math.round((totalCapacityUntilDeadline / totalWorkloadBefore) * 100)));
  };

  return {
    tasks,
    loading,
    dailyWorkload,
    calculateConfidence,
    addTask: firebaseService.addTask,
    updateTask: firebaseService.updateTask,
    deleteTask: firebaseService.deleteTask
  };
}
