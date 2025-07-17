import { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  subscription?: {
    isPro: boolean;
    plan: string;
    expiresAt?: string;
    features: string[];
  };
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<{ error: string | null; data?: any }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: string | null; data?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ error: string | null }>;
} 