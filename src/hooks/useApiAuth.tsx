import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'operator' | 'user';
}

// Singleton auth store so all hook consumers share the same state
let initialized = false;
let initInProgress = false; // Proteger contra múltiplas inicializações simultâneas
let authUser: User | null = null;
let authLoading = true;
const listeners = new Set<(user: User | null, loading: boolean) => void>();

function notify() {
  for (const cb of listeners) cb(authUser, authLoading);
}

async function validateUserRole() {
  if (!authUser) return;
  
  try {
    const serverUser = await apiClient.validateUserRole();
    
    // If role changed on server, update local state
    if (authUser.role !== serverUser.role) {
      console.warn('Role mismatch detected. Updating local state.');
      const validRole = (serverUser.role === 'admin' || serverUser.role === 'operator' || serverUser.role === 'user') 
        ? serverUser.role : 'user';
      authUser = { ...authUser, ...serverUser, role: validRole };
      notify();
    }
  } catch (error) {
    console.error('Role validation failed:', error);
    // On validation failure, force logout for security
    authUser = null;
    apiClient.setAccessToken(null);
    authLoading = false;
    notify();
  }
}

async function initAuthOnce() {
  if (initialized || initInProgress) return;
  
  initInProgress = true;
  initialized = true;
  
  console.log('[Auth] Initializing authentication...');

  // NÃO usar localStorage - tentar refresh do servidor
  try {
    console.log('[Auth] Attempting to refresh token from cookie...');
    const newToken = await apiClient.refreshAccessToken();
    
    if (newToken) {
      console.log('[Auth] Token refreshed, fetching user profile...');
      const user = await apiClient.getProfile();
      authUser = user as User;
      authLoading = false;
      notify();
      console.log('[Auth] User authenticated:', user.email);
      
      // Validar role periodicamente
      validateUserRole();
    } else {
      console.log('[Auth] No valid refresh token, user must login');
      authUser = null;
      authLoading = false;
      notify();
    }
  } catch (error) {
    console.error('[Auth] Initialization error:', error);
    authUser = null;
    authLoading = false;
    notify();
  } finally {
    initInProgress = false;
  }
}

// Periodic role validation every 5 minutes
setInterval(() => {
  if (authUser) {
    validateUserRole();
  }
}, 5 * 60 * 1000);

export function useApiAuth() {
  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState<boolean>(authLoading);

  useEffect(() => {
    // Subscribe to global auth updates
    const handler = (u: User | null, l: boolean) => {
      setUser(u);
      setLoading(l);
    };
    listeners.add(handler);
    // Initialize once on first consumer mount
    initAuthOnce();
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.signIn(email, password);
      // access_token vai para memória, refresh_token já está no cookie HttpOnly
      authUser = response.user as User;
      authLoading = false;
      notify();
      console.log('[Auth] Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('[Auth] Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await apiClient.signUp(email, password, fullName);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.signOut();
      authUser = null;
      authLoading = false;
      notify();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return {
    user,
    session: user ? { user } : null,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
