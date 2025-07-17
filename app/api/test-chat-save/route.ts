import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { userId, chatId } = await request.json();

    if (!userId || !chatId) {
      return NextResponse.json(
        { error: 'Missing userId or chatId' },
        { status: 400 }
      );
    }

    console.log('Testing chat save with:', { userId, chatId });

    // Test 1: Check if chat exists
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', userId)
      .single();

    if (chatError || !chat) {
      console.log('Chat not found, creating new one...');
      
      // Create a new chat
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert([{ user_id: userId, title: 'Test Chat' }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating chat:', createError);
        return NextResponse.json(
          { error: 'Failed to create chat', details: createError },
          { status: 500 }
        );
      }

      console.log('New chat created:', newChat);
    } else {
      console.log('Existing chat found:', chat);
    }

    // Test 2: Try to save a test message
    const testMessage = {
      chat_id: chatId,
      user_id: userId,
      role: 'user',
      content: 'Test message from API - ' + new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    console.log('Saving test message:', testMessage);

    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert([testMessage])
      .select()
      .single();

    if (messageError) {
      console.error('Error saving message:', messageError);
      return NextResponse.json(
        { error: 'Failed to save message', details: messageError },
        { status: 500 }
      );
    }

    console.log('Message saved successfully:', message);

    // Test 3: Retrieve the message
    const { data: retrievedMessage, error: retrieveError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', message.id)
      .single();

    if (retrieveError || !retrievedMessage) {
      console.error('Error retrieving message:', retrieveError);
      return NextResponse.json(
        { error: 'Failed to retrieve message', details: retrieveError },
        { status: 500 }
      );
    }

    console.log('Message retrieved successfully:', retrievedMessage);

    // Test 4: Clean up test message
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', message.id);

    if (deleteError) {
      console.error('Error deleting test message:', deleteError);
    } else {
      console.log('Test message cleaned up successfully');
    }

    return NextResponse.json({
      success: true,
      message: 'Chat save functionality is working correctly',
      tests: {
        chatExists: true,
        messageSaved: true,
        messageRetrieved: true,
        cleanupSuccessful: !deleteError
      },
      data: {
        chat: chat || 'new chat created',
        testMessage: retrievedMessage
      }
    });

  } catch (error) {
    console.error('Test chat save error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test database connection and RLS status
    console.log('Testing database connection...');
    
    const { data, error } = await supabase
      .from('chats')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection failed:', error);
      return NextResponse.json(
        { error: 'Database connection failed', details: error },
        { status: 500 }
      );
    }

    // Test RLS status
    const { data: rlsTest, error: rlsError } = await supabase
      .from('chats')
      .select('*')
      .limit(1);

    console.log('RLS test result:', { rlsTest, rlsError });

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      rlsStatus: rlsError ? 'RLS blocking access' : 'RLS allowing access',
      rlsError: rlsError?.message || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database connection test error:', error);
    return NextResponse.json(
      { error: 'Database connection failed', details: error },
      { status: 500 }
    );
  }
} 