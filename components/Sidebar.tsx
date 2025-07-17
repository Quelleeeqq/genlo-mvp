'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/contexts/AuthContext';

interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SidebarProps {
  onSelectChat: (chatId: string) => void;
  activeChatId: string | null;
  onChatCreated?: (chatId: string) => void;
  onChatUpdated?: () => void;
}

export default function Sidebar({ onSelectChat, activeChatId, onChatCreated, onChatUpdated }: SidebarProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch chats for the user
  useEffect(() => {
    if (!user) return;
    fetchChats();
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!error) {
        setChats((data as Chat[]) || []);
        // Auto-select most recent chat if none selected
        if ((data as Chat[]).length > 0 && !activeChatId) {
          onSelectChat((data as Chat[])[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh chats when onChatUpdated is called
  useEffect(() => {
    if (onChatUpdated) {
      fetchChats();
    }
  }, [onChatUpdated]);

  // Create a new chat
  const handleNewChat = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([{ user_id: user.id, title: 'New Chat' }])
        .select()
        .single();
      
      if (!error && data) {
        // Refresh the entire chat list to ensure we have the latest data
        await fetchChats();
        if (onSelectChat) onSelectChat(data.id);
        if (onChatCreated) onChatCreated(data.id);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-64 h-full bg-white border-r border-gray-200">
      {/* Logo/Header */}
      <div className="px-6 py-6 text-2xl font-bold tracking-tight text-black">GenLo</div>
      {/* New Chat Button */}
      <button
        className="mx-4 mb-4 px-4 py-3 rounded-lg bg-black text-white font-semibold text-base hover:bg-gray-900 transition"
        onClick={handleNewChat}
        disabled={loading}
      >
        + New Chat
      </button>
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2">
        {loading && <div className="text-gray-400 text-sm px-4 py-2">Loading...</div>}
        {!loading && chats.length === 0 && (
          <div className="text-gray-400 text-sm px-4 py-2">No chats yet</div>
        )}
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat && onSelectChat(chat.id)}
            className={`w-full text-left px-4 py-2 mb-2 rounded text-sm truncate text-gray-900 ${activeChatId === chat.id ? 'bg-gray-300 font-semibold' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {chat.title || 'Untitled Chat'}
          </button>
        ))}
      </div>
    </div>
  );
} 