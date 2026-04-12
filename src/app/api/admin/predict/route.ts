import { NextResponse } from 'next/server';
import { adminSuccessPredictorAgent } from '@/lib/agents';

export async function POST(request: Request) {
  try {
    const { stats } = await request.json();

    if (!stats) {
      return NextResponse.json({ success: false, error: 'College statistics are required.' }, { status: 400 });
    }

    const result = await adminSuccessPredictorAgent(stats);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
