import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, TrendingUp, LogOut } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../lib/utils';

interface FocusOverlayProps {
  isFocusMode: boolean;
  activeTask: Task | null;
  focusTimer: number;
  isTimerRunning: boolean;
  setIsTimerRunning: (running: boolean) => void;
  setIsFocusMode: (mode: boolean) => void;
  setFocusTimer: (timer: number) => void;
}

export function FocusOverlay({
  isFocusMode,
  activeTask,
  focusTimer,
  isTimerRunning,
  setIsTimerRunning,
  setIsFocusMode,
  setFocusTimer
}: FocusOverlayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isFocusMode && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-indigo-900 flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-white/60 font-bold uppercase tracking-widest text-sm">Session de Focus</h2>
              <h3 className="text-4xl font-black text-white leading-tight">{activeTask?.title || "Tâche en cours"}</h3>
            </div>

            <div className="relative">
              <div className="text-8xl md:text-9xl font-black text-white tabular-nums tracking-tighter">
                {formatTime(focusTimer)}
              </div>
              <div className="absolute -inset-8 bg-white/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
            </div>

            {activeTask?.subTasks && activeTask.subTasks.length > 0 && (
              <div className="bg-white/10 rounded-3xl p-6 text-left space-y-3">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Prochaine étape</span>
                <p className="text-white font-medium">
                  {activeTask.subTasks.find(st => !st.completed)?.title || "Toutes les sous-tâches terminées !"}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="w-20 h-20 bg-white text-indigo-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl shadow-white/10"
              >
                {isTimerRunning ? <Clock className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}
              </button>
              <button 
                onClick={() => {
                  setIsFocusMode(false);
                  setIsTimerRunning(false);
                }}
                className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <LogOut className="w-8 h-8" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
