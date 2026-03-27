import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Globe, Moon, LogOut, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

interface SettingsProps {
  profile: UserProfile | null;
  onUpdateProfile: (data: Partial<UserProfile>) => void;
  handleLogout: () => void;
  newCapacity: number;
  setNewCapacity: (capacity: number) => void;
  deleteAccount: () => void;
}

export function Settings({
  profile,
  onUpdateProfile,
  handleLogout,
  newCapacity,
  setNewCapacity,
  deleteAccount
}: SettingsProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName || '');
  const [notifications, setNotifications] = useState({
    reminders: true,
    briefing: true,
    weekly: false
  });

  const tabs = [
    { id: 'profile', label: 'Profil & Capacité', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Moon },
    { id: 'language', label: 'Langue', icon: Globe },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  useEffect(() => {
    setNewName(profile?.displayName || '');
  }, [profile?.displayName]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await onUpdateProfile({ 
      dailyCapacity: newCapacity,
      displayName: newName
    });
    setTimeout(() => setIsSaving(false), 1000);
  };

  const renderTabContent = () => {
    switch (activeSettingsTab) {
      case 'profile':
        return (
          <>
            {/* Profile Info Section */}
            <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Informations Personnelles</h3>
                  <p className="text-sm text-slate-500">Comment souhaitez-vous être appelé ?</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nom d'affichage</label>
                  <input 
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Capacity Section */}
            <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Capacité Quotidienne</h3>
                  <p className="text-sm text-slate-500">Définissez votre temps de travail idéal par jour.</p>
                </div>
              </div>

              <div className="space-y-6 py-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Temps de travail</span>
                  <span className="text-3xl font-black text-indigo-600 font-mono">{Math.floor(newCapacity / 60)}h {newCapacity % 60 > 0 ? `${newCapacity % 60}m` : ''}</span>
                </div>
                <input 
                  type="range" 
                  min="60" 
                  max="720" 
                  step="30"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest">
                  <span>1 heure</span>
                  <span>12 heures</span>
                </div>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </section>

            {/* Danger Zone */}
            <section className="bg-red-50 p-8 rounded-[2rem] border border-red-100 space-y-4">
              <h3 className="font-bold text-red-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Zone de Danger
              </h3>
              <p className="text-sm text-red-600 leading-relaxed font-medium">
                La suppression de votre compte est irréversible. Toutes vos tâches, analyses et scores seront définitivement effacés de nos serveurs.
              </p>
              <button 
                onClick={() => {
                  if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
                    deleteAccount();
                  }
                }}
                className="w-full md:w-auto px-6 py-3 bg-white border border-red-200 text-red-600 font-bold text-sm rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                Supprimer mon compte FocusFlow
              </button>
            </section>
          </>
        );
      case 'notifications':
        return (
          <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg">Préférences de Notification</h3>
            <div className="space-y-4">
              {[
                { id: 'reminders', label: 'Rappels de tâches', desc: 'Recevoir une alerte avant une deadline' },
                { id: 'briefing', label: 'Briefing matinal', desc: 'Résumé quotidien à 8h00' },
                { id: 'weekly', label: 'Rapport hebdomadaire', desc: 'Analyse de votre performance le dimanche' },
              ].map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer group"
                  onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof notifications] }))}
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <div className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-300",
                    notifications[item.id as keyof typeof notifications] ? "bg-indigo-600" : "bg-slate-300"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                      notifications[item.id as keyof typeof notifications] ? "right-1" : "left-1"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'appearance':
        return (
          <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg">Apparence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border-2 border-indigo-600 rounded-[2rem] bg-indigo-50/30 relative overflow-hidden group cursor-pointer">
                <div className="w-full h-32 bg-white rounded-2xl mb-4 border border-slate-200 shadow-sm group-hover:shadow-md transition-all" />
                <p className="font-bold text-sm text-center text-indigo-600">Mode Clair</p>
                <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="p-6 border border-slate-200 rounded-[2rem] bg-slate-900 opacity-60 cursor-not-allowed relative overflow-hidden">
                <div className="w-full h-32 bg-slate-800 rounded-2xl mb-4 border border-slate-700 shadow-sm" />
                <p className="font-bold text-sm text-white text-center">Mode Sombre (Bientôt)</p>
              </div>
            </div>
          </section>
        );
      case 'language':
        return (
          <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg">Langue du système</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Français', 'English', 'Español', 'Deutsch'].map((lang) => (
                <button 
                  key={lang}
                  className={cn(
                    "w-full text-left px-6 py-4 rounded-2xl font-bold text-sm transition-all border",
                    lang === 'Français' ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm" : "border-slate-100 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </section>
        );
      case 'security':
        return (
          <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg">Sécurité & Accès</h3>
            <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold text-indigo-900 text-lg">Authentification Email</p>
                  <p className="text-xs text-indigo-500">Connecté en tant que : {profile?.email}</p>
                </div>
              </div>
              <p className="text-sm text-indigo-700 leading-relaxed font-medium">
                Votre compte est actuellement géré en mode local sur cet appareil.
                Utilisez un mot de passe robuste et gardez vos identifiants privés pour sécuriser vos données.
              </p>
              <div className="mt-8 pt-6 border-t border-indigo-200 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Dernière connexion</span>
                <span className="text-xs font-bold text-indigo-900">Aujourd'hui, {format(new Date(), 'HH:mm')}</span>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Paramètres</h2>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all",
                activeSettingsTab === tab.id 
                  ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
