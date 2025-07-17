'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Star, Zap, Crown } from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
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
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
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
      buttonText: 'Upgrade to Pro',
      buttonVariant: 'primary' as const,
      popular: true
    },
    {
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
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const,
      popular: false
    }
  ];

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Navigation Bar */}
      <nav className="w-full flex items-center justify-between px-8 py-6 absolute top-0 left-0 z-20">
        <div />
        <div className="flex items-center gap-8 text-black text-base font-medium">
          <Link href="/" className="hover:underline transition-colors">Home</Link>
          <Link href="/auth/login" className="hover:underline transition-colors">Login</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-black mb-3">
            Choose Your Plan
          </h2>
          <p className="text-base md:text-lg text-black max-w-2xl mx-auto">
            Unlock the full potential of AI-powered video generation with our flexible pricing plans.
          </p>
        </div>

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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-sm border-2 p-6 ${
                plan.popular 
                  ? 'border-black shadow-lg' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-black text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price[billingCycle]}
                  </span>
                  {plan.price[billingCycle] > 0 && (
                    <span className="text-gray-600 ml-2">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  )}
                </div>

                <Link
                  href={plan.name === 'Enterprise' ? '/dashboard' : '/auth/signup-with-payment'}
                  onClick={() => {
                    if (plan.name !== 'Enterprise') {
                      sessionStorage.setItem('quelle_from_pricing', 'true');
                      sessionStorage.setItem('quelle_selected_plan', plan.name.toLowerCase());
                    }
                  }}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors inline-block text-center ${
                    plan.buttonVariant === 'primary'
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-4">What's included:</h4>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-black text-center mb-6">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-black mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-700">Yes, you can cancel your subscription at any time. No long-term contracts required.</p>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-700">We accept all major credit cards, PayPal, and Apple Pay for your convenience.</p>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-2">Is there a free trial?</h4>
              <p className="text-gray-700">No we do not. Our premium AI video generation requires immediate investment for optimal results.</p>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-2">Do you offer refunds?</h4>
              <p className="text-gray-700">We offer a 30-day money-back guarantee if you're not satisfied with our service.</p>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
} 