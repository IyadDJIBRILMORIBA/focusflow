import { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebase';
import { AppUser, UserProfile } from '../types';
import { startOfDay, isSameDay, addDays } from 'date-fns';

export function useProfile(user: AppUser | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = firebaseService.subscribeToProfile(user.uid, (p) => {
      if (p) {
        setProfile(p);
        
        // Update streak if needed
        const lastActive = p.lastActive;
        const today = startOfDay(new Date());
        if (!lastActive || !isSameDay(lastActive, today)) {
          const isYesterday = lastActive && isSameDay(lastActive, addDays(today, -1));
          const newStreak = isYesterday ? (p.streak || 0) + 1 : 1;
          firebaseService.updateProfile(user.uid, { 
            streak: newStreak,
            lastActive: new Date()
          }).catch(console.error);
        }
      } else {
        // Create default profile
        const nameFromEmail = user.email 
          ? user.email.split('@')[0].split(/[._]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') 
          : '';
        
        const defaultProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || nameFromEmail || 'Utilisateur',
          dailyCapacity: 480,
          streak: 1,
          lastActive: new Date(),
          focusScore: 0
        };
        firebaseService.createProfile(defaultProfile);
        setProfile(defaultProfile);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return {
    profile,
    loading,
    updateProfile: async (data: Partial<UserProfile>) => {
      if (!user) return;
      await firebaseService.updateProfile(user.uid, data);
    }
  };
}
