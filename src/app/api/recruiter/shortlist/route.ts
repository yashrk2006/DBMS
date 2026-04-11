import { NextResponse } from 'next/server';
import { recruiterShortlistAgent } from '@/lib/agents';

export async function POST(request: Request) {
  try {
    const { jobDescription, candidates } = await request.json();

    if (!jobDescription || !candidates || !Array.isArray(candidates)) {
      return NextResponse.json({ success: false, error: 'Job description and candidates list are required' }, { status: 400 });
    }

    const result = await recruiterShortlistAgent(jobDescription, candidates);

    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
