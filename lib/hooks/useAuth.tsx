"use client";

import { useState, useEffect, useContext, createContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, auth } from "@/lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithOAuth: (provider: "google" | "github" | "discord") => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };
    getInitialSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await auth.signIn(email, password);
    return { error };
  };
  const signUp = async (email: string, password: string) => {
    const { error } = await auth.signUp(email, password);
    return { error };
  };
  const signOut = async () => {
    const { error } = await auth.signOut();
    return { error };
  };
  const signInWithOAuth = async (provider: "google" | "github" | "discord") => {
    const { error } = await auth.signInWithOAuth(provider);
    return { error };
  };
  const resetPassword = async (email: string) => {
    const { error } = await auth.resetPassword(email);
    return { error };
  };
  const getAuthToken = () => session?.access_token || null;

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    getAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthenticatedFetch() {
  const { getAuthToken } = useAuth();
  return async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token available");
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    return response;
  };
} 