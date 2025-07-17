'use client';

import { useState } from 'react';

export default function TestDirectCheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDirectCheckout = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/stripe/direct-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'pro',
          billingCycle: 'monthly',
          email: 'test@example.com',
          userId: 'test-user-id'
        }),
      });

      const data = await response.json();
      
      if (data.checkoutUrl) {
        console.log('Redirecting to:', data.checkoutUrl);
        // Redirect directly to Stripe's hosted checkout
        window.location.href = data.checkoutUrl;
      } else {
        setError('Failed to create checkout session: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError('Network error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Direct Checkout Test</h1>
        <p className="mb-4 text-gray-600">
          This test uses Stripe's hosted checkout to bypass CSP issues.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <button
          onClick={handleDirectCheckout}
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating Checkout...' : 'Start Direct Checkout'}
        </button>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>This will redirect you to Stripe's hosted checkout page.</p>
        </div>
      </div>
    </div>
  );
} 