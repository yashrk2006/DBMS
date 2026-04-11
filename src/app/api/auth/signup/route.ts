import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getFriendlyErrorMessage } from '@/lib/error-adapter';

export async function POST(request: Request) {
  return NextResponse.json({ 
    success: false, 
    error: 'Institutional Registration Lockdown: User-side registration is disabled. Please contact the Placement Cell for identity provisioning.' 
  }, { status: 403 });
}
