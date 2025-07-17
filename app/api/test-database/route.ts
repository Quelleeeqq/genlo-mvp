import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const results: any = {};

    // Test 1: Check if chats table exists and is accessible
    try {
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('count')
        .limit(1);
      
      results.chats = {
        accessible: !chatsError,
        error: chatsError?.message || null,
        count: chats?.length || 0
      };
    } catch (error) {
      results.chats = {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test 2: Check if chat_messages table exists and is accessible
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('count')
        .limit(1);
      
      results.chat_messages = {
        accessible: !messagesError,
        error: messagesError?.message || null,
        count: messages?.length || 0
      };
    } catch (error) {
      results.chat_messages = {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test 3: Check if users table exists and is accessible
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      results.users = {
        accessible: !usersError,
        error: usersError?.message || null,
        count: users?.length || 0
      };
    } catch (error) {
      results.users = {
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }

    // Test 4: Try to create a test chat
    try {
      const { data: testChat, error: createError } = await supabase
        .from('chats')
        .insert([{ 
          user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
          title: 'Test Chat' 
        }])
        .select()
        .single();
      
      results.create_test_chat = {
        success: !createError,
        error: createError?.message || null,
        data: testChat
      };

      // Clean up test chat if created
      if (testChat) {
        await supabase
          .from('chats')
          .delete()
          .eq('id', testChat.id);
      }
    } catch (error) {
      results.create_test_chat = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Database tables test completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 