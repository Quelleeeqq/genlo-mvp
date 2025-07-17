'use client';

import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've sent you a verification link to complete your registration
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Verify your email address
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click the link in the email we sent you to verify your account and start using GenLo.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Didn't receive the email?</strong> Check your spam folder or{' '}
                <button className="text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                  try again
                </button>
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/auth/login"
                className="text-sm font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 