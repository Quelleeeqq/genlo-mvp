import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const res = await axios.get(`https://api.d-id.com/talks/${id}`, {
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY!}`,
        accept: 'application/json',
      },
    });
    return NextResponse.json(res.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch talk' }, { status: 500 });
  }
} 