import { togetherai, createTogetherAI } from '@ai-sdk/togetherai';

export { togetherai };

export function getCustomTogetherAI(apiKey?: string) {
  return createTogetherAI({
    apiKey: apiKey || process.env.TOGETHER_AI_API_KEY || '',
  });
} 