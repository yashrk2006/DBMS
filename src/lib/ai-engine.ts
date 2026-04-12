import { Student, Internship } from '@/types';

/**
 * AI Intelligence Engine for SkillSync
 * Implements: 
 * 1. Skill Evolution Predictor
 * 2. AI Interview Engine
 * 3. Proactive Talent Discovery (Match Score)
 * 4. Market Equilibrium Analytics
 * 5. Success Probability & Match Diagnosis
 * 6. AI Skill Assessment & Health Audit
 * 7. 2025 Modern Frontend Roadmap
 */

export const AI_ENGINE = {
  /**
   * 1. Skill Evolution Predictor
   */
  calculateMarketReach: (studentSkills: string[], allInternships: Internship[]) => {
    if (!allInternships.length) return 0;
    const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
    const matchedInternships = allInternships.filter(intern => 
      intern.requirements.role_skills.some((rs: string) => 
        studentSkillsLower.includes(rs.toLowerCase())
      )
    );
    return Math.round((matchedInternships.length / allInternships.length) * 100);
  },

  getHighImpactSkill: (studentSkills: string[], allInternships: Internship[]) => {
    const demandMap: Record<string, number> = {};
    allInternships.forEach(intern => {
      intern.requirements.role_skills.forEach((rs: string) => {
        demandMap[rs] = (demandMap[rs] || 0) + 1;
      });
    });
    const sortedDemand = Object.entries(demandMap).sort((a, b) => b[1] - a[1]);
    const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
    const missingHighImpact = sortedDemand.find(([skill]) => 
      !studentSkillsLower.includes(skill.toLowerCase())
    );
    return missingHighImpact ? {
      name: missingHighImpact[0],
      boost: Math.round((missingHighImpact[1] / allInternships.length) * 50) + 20
    } : null;
  },

  /**
   * 2. AI Interview Engine
   */
  generateInterviewQuestions: (studentSkills: string[], jobTitle: string) => {
    const baseQuestions = [
      `How do you apply your proficiency in ${studentSkills[0] || 'your core stack'} to solve complex ${jobTitle} challenges?`,
      `Can you describe a project where you integrated ${studentSkills[1] || 'modern tools'} into a production workflow?`,
      `Explain a technical trade-off you made while building a ${jobTitle.split(' ')[0]} focused system.`,
      `What is the most challenging bug you encountered in ${studentSkills[0] || 'your development'} and how did you debug it?`
    ];
    return baseQuestions.slice(0, 3 + Math.floor(Math.random() * 2));
  },

  /**
   * 3. Proactive Talent Discovery
   */
  calculateMatchScore: (studentSkills: string[], requiredSkills: string[]) => {
    if (!requiredSkills.length) return 100;
    const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
    const matches = requiredSkills.filter(req => 
      studentSkillsLower.includes(req.toLowerCase())
    );
    return Math.round((matches.length / requiredSkills.length) * 100);
  },

  /**
   * 4. Market Equilibrium Analytics
   */
  getMarketEquilibrium: (students: Student[], internships: Internship[]) => {
    const allStudentSkills = students.flatMap(s => (s.skills || []).map(sk => sk.skill_name.toLowerCase()));
    const allRoleSkills = internships.flatMap(i => (i.requirements?.role_skills || []).map(rs => rs.toLowerCase()));
    
    const supply: Record<string, number> = {};
    allStudentSkills.forEach(s => supply[s] = (supply[s] || 0) + 1);
    
    const demand: Record<string, number> = {};
    allRoleSkills.forEach(rs => demand[rs] = (demand[rs] || 0) + 1);

    const allSkills = Array.from(new Set([...Object.keys(supply), ...Object.keys(demand)]));
    return allSkills.map(skill => ({
      name: skill,
      supply: supply[skill] || 0,
      demand: demand[skill] || 0,
      gap: (demand[skill] || 0) - (supply[skill] || 0)
    })).sort((a, b) => b.demand - a.demand).slice(0, 10);
  },

  /**
   * 5. AI Success Probability
   */
  calculateSuccessProbability: (matchScore: number, appCount: number = 0) => {
    const densityFactor = Math.max(0.7, 1 - (appCount / 50)); 
    const probability = (matchScore * 0.8) + (20 * densityFactor);
    return Math.min(100, Math.max(5, Math.round(probability)));
  },

  /**
   * 6. AI Match Diagnosis
   */
  getMatchDiagnosis: (studentSkills: string[], requiredSkills: string[]) => {
    const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
    return {
      matched: requiredSkills.filter(rs => studentSkillsLower.includes(rs.toLowerCase())),
      missing: requiredSkills.filter(rs => !studentSkillsLower.includes(rs.toLowerCase())),
      scarcity: requiredSkills.map(rs => ({
        name: rs,
        is_rare: ['kubernetes', 'rust', 'tensorflow', 'solidity', 'webgpu', 'react 19'].includes(rs.toLowerCase())
      }))
    };
  },

  /**
   * 7. AI Skill Assessment Generator (Strategic Dialogue Patterns)
   */
  generateSkillAssessment: (candidateSkills: string[], roleSkills: string[]) => {
    const context = roleSkills[0] || 'advanced technical architecture';
    const stack = candidateSkills.slice(0, 2).join(' and ') || 'your core stack';

    return [
      `Given your expertise in ${stack}, how would you architect a high-availability solution for ${context} in a distributed environment?`,
      `Explain your methodology for optimizing latency and ensuring data consistency when integrating ${roleSkills[1] || 'modern databases'} into a ${roleSkills[2] || 'cloud-native'} pipeline.`,
      `Describe a high-stakes scenario where you lead a technical resolution involving complex trade-offs between ${candidateSkills[0] || 'performance'} and long-term maintainability.`
    ];
  },

  /**
   * 8. Corporate Intelligence Diagnostic
   */
  generatePerformanceNotes: (score: number) => {
    if (score > 90) return "Exceptional mastery of technical principles. The candidate demonstrates superior architectural maturity and strategic foresight in technical decision-making.";
    if (score > 80) return "Strong technical foundations with high-fidelity articulation. Demonstrates readiness for complex industrial integration and collaborative leadership.";
    return "Competent technical proficiency. Focus on scaling architectural depth and articulating complex trade-offs with higher precision.";
  },

  /**
   * 9. Strategic Follow-up Patterns
   */
  generateFollowUp: (answer: string) => {
    const catalysts = [
      "I see. How does that approach impact long-term maintainability in a high-velocity team?",
      "Interesting perspective. If you had to scale that solution 10x horizontally, what would be the primary bottleneck?",
      "Valid strategy. From a security standpoint, what are the implicit trade-offs you are making there?",
      "Understood. Moving forward to the next inquiry..."
    ];
    return catalysts[Math.floor(Math.random() * catalysts.length)];
  },

  /**
   * 10. Strategic Communication Drafting
   */
  generateResponseDraft: (name: string, score: number, role: string) => {
    if (score >= 90) {
      return `Dear ${name},\n\nOur Strategic Assessment Engine has completed the diagnostic review of your recent interview for the ${role} position. Your Precision Index of ${score}% demonstrates exceptional technical maturity and architectural depth.\n\nWe are fast-tracking your application for a final sync with our lead engineering team. Please keep your dashboard active for the next phase of industrial deployment.`;
    }
    if (score >= 80) {
      return `Dear ${name},\n\nThank you for engaging with our Strategic Assessment Hub. Our AI diagnostic indicates a strong technical foundation with a ${score}% mission alignment score.\n\nYour profile has been advanced to 'Industrial Review' status. We will reach out shortly for the next steps in our strategic integration process.`;
    }
    return `Dear ${name},\n\nThank you for participating in our Strategic Assessment for the ${role} position. Our diagnostic engine has captured your performance metrics and archived them for review.\n\nWhile your technical proficiency is evident, we are currently prioritizing profiles with higher alignment in specific architectural domains. We wish you success in your professional journey.`;
  },

  /**
   * 11. Corporate Intelligence Audit
   */
  analyzeCompanyHealth: (applications: any[]) => {
    if (!applications.length) return { responsiveness: 0, accuracy: 0 };
    const decided = applications.filter(a => ['Accepted', 'Rejected', 'Interviewing'].includes(a.status)).length;
    const responsiveness = Math.round((decided / applications.length) * 100);
    const progressed = applications.filter(a => ['Accepted', 'Interviewing'].includes(a.status));
    const avgMatch = progressed.length > 0 
      ? progressed.reduce((acc, curr) => acc + (curr.match_score || 0), 0) / progressed.length
      : 0;
    return { responsiveness, accuracy: Math.round(avgMatch) };
  },

  /**
   * 9. Modern Frontend Content (2025 Roadmap)
   */
  getModernFrontendStack: () => [
    { name: 'Next.js 15', category: 'Framework Architecture', impact: 95 },
    { name: 'React 19 (Compiler)', category: 'Core Logic', impact: 90 },
    { name: 'Tailwind CSS v4', category: 'Styling', impact: 85 },
    { name: 'Motion (Framer)', category: 'Interactions', impact: 80 },
    { name: 'Three.js / R3F', category: '3D/Visuals', impact: 88 },
    { name: 'WebGPU', category: 'High Performance', impact: 82 },
    { name: 'Zustand / Query', category: 'State Sync', impact: 85 },
    { name: 'Server Actions', category: 'BFF Logic', impact: 92 }
  ]
};
