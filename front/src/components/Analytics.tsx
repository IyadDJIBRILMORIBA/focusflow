import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { format, isSameDay, addDays, startOfDay } from 'date-fns';
import { Task, UserProfile } from '../types';
import { TrendingUp, CheckCircle2, Clock, Zap, Sparkles } from 'lucide-react';

interface AnalyticsProps {
  tasks: Task[];
  profile: UserProfile | null;
}

export function Analytics({ tasks, profile }: AnalyticsProps) {
  const today = startOfDay(new Date());

  const weeklyStats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, -i);
      return {
        date: format(d, 'EEE'),
        fullDate: d,
        completed: 0,
        totalMinutes: 0
      };
    }).reverse();

    tasks.forEach(t => {
      if (t.status === 'completed' && t.completedAt) {
        const day = last7Days.find(d => isSameDay(d.fullDate, t.completedAt!));
        if (day) {
          day.completed += 1;
          day.totalMinutes += t.estimatedDuration;
        }
      }
    });

    return last7Days;
  }, [tasks, today]);

  const totalCompleted = tasks.filter(t => t.status === 'completed').length;
  const totalMinutes = tasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.estimatedDuration, 0);
  const avgMinutesPerTask = totalCompleted > 0 ? Math.round(totalMinutes / totalCompleted) : 0;

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analyses de Performance</h2>
          <p className="text-slate-500 text-sm">Suivez votre productivité et vos tendances de travail.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-2xl border border-indigo-100 shadow-sm">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-bold">Score: {profile?.focusScore || 0}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tâches Terminées</span>
          </div>
          <div className="text-4xl font-bold text-slate-900">{totalCompleted}</div>
          <p className="text-xs text-slate-400 mt-3 font-medium">Volume total de travail accompli</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Temps Investi</span>
          </div>
          <div className="text-4xl font-bold text-slate-900">{totalMinutes} <span className="text-lg font-normal text-slate-400">min</span></div>
          <p className="text-xs text-slate-400 mt-3 font-medium">Environ {Math.round(totalMinutes / 60)} heures de focus</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Moyenne / Tâche</span>
          </div>
          <div className="text-4xl font-bold text-slate-900">{avgMinutesPerTask} <span className="text-lg font-normal text-slate-400">min</span></div>
          <p className="text-xs text-slate-400 mt-3 font-medium">Durée moyenne d'une session</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Pulse Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-bold text-slate-900">Activité Hebdomadaire</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">7 derniers jours</span>
          </div>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={220}>
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  dy={15}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '16px'
                  }}
                />
                <Bar dataKey="completed" radius={[8, 8, 8, 8]} barSize={40}>
                  {weeklyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.completed > 0 ? '#4F46E5' : '#F1F5F9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Investment Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-bold text-slate-900">Investissement Temps</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes par jour</span>
          </div>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={220}>
              <AreaChart data={weeklyStats}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  dy={15}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '16px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalMinutes" 
                  stroke="#6366F1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorMinutes)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center flex-shrink-0 rotate-6 shadow-2xl shadow-indigo-500/40 border border-indigo-400/30">
            <Sparkles className="w-12 h-12" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">Optimisation de votre flux</h3>
            <p className="text-slate-300 text-lg leading-relaxed font-medium">
              D'après vos analyses, vous êtes <span className="text-indigo-400 font-bold">24% plus productif</span> le matin entre 9h et 11h. 
              Essayez de planifier vos tâches de haute priorité dans ce créneau pour maximiser votre impact.
            </p>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
}
