import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          // Add any additional user metadata here
        }
      }
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with OAuth (Google, GitHub, etc.)
  signInWithOAuth: async (provider: 'google' | 'github' | 'discord') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { data, error };
  },

  // Update password
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });
    return { data, error };
  }
};

// Chat message helper functions
export const chatMessages = {
  // Save a new message to the database
  saveMessage: async (message: {
    user_id: string;
    chat_id?: string;
    role: 'user' | 'assistant';
    content: string;
    image_url?: string;
    image_base64?: string;
    enhanced_prompt?: string;
    structured_data?: any;
    image_metadata?: any;
    function_calls?: any;
    web_search_calls?: any;
    file_search_calls?: any;
    usage?: any;
  }) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select()
      .single();
    
    return { data, error };
  },

  // Fetch messages for a user (optionally filtered by chat_id)
  getMessages: async (user_id: string, chat_id?: string, limit: number = 100) => {
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user_id)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (chat_id) {
      query = query.eq('chat_id', chat_id);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Delete messages for a user (optionally filtered by chat_id)
  deleteMessages: async (user_id: string, chat_id?: string) => {
    let query = supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user_id);

    if (chat_id) {
      query = query.eq('chat_id', chat_id);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Get unique chat IDs for a user
  getChatIds: async (user_id: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('chat_id, timestamp')
      .eq('user_id', user_id)
      .not('chat_id', 'is', null)
      .order('timestamp', { ascending: false });

    // Group by chat_id and get the latest timestamp for each
    const chatGroups = data?.reduce((acc: any, msg: any) => {
      if (msg.chat_id) {
        if (!acc[msg.chat_id] || new Date(msg.timestamp) > new Date(acc[msg.chat_id].timestamp)) {
          acc[msg.chat_id] = msg;
        }
      }
      return acc;
    }, {});

    const chatIds = Object.keys(chatGroups || {}).map(chat_id => ({
      chat_id,
      last_message_at: chatGroups[chat_id].timestamp
    }));

    return { data: chatIds, error };
  }
}; 