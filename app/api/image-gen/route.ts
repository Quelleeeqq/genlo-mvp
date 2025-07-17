import { NextRequest, NextResponse } from "next/server";
import { imageGenerationService } from "@/lib/ai/services/image-service";

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    
    if (!requestData.prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }
    
    // Use the new image generation service
    const response = await imageGenerationService.generateImage(requestData);
    
    console.log('Image generation API returning response:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Image generation error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || "Internal server error." 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: "An unexpected error occurred during image generation." 
    }, { status: 500 });
  }
} 