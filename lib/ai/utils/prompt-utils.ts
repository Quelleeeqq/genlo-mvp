// Prompt management utilities

export function buildPrompt(messages: { role: string; content: string }[]): string {
  return messages.map(m => `${m.role}: ${m.content}`).join('\n');
} 