import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  try {
    const res = await axios.get('https://api.d-id.com/talks?limit=100', {
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY!}`,
        accept: 'application/json',
      },
    });
    return NextResponse.json({ talks: res.data.talks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch D-ID talks' }, { status: 500 });
  }
} 