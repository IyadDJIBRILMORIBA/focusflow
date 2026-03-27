import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Filter, Trash2, CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Sparkles, Zap } from 'lucide-react';
import { format, isSameDay, isBefore } from 'date-fns';
import { Task } from '../types';
import { cn } from '../lib/utils';

interface TaskListProps {
  tasks: Task[];
  addTask: (e: React.FormEvent<HTMLFormElement>) => void;
  toggleTaskStatus: (task: Task) => void;
  deleteTask: (id: string) => void;
  decomposeTask: (taskId: string) => void;
  toggleSubTask: (taskId: string, subTaskIndex: number) => void;
  isDecomposing: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterPriority: string;
  setFilterPriority: (priority: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  useSmartSort: boolean;
  setUseSmartSort: (sort: boolean) => void;
  calculateConfidence: (task: Task) => number;
}

export function TaskList({
  tasks,
  addTask,
  toggleTaskStatus,
  deleteTask,
  decomposeTask,
  toggleSubTask,
  isDecomposing,
  searchQuery,
  setSearchQuery,
  filterPriority,
  setFilterPriority,
  filterStatus,
  setFilterStatus,
  useSmartSort,
  setUseSmartSort,
  calculateConfidence
}: TaskListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Search & Filter Bar */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher une tâche..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-xs font-bold px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 text-slate-600"
          >
            <option value="all">Toutes Priorités</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-xs font-bold px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 text-slate-600"
          >
            <option value="all">Tous Statuts</option>
            <option value="pending">En attente</option>
            <option value="completed">Terminées</option>
          </select>
          <button 
            onClick={() => setUseSmartSort(!useSmartSort)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border",
              useSmartSort ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Zap className="w-3 h-3" />
            Tri intelligent
          </button>
        </div>
      </div>

      {/* Add Task Button */}
      {!showAddForm && (
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full py-5 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-3 group"
        >
          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          Nouvelle Tâche
        </button>
      )}

      {/* Add Task Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={(e) => {
              addTask(e);
              setShowAddForm(false);
            }}
            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-6 overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Nouvelle Tâche</h3>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Annuler
              </button>
            </div>
            
            <div className="space-y-4">
              <input 
                name="title" 
                required 
                placeholder="Qu'allez-vous accomplir ?" 
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 tracking-widest">Durée estimée (min)</label>
                  <input 
                    name="duration" 
                    type="number" 
                    required 
                    defaultValue={30}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 tracking-widest">Échéance</label>
                  <input 
                    name="deadline" 
                    type="date" 
                    required 
                    defaultValue={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 tracking-widest">Priorité</label>
                  <select 
                    name="priority" 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 tracking-widest">Catégorie</label>
                  <select 
                    name="category" 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="work">Travail</option>
                    <option value="personal">Personnel</option>
                    <option value="health">Santé</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <textarea 
                name="description" 
                placeholder="Détails complémentaires (optionnel)..." 
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 h-32 resize-none placeholder:text-slate-400"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter la tâche
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const confidence = calculateConfidence(task);
          const isExpanded = expandedTask === task.id;
          
          return (
            <motion.div 
              layout
              key={task.id}
              className={cn(
                "bg-white rounded-[2rem] border transition-all overflow-hidden",
                task.status === 'completed' ? "opacity-60 border-slate-100" : "border-slate-200 shadow-sm hover:shadow-md"
              )}
            >
              <div className="p-6 flex items-center gap-5">
                <button 
                  onClick={() => toggleTaskStatus(task)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-sm",
                    task.status === 'completed' 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-slate-200 text-transparent hover:border-indigo-500 bg-white"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                
                <div className="flex-1 cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <h4 className={cn("font-bold text-slate-900", task.status === 'completed' && "line-through text-slate-400")}>
                      {task.title}
                    </h4>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg tracking-wider",
                      task.priority === 'high' ? "bg-red-50 text-red-600" : 
                      task.priority === 'medium' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {task.estimatedDuration} min</span>
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-indigo-400" /> {confidence}% confiance</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-8 pb-8 pt-2 border-t border-slate-50 bg-slate-50/30"
                  >
                    {task.description && (
                      <div className="mb-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Description</span>
                        <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
                      </div>
                    )}
                    
                    {/* AI Feedback */}
                    {task.aiFeedback && (
                      <div className={cn(
                        "p-5 rounded-2xl text-sm mb-6 flex gap-4 items-start shadow-sm",
                        task.isOptimistic ? "bg-amber-50 text-amber-800 border border-amber-100" : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                          task.isOptimistic ? "bg-amber-100" : "bg-emerald-100"
                        )}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <p className="font-medium leading-relaxed">{task.aiFeedback}</p>
                      </div>
                    )}

                    {/* Subtasks */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sous-tâches</span>
                        {!task.subTasks && (
                          <button 
                            onClick={() => decomposeTask(task.id)}
                            disabled={isDecomposing === task.id}
                            className="text-xs font-bold text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isDecomposing === task.id ? "Analyse..." : "Décomposer par IA"}
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {task.subTasks?.map((st, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
                            <button 
                              onClick={() => toggleSubTask(task.id, idx)}
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                st.completed ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-200 bg-white"
                              )}
                            >
                              {st.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                            <span className={cn("text-sm font-medium", st.completed ? "line-through text-slate-400" : "text-slate-700")}>
                              {st.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
