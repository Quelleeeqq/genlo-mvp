'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ChatDebugProps {
  activeChatId: string | null;
  messagesCount: number;
}

export default function ChatDebug({ activeChatId, messagesCount }: ChatDebugProps) {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  const fetchDebugInfo = async () => {
    if (!user?.id) return;

    try {
      // Get all chats for the user
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      // Get messages for active chat
      let messages = null;
      let messagesError = null;
      if (activeChatId) {
        const { data: chatMessages, error: error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_id', activeChatId)
          .order('created_at', { ascending: true });
        
        messagesError = error;
        if (!error) {
          messages = chatMessages;
        }
      }

      setDebugInfo({
        userId: user.id,
        totalChats: chats?.length || 0,
        activeChatId,
        activeChatMessages: messages?.length || 0,
        chats: chats || [],
        messages: messages || [],
        errors: {
          chats: chatsError,
          messages: messagesError
        }
      });
    } catch (error) {
      console.error('Error fetching debug info:', error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchDebugInfo();
    }
  }, [isVisible, activeChatId, user?.id]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded text-sm z-50"
      >
        Debug Chat
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 max-w-md max-h-96 overflow-auto z-50 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Chat Debug Info</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="text-xs space-y-2">
        <div>
          <strong>User ID:</strong> {debugInfo?.userId || 'Loading...'}
        </div>
        <div>
          <strong>Total Chats:</strong> {debugInfo?.totalChats || 0}
        </div>
        <div>
          <strong>Active Chat ID:</strong> {debugInfo?.activeChatId || 'None'}
        </div>
        <div>
          <strong>Active Chat Messages:</strong> {debugInfo?.activeChatMessages || 0}
        </div>
        <div>
          <strong>UI Messages Count:</strong> {messagesCount}
        </div>
        
        {debugInfo?.chats && debugInfo.chats.length > 0 && (
          <div>
            <strong>Recent Chats:</strong>
            <ul className="ml-2 mt-1">
              {debugInfo.chats.slice(0, 3).map((chat: any) => (
                <li key={chat.id} className="text-xs">
                  {chat.title} ({new Date(chat.updated_at).toLocaleTimeString()})
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {debugInfo?.messages && debugInfo.messages.length > 0 && (
          <div>
            <strong>Recent Messages:</strong>
            <ul className="ml-2 mt-1">
              {debugInfo.messages.slice(-3).map((msg: any) => (
                <li key={msg.id} className="text-xs">
                  {msg.role}: {msg.content.substring(0, 30)}...
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {(debugInfo?.errors?.chats || debugInfo?.errors?.messages) && (
          <div className="text-red-600">
            <strong>Errors:</strong>
            {debugInfo.errors.chats && <div>Chats: {debugInfo.errors.chats.message}</div>}
            {debugInfo.errors.messages && <div>Messages: {debugInfo.errors.messages.message}</div>}
          </div>
        )}
      </div>
      
      <button
        onClick={fetchDebugInfo}
        className="mt-3 w-full bg-blue-500 text-white px-2 py-1 rounded text-xs"
      >
        Refresh Debug Info
      </button>
    </div>
  );
} 