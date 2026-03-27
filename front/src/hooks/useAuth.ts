import { useEffect, useState } from 'react';
import { AppUser } from '../types';
import { firebaseService } from '../services/firebase';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:4000/api';

interface AuthResponse {
  token: string;
  user: AppUser;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = firebaseService.getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const apiErrors = data?.errors ? Object.values<string[]>(data.errors).flat() : [];
    const message = apiErrors[0] ?? data?.message ?? 'Erreur d’authentification.';
    throw new Error(message);
  }

  return data as T;
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = firebaseService.getAuthToken();
      if (!token) {
        setIsAuthReady(true);
        return;
      }

      try {
        const currentUser = await request<AppUser>('/auth/me', { method: 'GET' });
        setUser(currentUser);
      } catch {
        firebaseService.clearAuthToken();
        setUser(null);
      } finally {
        setIsAuthReady(true);
      }
    };

    bootstrapAuth().catch(() => {
      setIsAuthReady(true);
    });
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const auth = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      firebaseService.setAuthToken(auth.token);
      setUser(auth.user);
    } catch (error) {
      console.error('Login failed', error);
      setAuthError(error instanceof Error ? error.message : 'Connexion impossible. Réessayez.');
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

      const nameFromEmail = email
        .split('@')[0]
        .split(/[._]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const auth = await request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: nameFromEmail || 'Utilisateur',
          email,
          password,
          password_confirmation: password,
        }),
      });

      firebaseService.setAuthToken(auth.token);
      setUser(auth.user);
    } catch (error) {
      console.error('Registration failed', error);
      setAuthError(error instanceof Error ? error.message : 'Inscription impossible. Réessayez.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      firebaseService.clearAuthToken();
      setUser(null);
    }
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
