import { NextResponse } from 'next/server';

export async function GET() {
  // Return the output format specification
  const outputFormat = {
    type: "array",
    items: {
      type: "string",
      format: "uri"
    },
    title: "Output"
  };

  return NextResponse.json(outputFormat);
} 