'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePro?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  requirePro = false, 
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If auth is required but user is not logged in
      if (requireAuth && !user) {
        router.push(redirectTo);
        return;
      }

      // If Pro subscription is required but user doesn't have it
      if (requirePro && user && !user.subscription?.isPro) {
        router.push('/pricing');
        return;
      }

      // If user is logged in but trying to access auth pages
      if (user && (redirectTo.includes('/auth/login') || redirectTo.includes('/auth/signup'))) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, requireAuth, requirePro, redirectTo, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not logged in, show nothing (will redirect)
  if (requireAuth && !user) {
    return null;
  }

  // If Pro subscription is required but user doesn't have it, show nothing (will redirect)
  if (requirePro && user && !user.subscription?.isPro) {
    return null;
  }

  // If user is logged in but trying to access auth pages, show nothing (will redirect)
  if (user && (redirectTo.includes('/auth/login') || redirectTo.includes('/auth/signup'))) {
    return null;
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function RequireAuth({ children, redirectTo = '/auth/login' }: { children: React.ReactNode; redirectTo?: string }) {
  return (
    <AuthGuard requireAuth={true} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
}

export function RequirePro({ children, redirectTo = '/pricing' }: { children: React.ReactNode; redirectTo?: string }) {
  return (
    <AuthGuard requireAuth={true} requirePro={true} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
}

export function RequireGuest({ children, redirectTo = '/dashboard' }: { children: React.ReactNode; redirectTo?: string }) {
  return (
    <AuthGuard requireAuth={false} redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  );
} 