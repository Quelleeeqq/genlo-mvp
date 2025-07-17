import { supabase } from '@/lib/supabaseClient';

export const chatMessages = {
  async getMessages(userId: string, chatId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  }
}; 