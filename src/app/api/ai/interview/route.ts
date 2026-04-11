import { NextResponse } from 'next/server';
import { AI_ENGINE } from '@/lib/ai-engine';

export async function POST(req: Request) {
  try {
    const { skills = [], title = '', scope = 'STUDENT_PREP' } = await req.json();

    if (!title) {
       return NextResponse.json({ success: false, error: 'Missing title parameter.' }, { status: 400 });
    }

    const cohereKey = process.env.COHERE_API_KEY;
    let questions: string[] = [];

    // Attempt AI Generation if key exists
    if (cohereKey) {
      try {
        let prompt = '';
        if (scope === 'COMPANY_ASSESSMENT') {
          prompt = `You are a Lead Technical Architect and Recruiter evaluating a candidate for a "${title}" role. The candidate claims proficiency in: ${Array.isArray(skills) ? skills.join(', ') : skills}. 
          Generate exactly 5 extremely high-level, tactical screening questions designed to expose the depth of their actual production experience with these specific technologies. 
          Focus on edge cases, architectural trade-offs, and scaling challenges.`;
        } else {
          prompt = `You are an expert technical interviewer for a "${title}" position. The candidate has the following core skills: ${Array.isArray(skills) ? skills.join(', ') : skills}. 
          Generate exactly 5 highly specific, challenging technical behavioral or system-design interview questions tailored towards testing their understanding of those specific skills in the context of the requested job role.`;
        }
        
        prompt += `\n\nCRITICAL RULE: Return ONLY a raw JSON array of exactly 5 strings. Do NOT wrap it in a markdown code block. No preamble. 
Example exactly like this:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

        const response = await fetch('https://api.cohere.com/v1/chat', {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${cohereKey}`,
             'Content-Type': 'application/json',
             'accept': 'application/json'
           },
           body: JSON.stringify({
             message: prompt,
             model: 'command-r', 
             temperature: 0.6,
           }),
           signal: AbortSignal.timeout(8000) // 8s timeout
        });

        if (response.ok) {
           const data = await response.json();
           let rawText = data.text.trim();
           // Safely strip markdown if Cohere disobeys
           rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
           const parsed = JSON.parse(rawText);
           if (Array.isArray(parsed) && parsed.length >= 3) {
             questions = parsed;
           }
        }
      } catch (aiError) {
        console.warn("AI Interview generation failed or timed out. Falling back to deterministic engine.", aiError);
      }
    }

    // Deterministic Fallback (Hybrid Intelligence)
    if (questions.length === 0) {
      // Ensure skills is an array for the engine
      const studentSkills = Array.isArray(skills) ? skills : [];
      questions = AI_ENGINE.generateInterviewQuestions(studentSkills, title);
      
      // Ensure we have 5 questions for a premium feel
      const extraDefaults = [
        "Describe a complex technical challenge you solved and the specific steps you took.",
        "How do you ensure code quality and maintainability in a fast-paced development environment?",
        "Explain a situation where you had to learn a new technology quickly to meet a deadline.",
        "How do you approach collaboration and communication within a cross-functional team?",
        "What is your strategy for optimizing performance and scalability in your applications?"
      ];
      
      while (questions.length < 5) {
        questions.push(extraDefaults[questions.length % extraDefaults.length]);
      }
    }

    return NextResponse.json({ success: true, questions: questions.slice(0, 5) });

  } catch (error: any) {
    console.error("Interview API failure:", error);
    return NextResponse.json({ 
      success: true, 
      questions: [
        "How do you handle technical debt while meeting aggressive feature deadlines?",
        "Describe your process for architectural decision-making in a new project.",
        "How do you ensure your technical solutions align with business objectives?",
        "What's your approach to mentorship and knowledge sharing within a team?",
        "Describe a time you had to pivot your technical strategy midway through a project."
      ]
    });
  }
}
