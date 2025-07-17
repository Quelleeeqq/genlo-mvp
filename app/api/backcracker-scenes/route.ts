import { NextResponse } from 'next/server';

export async function GET() {
  const scenes = {
    scene1: {
      title: "Office Worker Relief",
      description: "A person sitting hunched over at a desk, looking uncomfortable and stressed. They reach for the backcracker device, use it, and immediately sit up straight with a look of relief and satisfaction. Text overlay: 'Instant Back Relief'",
      visual_elements: [
        "Person in office attire",
        "Hunched posture before",
        "Backcracker device",
        "Straight posture after",
        "Relieved expression"
      ],
      duration: "3-4 seconds"
    },
    scene2: {
      title: "Active Lifestyle Recovery",
      description: "Someone doing physical activity (gardening, lifting, or exercise) who starts to show signs of back pain. They pause, use the backcracker, and immediately return to their activity with renewed energy and a smile. Text overlay: 'Get Back to What You Love'",
      visual_elements: [
        "Person in casual/athletic wear",
        "Physical activity (gardening/exercise)",
        "Signs of discomfort",
        "Backcracker device",
        "Return to activity with energy"
      ],
      duration: "4-5 seconds"
    }
  };

  return NextResponse.json({
    product: "Backcracker - Instant Back Pain Relief Device",
    scenes: scenes,
    tips: [
      "Keep scenes under 5 seconds each for TikTok",
      "Use bright, engaging colors",
      "Include before/after contrast",
      "Add trending music or sound effects",
      "Use captions to highlight benefits"
    ]
  });
} 