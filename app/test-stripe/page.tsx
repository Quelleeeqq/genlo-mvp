'use client';

import { useState } from 'react';

export default function TestStripePage() {
  const [loading, setLoading] = useState(false);

  const handleTestPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
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
      
      if (data.sessionId) {
        // Redirect to Stripe checkout
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      } else {
        console.error('Failed to create checkout session:', data);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Stripe Test Page</h1>
        <p className="mb-4">This is a minimal test page to isolate CSP issues.</p>
        <button
          onClick={handleTestPayment}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Test Payment'}
        </button>
      </div>
    </div>
  );
} 