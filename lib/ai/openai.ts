import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chatWithOpenAI(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // or "gpt-3.5-turbo"
    messages: [{ role: "user", content: prompt }]
  });
  return completion.choices[0]?.message?.content || "";
}

export async function generateImageWithOpenAI(prompt: string): Promise<string> {
  // Ensure prompt is within OpenAI's 1000 character limit
  let finalPrompt = prompt.trim();
  if (finalPrompt.length > 1000) {
    console.warn(`Prompt too long (${finalPrompt.length} chars), truncating to 1000 characters`);
    finalPrompt = finalPrompt.substring(0, 997) + "...";
  }
  
  console.log('Image generation prompt length:', finalPrompt.length);
  console.log('Image generation prompt:', finalPrompt);
  
  const image = await openai.images.generate({
    prompt: finalPrompt,
    n: 1,
    size: "1024x1024"
  });
  if (image.data && image.data[0]?.url) {
    return image.data[0].url;
  }
  return "";
} 