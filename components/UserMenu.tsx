'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Crown,
  CreditCard,
  HelpCircle
} from 'lucide-react';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/auth/login"
          className="text-black hover:text-gray-900 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="bg-black text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-gray-900 transition-all duration-200"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block text-sm font-medium">{user.email}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {user.subscription?.isPro ? (
                <div className="flex items-center gap-1 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full">
                  <Crown className="w-3 h-3" />
                  <span>Pro</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                  <span>Free</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              Dashboard
            </Link>

            <Link
              href="/pricing"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <CreditCard className="w-4 h-4" />
              {user.subscription?.isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>

            <Link
              href="/help"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <HelpCircle className="w-4 h-4" />
              Help & Support
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 