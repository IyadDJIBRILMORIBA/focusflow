/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  LogOut
} from 'lucide-react';
import { startOfDay, isSameDay, addDays, isBefore, differenceInMinutes } from 'date-fns';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useTasks } from './hooks/useTasks';
import { firebaseService } from './services/firebase';
import { runRealityCheck, decomposeTask as aiDecomposeTask, generateBriefing, generateRetrospective } from './services/gemini';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { FocusOverlay } from './components/FocusOverlay';
import { Task } from './types';

export default function App() {
  return (
    <AppContent />
  );
}

function AppContent() {
  const { user, isAuthReady, isAuthLoading, authError, handleLogin, handleRegister, handleLogout } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile(user);
  const { tasks, loading: tasksLoading, dailyWorkload, calculateConfidence } = useTasks(user, profile);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [localAuthError, setLocalAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDecomposing, setIsDecomposing] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [aiRetrospective, setAiRetrospective] = useState<string | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [isGeneratingRetrospective, setIsGeneratingRetrospective] = useState(false);
  const [useSmartSort, setUseSmartSort] = useState(false);
  const [userEnergy, setUserEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTimer, setFocusTimer] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState(480);

  useEffect(() => {
    if (profile) setNewCapacity(profile.dailyCapacity);
  }, [profile]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && focusTimer > 0) {
      interval = setInterval(() => {
        setFocusTimer(prev => prev - 1);
      }, 1000);
    } else if (focusTimer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, focusTimer]);

  // AI Briefing & Retrospective
  useEffect(() => {
    const runAiInsights = async () => {
      if (isAuthReady && user && tasks.length > 0 && !aiBriefing) {
        setIsGeneratingBriefing(true);
        setIsGeneratingRetrospective(true);
        const briefing = await generateBriefing(tasks, profile?.dailyCapacity || 480, userEnergy, profile?.streak || 0);
        const retrospective = await generateRetrospective(tasks.filter(t => t.status === 'completed'));
        setAiBriefing(briefing);
        setAiRetrospective(retrospective);
        setIsGeneratingBriefing(false);
        setIsGeneratingRetrospective(false);
      }
    };
    runAiInsights();
  }, [isAuthReady, user, tasks.length]);

  const onStartFocus = (taskId: string) => {
    setActiveTaskId(taskId);
    setIsFocusMode(true);
    setFocusTimer(25 * 60);
    setIsTimerRunning(true);
  };

  const smartReschedule = async () => {
    if (!user || !dailyWorkload.isOverloaded || isRescheduling) return;
    setIsRescheduling(true);
    try {
      const today = startOfDay(new Date());
      const todayTasks = tasks.filter(t => 
        t.status !== 'completed' && 
        (isSameDay(t.deadline, today) || isBefore(t.deadline, today))
      );
      const tasksToMove = todayTasks
        .filter(t => t.priority === 'low')
        .sort((a, b) => b.estimatedDuration - a.estimatedDuration);
      
      if (tasksToMove.length === 0) {
        alert("Aucune tâche de basse priorité à déplacer.");
        return;
      }

      const tomorrow = addDays(today, 1);
      const movePromises = tasksToMove.slice(0, 2).map(task => 
        firebaseService.updateTask(task.id, { deadline: tomorrow })
      );
      await Promise.all(movePromises);
      alert(`${movePromises.length} tâches déplacées à demain.`);
    } catch (error) {
      console.error("Rescheduling failed", error);
    } finally {
      setIsRescheduling(false);
    }
  };

  const addTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const duration = Number(formData.get('duration'));
    const description = formData.get('description') as string;

    const aiResult = await runRealityCheck(title, duration, description);

    const newTask: Omit<Task, 'id'> = {
      userId: user.uid,
      title,
      description,
      estimatedDuration: duration,
      deadline: new Date(formData.get('deadline') as string),
      priority: formData.get('priority') as any,
      energyRequired: 'medium',
      category: formData.get('category') as any,
      tags: [],
      status: 'pending',
      createdAt: new Date(),
      aiFeedback: aiResult?.feedback,
      isOptimistic: aiResult?.isOptimistic,
    };

    await firebaseService.addTask(newTask);
    form.reset();
  };

  const decomposeTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || isDecomposing) return;
    setIsDecomposing(taskId);
    const subTasks = await aiDecomposeTask(task.title, task.estimatedDuration);
    if (subTasks) {
      await firebaseService.updateTask(taskId, { subTasks });
    }
    setIsDecomposing(null);
  };

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    await firebaseService.updateTask(task.id, { status: nextStatus });
    if (nextStatus === 'completed' && user) {
      const points = task.priority === 'high' ? 50 : task.priority === 'medium' ? 30 : 10;
      await updateProfile({ focusScore: (profile?.focusScore || 0) + points });
    }
  };

  const toggleSubTask = async (taskId: string, subTaskIndex: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subTasks) return;
    const newSubTasks = [...task.subTasks];
    newSubTasks[subTaskIndex].completed = !newSubTasks[subTaskIndex].completed;
    await firebaseService.updateTask(taskId, { subTasks: newSubTasks });
  };

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchesSearch && matchesPriority && matchesStatus;
    });

    if (useSmartSort) {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      result = [...result].sort((a, b) => {
        if (priorityMap[a.priority] !== priorityMap[b.priority]) {
          return priorityMap[b.priority] - priorityMap[a.priority];
        }
        return a.deadline.getTime() - b.deadline.getTime();
      });
    }
    return result;
  }, [tasks, searchQuery, filterPriority, filterStatus, useSmartSort]);

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      const dayTasks = tasks.filter(t => t.status !== 'completed' && isSameDay(t.deadline, date));
      const total = dayTasks.reduce((acc, t) => acc + t.estimatedDuration, 0);
      return { name: date, load: total, capacity: profile?.dailyCapacity || 480 };
    });
  }, [tasks, profile]);

  const burnoutRisk = useMemo(() => {
    const overloadedDays = chartData.filter(d => d.load > d.capacity).length;
    if (overloadedDays >= 4) return { level: 'CRITIQUE', color: 'text-red-600', bg: 'bg-red-50', icon: <AlertTriangle className="w-4 h-4" /> };
    if (overloadedDays >= 2) return { level: 'ÉLEVÉ', color: 'text-amber-600', bg: 'bg-amber-50', icon: <AlertTriangle className="w-4 h-4" /> };
    return { level: 'FAIBLE', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Sparkles className="w-4 h-4" /> };
  }, [chartData]);

  const deleteAccount = async () => {
    if (!user) return;
    try {
      await firebaseService.deleteAccount(user.uid);
      handleLogout();
    } catch (error) {
      console.error("Failed to delete account", error);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalAuthError(null);

    const email = authEmail.trim();
    const password = authPassword.trim();

    if (!email || !password) {
      setLocalAuthError('Email et mot de passe requis.');
      return;
    }

    if (authMode === 'register') {
      if (password.length < 6) {
        setLocalAuthError('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      if (password !== authConfirmPassword.trim()) {
        setLocalAuthError('Les mots de passe ne correspondent pas.');
        return;
      }
      await handleRegister(email, password);
      return;
    }

    await handleLogin(email, password);
  };

  if (!isAuthReady || profileLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-full mb-4"></div>
          <p className="text-gray-500 font-medium">Chargement du pilote...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <TrendingUp className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">FocusFlow.</h1>
          <p className="text-slate-400 mb-8">Pilotez votre charge de travail et anticipez vos deadlines avec précision.</p>

          <div className="mb-5 grid grid-cols-2 bg-slate-900/40 rounded-xl p-1">
            <button
              onClick={() => {
                setAuthMode('login');
                setLocalAuthError(null);
              }}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${authMode === 'login' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'}`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setLocalAuthError(null);
              }}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${authMode === 'register' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'}`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-white/90 text-slate-900 border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="email"
              required
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full bg-white/90 text-slate-900 border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
              required
            />
            {authMode === 'register' && (
              <input
                type="password"
                value={authConfirmPassword}
                onChange={(e) => setAuthConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                className="w-full bg-white/90 text-slate-900 border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="new-password"
                required
              />
            )}

            {(localAuthError || authError) && (
              <p className="text-red-300 text-sm text-center">{localAuthError || authError}</p>
            )}

            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-white text-slate-900 font-semibold py-4 rounded-2xl hover:bg-slate-100 transition-all disabled:opacity-60"
            >
              {isAuthLoading
                ? 'Veuillez patienter...'
                : authMode === 'register'
                  ? 'Créer mon compte'
                  : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} tasks={tasks} />
      
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 md:hidden">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">FocusFlow.</span>
            </div>
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} className="w-8 h-8 rounded-full border border-slate-200" alt="Avatar" />
              ) : (
                <div className="w-8 h-8 rounded-full border border-slate-200 bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {(profile?.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 md:px-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              profile={profile}
              tasks={tasks}
              dailyWorkload={dailyWorkload}
              burnoutRisk={burnoutRisk}
              aiBriefing={aiBriefing}
              isGeneratingBriefing={isGeneratingBriefing}
              smartReschedule={smartReschedule}
              isRescheduling={isRescheduling}
              onStartFocus={onStartFocus}
            />
          )}
          {activeTab === 'tasks' && (
            <TaskList 
              tasks={filteredTasks}
              addTask={addTask}
              toggleTaskStatus={toggleTaskStatus}
              deleteTask={firebaseService.deleteTask}
              decomposeTask={decomposeTask}
              toggleSubTask={toggleSubTask}
              isDecomposing={isDecomposing}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterPriority={filterPriority}
              setFilterPriority={setFilterPriority}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              useSmartSort={useSmartSort}
              setUseSmartSort={setUseSmartSort}
              calculateConfidence={calculateConfidence}
            />
          )}
          {activeTab === 'analytics' && (
            <Analytics tasks={tasks} profile={profile} />
          )}
          {activeTab === 'settings' && (
            <Settings 
              profile={profile}
              onUpdateProfile={updateProfile}
              handleLogout={handleLogout}
              newCapacity={newCapacity}
              setNewCapacity={setNewCapacity}
              deleteAccount={deleteAccount}
            />
          )}
        </main>
      </div>

      <FocusOverlay 
        isFocusMode={isFocusMode}
        activeTask={tasks.find(t => t.id === activeTaskId) || null}
        focusTimer={focusTimer}
        isTimerRunning={isTimerRunning}
        setIsTimerRunning={setIsTimerRunning}
        setIsFocusMode={setIsFocusMode}
        setFocusTimer={setFocusTimer}
      />
    </div>
  );
}
