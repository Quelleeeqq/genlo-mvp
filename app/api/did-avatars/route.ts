import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch('https://api.d-id.com/scenes/avatars?limit=100', {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.DID_API_KEY}` // Use a server-side env var
    },
  });
  const data = await res.json();
  return NextResponse.json(data);
} 