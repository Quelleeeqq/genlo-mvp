'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Check, CreditCard, Shield } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabaseClient';

const stripePromise = (() => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  console.log('Stripe publishable key available:', !!publishableKey);
  if (!publishableKey) {
    console.error('Stripe publishable key is not configured');
    return null;
  }
  if (!publishableKey.startsWith('pk_')) {
    console.error('Invalid Stripe publishable key format');
    return null;
  }
  return loadStripe(publishableKey);
})();

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: { monthly: 49, yearly: 488 },
    description: 'Perfect for getting started',
    features: [
      '3 videos per month',
      'Basic image generation',
      'Standard support',
      'Basic templates',
      'HD quality videos',
      'Email support'
    ],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 129, yearly: 1285 },
    description: 'For professionals and creators',
    features: [
      '7 videos per month',
      'Unlimited image generation',
      'Priority processing',
      'Advanced video settings',
      'Priority support',
      'Custom templates',
      'API access',
      'Analytics dashboard',
      '4K quality videos',
      'Priority email support'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 249, yearly: 2480 },
    description: 'For teams and businesses',
    features: [
      '15 videos per month',
      'Everything in Pro',
      'Team collaboration',
      'Custom integrations',
      'Dedicated support',
      'White-label options',
      'Advanced analytics',
      'Custom training',
      'SLA guarantee',
      'Phone support',
      'Custom video lengths'
    ],
    popular: false
  }
];

