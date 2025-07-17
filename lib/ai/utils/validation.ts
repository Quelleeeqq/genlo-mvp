// Input validation utilities

export function isValidPrompt(prompt: string): boolean {
  return typeof prompt === 'string' && prompt.trim().length > 0;
} 