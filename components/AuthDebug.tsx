'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function AuthDebug() {
  const { user, loading, error } = useAuth();
  const [authTest, setAuthTest] = useState<any>(null);

  useEffect(() => {
    const testAuth = async () => {
      try {
        const response = await fetch('/api/test-auth');
        const data = await response.json();
        setAuthTest(data);
      } catch (error) {
        console.error('Auth test failed:', error);
        setAuthTest({ error: 'Failed to test auth' });
      }
    };

    testAuth();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show debug info in production
  }

  return (
    <div className="fixed top-20 right-4 z-50 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm text-xs">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Error:</strong> {error || 'None'}</div>
        <div><strong>User ID:</strong> {user?.id || 'None'}</div>
        <div><strong>User Email:</strong> {user?.email || 'None'}</div>
        <div><strong>Auth Test:</strong> {authTest ? JSON.stringify(authTest, null, 2) : 'Loading...'}</div>
      </div>
    </div>
  );
} 