function SignupWithPaymentPageInner() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [step, setStep] = useState<'plan' | 'payment'>('plan');

  const { signUp, signIn, user, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-select plan from pricing page
  useState(() => {
    const fromPricing = searchParams.get('plan');
    if (fromPricing && plans.find(p => p.id === fromPricing)) {
      setSelectedPlan(fromPricing);
    }
  });

  const handlePlanSelection = () => {
    if (!email || !password || !confirmPassword || !agreedToTerms) {
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!email || !password || !confirmPassword || !agreedToTerms) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting payment process...');
      
      // Check if user already exists
      let userId = '';
      try {
        // Try to sign in first to check if user exists
        const signInResult = await signIn({ email, password });
        if (!signInResult.error) {
          // User exists and password is correct, get user ID
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id || '';
          console.log('User already exists, using existing account');
        } else {
          // User doesn't exist or password is wrong, try to create new account
          console.log('Creating new user account...');
          const signupResult = await signUp({ email, password, confirmPassword });
          if (signupResult.error) {
            if (signupResult.error.includes('already registered')) {
              // User exists but password might be wrong
              alert('An account with this email already exists. Please sign in with the correct password.');
              setIsLoading(false);
              return;
            }
            console.error('Signup error:', signupResult.error);
            setIsLoading(false);
            return;
          }
          console.log('User account created successfully');
          
          // For payment flow, we need to get the user ID immediately
          // Try to get user from the signup response first
          if (signupResult.data?.user?.id) {
            userId = signupResult.data.user.id;
            console.log('Got user ID from signup response:', userId);
          } else {
            // Fallback: try to get user from session
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
              userId = session.user.id;
              console.log('Got user ID from session:', userId);
            } else {
              // Last resort: try to get user directly
              const { data: { user }, error: getUserError } = await supabase.auth.getUser();
              if (getUserError) {
                console.error('Error getting user after signup:', getUserError);
                throw new Error('Failed to get user after signup');
              }
              userId = user?.id || '';
              console.log('Retrieved user ID from getUser:', userId);
            }
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        setIsLoading(false);
        return;
      }

      if (!userId) {
        // Fallback: try to get user ID from auth context
        console.log('Trying to get user ID from auth context...');
        if (user?.id) {
          userId = user.id;
          console.log('Got user ID from auth context:', userId);
        } else {
          console.error('No user ID available from any source');
          throw new Error('Failed to get user ID');
        }
      }

      // Create Stripe checkout session using direct checkout
      console.log('Creating Stripe checkout session...');
      const response = await fetch('/api/stripe/direct-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle,
          email,
          userId: userId
        }),
      });

      console.log('Stripe API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stripe API error:', errorText);
        throw new Error(`Stripe API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Stripe API response:', data);

      if (data.error) {
        console.error('Stripe error:', data.error);
        throw new Error(data.error);
      }

      if (!data.checkoutUrl) {
        console.error('No checkout URL returned');
        throw new Error('No checkout URL returned from Stripe');
      }

      console.log('Redirecting to Stripe checkout...');
      
      // Redirect directly to Stripe's hosted checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (password.length === 0) return { score: 0, text: '', color: '' };
    if (password.length < 8) return { score: 1, text: 'Weak', color: 'text-red-500' };
    if (password.length < 12) return { score: 2, text: 'Fair', color: 'text-yellow-500' };
    if (password.length < 16) return { score: 3, text: 'Good', color: 'text-blue-500' };
    return { score: 4, text: 'Strong', color: 'text-green-500' };
  };

  const strength = passwordStrength();
  const selectedPlanData = plans.find(p => p.id === selectedPlan)!;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center text-black">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-black hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h2 className="text-3xl font-bold text-black">
            {step === 'plan' ? 'Choose Your Plan' : 'Complete Your Payment'}
          </h2>
          <p className="mt-2 text-sm text-black">
            {step === 'plan' 
              ? 'Select a plan and create your account' 
              : 'Secure payment powered by Stripe'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-black">
          {/* Plan Selection / Payment Form */}
          <div className="bg-white rounded-lg shadow-sm border border-black p-8 text-black">
            {step === 'plan' ? (
              <>
                {/* Billing Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        billingCycle === 'monthly'
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        billingCycle === 'yearly'
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Yearly
                      <span className="ml-1 text-xs bg-black text-white px-2 py-1 rounded-full">
                        Save 17%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plan Cards */}
                <div className="space-y-4 mb-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300 bg-white text-black'
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2 -right-2">
                          <span className="bg-black text-white px-2 py-1 rounded-full text-xs font-semibold">
                            Most Popular
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className={`font-semibold ${selectedPlan === plan.id ? 'text-white' : 'text-black'}`}>
                            {plan.name}
                          </h3>
                          <p className={`text-sm ${selectedPlan === plan.id ? 'text-white opacity-80' : 'text-black opacity-80'}`}>
                            {plan.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${selectedPlan === plan.id ? 'text-white' : 'text-black'}`}>
                            ${plan.price[billingCycle]}
                          </div>
                          <div className={`text-sm ${selectedPlan === plan.id ? 'text-white opacity-80' : 'text-black opacity-80'}`}>
                            /{billingCycle === 'monthly' ? 'month' : 'year'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Account Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-black" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-black rounded-lg bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-black" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-12 py-3 border border-black rounded-lg bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Create a password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-black" />
                        ) : (
                          <Eye className="h-5 w-5 text-black" />
                        )}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                strength.score === 1 ? 'w-1/4 bg-red-500' :
                                strength.score === 2 ? 'w-1/2 bg-yellow-500' :
                                strength.score === 3 ? 'w-3/4 bg-blue-500' :
                                strength.score === 4 ? 'w-full bg-green-500' : 'w-0'
                              }`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${strength.color}`}>
                            {strength.text}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Confirm password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-black" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
                          confirmPassword.length > 0 && password !== confirmPassword
                            ? 'border-red-500'
                            : 'border-black'
                        }`}
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-black" />
                        ) : (
                          <Eye className="h-5 w-5 text-black" />
                        )}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        {password === confirmPassword ? (
                          <>
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-500">Passwords match</span>
                          </>
                        ) : (
                          <span className="text-xs text-red-500">Passwords do not match</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 text-black focus:ring-black border-black rounded"
                    />
                    <label className="text-sm text-black">
                      I agree to the{' '}
                      <Link href="/terms" className="font-medium text-black hover:underline">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="font-medium text-black hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handlePlanSelection}
                  disabled={!email || !password || !confirmPassword || !agreedToTerms || password !== confirmPassword}
                  className="w-full mt-6 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Continue to Payment
                </button>
              </>
            ) : (
              <>
                {/* Payment Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-black mb-2">Order Summary</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-black">{selectedPlanData.name} Plan</span>
                    <span className="font-semibold text-black">
                      ${selectedPlanData.price[billingCycle]}/{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Billing: {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">Secure Payment</div>
                    <div className="text-sm text-green-600">
                      Your payment is processed securely by Stripe
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Pay ${selectedPlanData.price[billingCycle]}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setStep('plan')}
                  className="w-full mt-3 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200"
                >
                  Back to Plan Selection
                </button>
              </>
            )}

            {error && (
              <Alert type="error" className="mt-4">{error}</Alert>
            )}
          </div>

          {/* Plan Features */}
          <div className="bg-white rounded-lg shadow-sm border border-black p-8 text-black">
            <h3 className="text-xl font-semibold text-black mb-4">
              {selectedPlanData.name} Plan Features
            </h3>
            <div className="space-y-3">
              {selectedPlanData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-black">{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Complete secure payment with Stripe</li>
                <li>• Get instant access to your dashboard</li>
                <li>• Start creating AI content immediately</li>
                <li>• Cancel anytime from your account settings</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="text-center text-black">
          <p className="text-sm text-black">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-black hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupWithPaymentPage() {
  return (
    <Suspense>
      <SignupWithPaymentPageInner />
    </Suspense>
  );
} 