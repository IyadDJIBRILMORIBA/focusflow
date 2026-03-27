import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, TrendingUp, Clock, ChevronRight, Activity, Calendar, Sparkles } from 'lucide-react';
import { format, isSameDay, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Task, UserProfile } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  profile: UserProfile | null;
  tasks: Task[];
  dailyWorkload: { minutes: number; percentage: number; isOverloaded: boolean };
  burnoutRisk: { level: string; color: string; bg: string; icon: React.ReactNode };
  aiBriefing: string | null;
  isGeneratingBriefing: boolean;
  smartReschedule: () => void;
  isRescheduling: boolean;
  onStartFocus: (taskId: string) => void;
}

export function Dashboard({
  profile,
  tasks,
  dailyWorkload,
  burnoutRisk,
  aiBriefing,
  isGeneratingBriefing,
  smartReschedule,
  isRescheduling,
  onStartFocus
}: DashboardProps) {
  const today = startOfDay(new Date());
  const todayTasks = tasks.filter(t => 
    t.status !== 'completed' && 
    (isSameDay(t.deadline, today) || isBefore(t.deadline, today))
  );

  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'completed' && !isSameDay(t.deadline, today) && !isBefore(t.deadline, today))
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Bonjour, {profile?.displayName || 'Utilisateur'}</h1>
          <p className="text-slate-500 font-medium mt-1.5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {format(new Date(), 'EEEE d MMMM', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-[1.5rem] border border-slate-200 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dernière synchro</span>
            <span className="text-sm font-bold text-slate-900">{format(new Date(), 'HH:mm')}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Charge de travail</span>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{dailyWorkload.percentage}%</span>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-700 ease-out", dailyWorkload.isOverloaded ? "bg-red-500" : "bg-indigo-500")}
              style={{ width: `${Math.min(100, dailyWorkload.percentage)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Risque Burnout</span>
            {burnoutRisk.icon}
          </div>
          <div className={cn("text-3xl font-bold", burnoutRisk.color)}>
            {burnoutRisk.level}
          </div>
          <p className="text-xs text-slate-400 mt-2">Analyse prédictive sur 7 jours</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Focus Score</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {profile?.focusScore || 0}
          </div>
          <p className="text-xs text-slate-400 mt-2">Points de productivité</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Série</span>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {profile?.streak || 0} <span className="text-sm font-normal text-slate-400">jours</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Activité consécutive</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Insights Section */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Résumé Intelligent</span>
              </div>
              <div className="text-lg md:text-xl text-slate-700 leading-relaxed font-medium">
                {isGeneratingBriefing ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded-full w-1/2 animate-pulse" />
                  </div>
                ) : (
                  aiBriefing || "Préparez votre journée en ajoutant des tâches prioritaires."
                )}
              </div>
            </div>
          </section>

          {/* Today's Tasks */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Objectifs du jour</h3>
              {dailyWorkload.isOverloaded && (
                <button 
                  onClick={smartReschedule}
                  disabled={isRescheduling}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-100 shadow-sm"
                >
                  {isRescheduling ? "Réorganisation..." : "Optimiser le planning"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {todayTasks.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-slate-500 font-medium">Tout est à jour ! Profitez-en pour planifier demain.</p>
                </div>
              ) : (
                todayTasks.slice(0, 4).map((task) => (
                  <div 
                    key={task.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                        task.priority === 'high' ? "bg-red-50 text-red-600" : 
                        task.priority === 'medium' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{task.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">{task.category}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedDuration} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => onStartFocus(task.id)}
                      className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar / Tips */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Prochaines Échéances</h3>
            <div className="space-y-6">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Aucune échéance proche.</p>
              ) : (
                upcomingDeadlines.map((task) => (
                  <div key={task.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{task.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        {format(task.deadline, 'dd MMM')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Conseil Productivité</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-serif italic">
              "La concentration n'est pas l'absence de distractions, mais la capacité à y revenir sans jugement."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
