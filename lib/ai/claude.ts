import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function enhanceWithClaude(prompt: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Use a current Claude 3 model
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `Rewrite this prompt to be more creative, detailed, and visually descriptive for an AI model: "${prompt}"`
        }
      ]
    });
    
    // Handle the content properly based on its type
    const content = msg.content[0];
    if (content && 'text' in content) {
      return content.text;
    }
    
    return prompt;
  } catch (error) {
    console.error("Claude API error:", error);
    // Fallback to original prompt if Claude fails
    return prompt;
  }
} 