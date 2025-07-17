import { NextRequest, NextResponse } from "next/server";
import { enhanceWithClaude } from "@/lib/ai/claude";
import { chatWithOpenAI } from "@/lib/ai/openai";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }
    // Step 1: Enhance with Claude
    const enhanced = await enhanceWithClaude(message);
    // Step 2: Get response from OpenAI
    const response = await chatWithOpenAI(enhanced);
    return NextResponse.json({ response, enhancedPrompt: enhanced });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
} 