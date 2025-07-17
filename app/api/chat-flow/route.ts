import { NextRequest, NextResponse } from "next/server";
import { ChatFlowController, type AIConfig } from "@/lib/ai/chat-flow-controller";

// Initialize the chat flow controller
const config: AIConfig = {
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-5-sonnet-20241022'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
    imageModel: 'dall-e-3'
  }
};

// Create a singleton instance (in production, you'd want to manage this better)
let chatFlowController: ChatFlowController | null = null;

function getChatFlowController(): ChatFlowController {
  if (!chatFlowController) {
    chatFlowController = new ChatFlowController(config);
  }
  return chatFlowController;
}

export async function POST(req: NextRequest) {
  try {
    const { message, clearHistory = false, referenceImageUrl } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const controller = getChatFlowController();
    
    // Clear history if requested
    if (clearHistory) {
      controller.clearHistory();
    }

    // Process the message with optional reference image
    const result = await controller.processMessage(message, referenceImageUrl);

    return NextResponse.json({
      type: result.type,
      content: result.content,
      imageUrl: result.imageUrl,
      history: controller.getHistory(),
      referenceImages: controller.getReferenceImages()
    });

  } catch (error) {
    console.error("Chat flow error:", error);
    return NextResponse.json({ 
      error: "Internal server error.",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Optional: Add a GET endpoint to retrieve conversation history
export async function GET(req: NextRequest) {
  try {
    const controller = getChatFlowController();
    return NextResponse.json({
      history: controller.getHistory(),
      referenceImages: controller.getReferenceImages()
    });
  } catch (error) {
    console.error("Error retrieving history:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// Optional: Add a DELETE endpoint to clear conversation history
export async function DELETE(req: NextRequest) {
  try {
    const controller = getChatFlowController();
    controller.clearHistory();
    return NextResponse.json({ message: "History cleared successfully." });
  } catch (error) {
    console.error("Error clearing history:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
} 