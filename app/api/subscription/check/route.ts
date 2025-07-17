import { NextRequest, NextResponse } from 'next/server';

interface SubscriptionCheckRequest {
  userId: string;
}

interface SubscriptionStatus {
  isPro: boolean;
  plan: string;
  expiresAt?: string;
  features: string[];
}

// Mock subscription data - replace with your actual database queries
const mockSubscriptions: Record<string, SubscriptionStatus> = {
  'demo-user-123': {
    isPro: true,
    plan: 'pro',
    expiresAt: '2024-12-31T23:59:59Z',
    features: ['veo3-video-generation', 'priority-support', 'advanced-settings']
  },
  'free-user-456': {
    isPro: false,
    plan: 'free',
    features: ['basic-image-generation']
  }
};

export async function POST(req: NextRequest) {
  try {
    const body: SubscriptionCheckRequest = await req.json();
    
    if (!body.userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Query your database for user subscription status
    // 2. Check with your payment processor (Stripe, etc.)
    // 3. Verify subscription expiration dates
    
    const subscription = mockSubscriptions[body.userId] || {
      isPro: false,
      plan: 'free',
      features: ['basic-image-generation']
    };

    return NextResponse.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check subscription status' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const subscription = mockSubscriptions[userId] || {
      isPro: false,
      plan: 'free',
      features: ['basic-image-generation']
    };

    return NextResponse.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check subscription status' 
    }, { status: 500 });
  }
} 