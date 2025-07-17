import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';

export interface VertexAIConfig {
  projectId: string;
  region: string;
  location?: string;
}

export function getVertexAIClient(config: VertexAIConfig) {
  return new AnthropicVertex({
    projectId: config.projectId,
    region: config.region,
  });
}

export async function generateTextWithVertexAI(
  config: VertexAIConfig,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
) {
  const client = getVertexAIClient(config);
  
  const {
    model = 'claude-3-5-sonnet@20241022',
    maxTokens = 4000,
    temperature = 0.7
  } = options;

  try {
    // Filter out system messages and convert to the format expected by Vertex AI
    const filteredMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Add system message as the first user message if it exists
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      filteredMessages.unshift({
        role: 'user',
        content: `System: ${systemMessage.content}\n\nUser: ${filteredMessages[0]?.content || ''}`,
      });
      if (filteredMessages.length > 1) {
        filteredMessages.splice(1, 1); // Remove the original first message
      }
    }

    const result = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: filteredMessages,
    });

    // Handle the response content properly
    const content = result.content[0];
    const text = content && 'text' in content ? content.text : '';

    return {
      text,
      usage: {
        promptTokens: result.usage?.input_tokens || 0,
        completionTokens: result.usage?.output_tokens || 0,
        totalTokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)
      }
    };
  } catch (error) {
    console.error('Vertex AI Error:', error);
    throw error;
  }
} 