// AI utility functions

import { AIResponse } from '../types/ai';

export function formatAIResponse(text: string, reasoning?: string): AIResponse {
  return { text, reasoning };
} 