'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Github, Chrome, Check } from 'lucide-react';
import Alert from '@/components/ui/Alert';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { signUp, signInWithOAuth, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      return;
    }

    setIsLoading(true);

    const result = await signUp({ email, password, confirmPassword });

    if (!result.error) {
      router.push('/auth/verify-email');
    }

    setIsLoading(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    await signInWithOAuth(provider);
    setIsLoading(false);
  };

  const passwordStrength = () => {
    if (password.length === 0) return { score: 0, text: '', color: '' };
    if (password.length < 8) return { score: 1, text: 'Weak', color: 'text-black dark:text-white' };
    if (password.length < 12) return { score: 2, text: 'Fair', color: 'text-black dark:text-white' };
    if (password.length < 16) return { score: 3, text: 'Good', color: 'text-black dark:text-white' };
    return { score: 4, text: 'Strong', color: 'text-black dark:text-white' };
  };

  const strength = passwordStrength();

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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-black">
            Start creating amazing AI content with GenLo
          </p>
        </div>

        {/* Signup Form */}
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-black rounded-lg bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Create a password"
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

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white rounded-full h-2 border border-black">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 bg-black ${
                          strength.score === 1 ? 'w-1/4' :
                          strength.score === 2 ? 'w-1/2' :
                          strength.score === 3 ? 'w-3/4' :
                          strength.score === 4 ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium text-black`}>
                      {strength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-black" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors border-black ${
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? 'border-black'
                      : 'border-black'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-black hover:text-black" />
                  ) : (
                    <Eye className="h-5 w-5 text-black hover:text-black" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  {password === confirmPassword ? (
                    <>
                      <Check className="w-4 h-4 text-black" />
                      <span className="text-xs text-black">Passwords match</span>
                    </>
                  ) : (
                    <span className="text-xs text-black">Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-black focus:ring-black border-black rounded"
              />
              <label htmlFor="terms" className="text-sm text-black">
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="font-medium text-black hover:text-black"
                >
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link
                  href="/privacy"
                  className="font-medium text-black hover:text-black"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <Alert type="error" className="mb-4">{error}</Alert>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Loading" />
                  Signing up...
                </div>
              ) : (
                'Sign up'
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
              <Chrome className="w-5 h-5 text-black" />
              <span className="ml-2">Google</span>
            </button>

            <button
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-black rounded-lg shadow-sm bg-white text-sm font-medium text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Github className="w-5 h-5 text-black" />
              <span className="ml-2">GitHub</span>
            </button>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-black">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-black hover:text-black"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 