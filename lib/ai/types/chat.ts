// Chat-related type definitions

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
}; 