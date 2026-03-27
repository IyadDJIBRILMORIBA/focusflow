import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ListTodo, BarChart3, Settings, TrendingUp } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../lib/utils';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tasks: Task[];
}

export function Navigation({ activeTab, setActiveTab, tasks }: NavigationProps) {
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'tasks', label: 'Mes Tâches', icon: ListTodo, badge: pendingCount },
    { id: 'analytics', label: 'Analyses', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:relative md:border-t-0 md:border-r md:w-72 md:h-screen md:bg-white">
      <div className="flex justify-around items-center h-20 md:flex-col md:h-full md:justify-start md:pt-10 md:px-4 md:gap-2">
        <div className="hidden md:flex items-center gap-3 px-6 mb-12 w-full">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 rotate-3">
            <TrendingUp className="text-white w-6 h-6" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">FocusFlow.</span>
        </div>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-3 transition-all md:flex-row md:justify-start md:px-6 md:py-4 md:gap-4 md:rounded-2xl relative group",
                isActive 
                  ? "text-indigo-600 md:bg-indigo-50" 
                  : "text-slate-400 hover:text-slate-900 md:hover:bg-slate-50"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-bold uppercase tracking-widest md:text-sm md:capitalize md:tracking-normal", isActive ? "text-indigo-600" : "text-slate-500")}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full md:hidden"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
