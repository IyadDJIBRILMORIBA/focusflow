import { useState, useEffect } from 'react';
import { AppUser } from '../types';

interface StoredUser extends AppUser {
  password: string;
}

const USERS_STORAGE_KEY = 'focusflow_local_users';
const SESSION_STORAGE_KEY = 'focusflow_current_user_uid';

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function toAppUser(user: StoredUser): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL ?? null,
  };
}

function generateUid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `u_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const sessionUid = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionUid) {
      setUser(null);
      setIsAuthReady(true);
      return;
    }

    const users = loadUsers();
    const currentUser = users.find((storedUser) => storedUser.uid === sessionUid) ?? null;
    setUser(currentUser ? toAppUser(currentUser) : null);
    setIsAuthReady(true);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const users = loadUsers();
      const existingUser = users.find(
        (storedUser) => storedUser.email.toLowerCase() === email.toLowerCase() && storedUser.password === password,
      );

      if (!existingUser) {
        setAuthError('Email ou mot de passe incorrect.');
        return;
      }

      localStorage.setItem(SESSION_STORAGE_KEY, existingUser.uid);
      setUser(toAppUser(existingUser));
    } catch (error) {
      console.error('Login failed', error);
      setAuthError('Connexion impossible. Réessayez.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setAuthError('Email invalide. Vérifiez le format.');
        return;
      }

      if (password.length < 6) {
        setAuthError('Mot de passe trop faible. Utilisez au moins 6 caractères.');
        return;
      }

      const users = loadUsers();
      const alreadyExists = users.some((storedUser) => storedUser.email.toLowerCase() === email.toLowerCase());
      if (alreadyExists) {
        setAuthError('Cet email est déjà utilisé. Connectez-vous à la place.');
        return;
      }

      const nameFromEmail = email.split('@')[0].split(/[._]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      const newUser: StoredUser = {
        uid: generateUid(),
        email,
        password,
        displayName: nameFromEmail || 'Utilisateur',
        photoURL: null,
      };

      const updatedUsers = [...users, newUser];
      saveUsers(updatedUsers);
      localStorage.setItem(SESSION_STORAGE_KEY, newUser.uid);
      setUser(toAppUser(newUser));
    } catch (error) {
      console.error('Registration failed', error);
      setAuthError('Inscription impossible. Réessayez avec un email valide et un mot de passe plus fort.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
  };

  return {
    user,
    isAuthReady,
    isAuthLoading,
    authError,
    handleLogin,
    handleRegister,
    handleLogout,
  };
}
