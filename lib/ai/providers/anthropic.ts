import { anthropic, createAnthropic } from '@ai-sdk/anthropic';

// Default Anthropic provider instance (uses ANTHROPIC_API_KEY from env)
export { anthropic };

// Custom Anthropic provider instance (optional)
export function getCustomAnthropic(apiKey?: string) {
  return createAnthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
  });
} 