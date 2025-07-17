'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Github, Chrome } from 'lucide-react';
import Alert from '@/components/ui/Alert';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signInWithOAuth, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await signIn({ email, password });
    
    if (!result.error) {
      router.push('/dashboard');
    }
    
    setIsLoading(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    await signInWithOAuth(provider);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-black hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <h2 className="text-3xl font-bold text-black">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-black">
            Sign in to your GenLo account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-sm border border-black p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-black" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-black rounded-lg bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-black" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-black rounded-lg bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-black hover:text-black" />
                  ) : (
                    <Eye className="h-5 w-5 text-black hover:text-black" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert type="error" className="mb-4">{error}</Alert>
            )}

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link 
                  href="/auth/forgot-password"
                  className="font-medium text-black hover:text-black"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Loading" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-black">Or continue with</span>
              </div>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-black rounded-lg shadow-sm bg-white text-sm font-medium text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Chrome className="w-5 h-5" />
              <span className="ml-2">Google</span>
            </button>

            <button
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-black rounded-lg shadow-sm bg-white text-sm font-medium text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="ml-2">GitHub</span>
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-black">
            Don't have an account?{' '}
            <Link 
              href="/auth/signup"
              className="font-medium text-black hover:text-black"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 