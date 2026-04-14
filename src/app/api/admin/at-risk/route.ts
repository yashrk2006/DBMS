import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface StudentAtRisk {
  student_id: string;
  name: string;
  email: string;
  college: string;
  application: { status: string; ai_match_score?: number }[];
}

export async function GET() {
  try {
    // 1. Fetch all students with their application summaries
    const { data: studentsRaw, error: studentError } = await supabase
      .from('student')
      .select(`
        student_id,
        name,
        email,
        college,
        application(status, ai_match_score)
      `);

    if (studentError) throw studentError;

    const students = (studentsRaw as unknown as StudentAtRisk[]) || [];

    // 2. Compute "At-Risk" logic with high-fidelity intensity scoring
    const atRisk = students.reduce((acc: any[], s) => {
      const apps = s.application || [];
      const noApps = apps.length === 0;
      const allRejected = apps.length > 0 && apps.every(a => a.status === 'Rejected');
      
      const totalScore = apps.reduce((sum, curr) => sum + (curr.ai_match_score || 0), 0);
      const avgScore = apps.length > 0 ? totalScore / apps.length : 0;
      
      let riskScore = 0;
      let reason = '';

      if (noApps) {
        riskScore = 85;
        reason = "Zero career engagement detected.";
      } else if (allRejected) {
        riskScore = 90;
        reason = "High friction in recruitment funnel (100% rejection).";
      } else if (avgScore < 40) {
        riskScore = 75;
        reason = "Critically low AI match parity.";
      }

      const intensity = riskScore > 80 ? 'HIGH' : riskScore > 50 ? 'MEDIUM' : 'LOW';

      if (riskScore > 0) {
        acc.push({
          student_id: s.student_id,
          name: s.name,
          college: s.college,
          email: s.email,
          reason,
          riskScore,
          intensity
        });
      }
      return acc;
    }, []);

    return NextResponse.json({ 
      success: true, 
      count: atRisk.length, 
      data: atRisk 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('At-Risk API Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
