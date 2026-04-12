import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { 
      answer, 
      history = [], 
      targetRole = 'Software Engineer', 
      skills = [],
      metadata = {} 
    } = await req.json();

    if (!answer && history.length === 0) {
      return NextResponse.json({ success: false, error: 'No input provided.' }, { status: 400 });
    }

    const systemPrompt = `
      You are an elite Technical Recruiter and Lead Engineer conducting a high-stakes mock interview for a "${targetRole}" position.
      
      CANDIDATE PROFILE:
      - Skills: ${skills.join(', ')}
      
      CORE BEHAVIOR:
      1. REACT LIKE A HUMAN: Do not just ask questions. Acknowledge what the candidate said. 
         - If they give a great answer, give a brief technical compliment.
         - If they don't know (e.g., "I don't know", "not sure"), react as a supportive but firm interviewer. Help them bridge to a related area or pivot to a new topic gracefully. 
         - If they say something unprofessional or "bad", react with professional disappointment and remind them to take the interview seriously.
      
      2. PUSH FOR DEPTH: If an answer is too surface-level, ask a "Why" or "How" follow-up.
      
      3. STAY IN CHARACTER: Use a professional, slightly formal, but encouraging tone.
      
      4. RESPONSE FORMAT:
         - Keep your response concise (2-4 sentences).
         - React first, then ask the next question or follow-up.
         - Do not use markdown like bolding or bullet points. Just plain text.
         - Output exactly 1 response.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: answer || "I am ready to start the interview." }
      ],
      model: 'llama3-70b-8192',
      temperature: 0.7,
      max_tokens: 250,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "I see. Let's move on to the next topic.";

    return NextResponse.json({ 
      success: true, 
      response: responseText,
      // We can also return some metadata for the "Analysis Engine" here later if we want the LLM to score it
    });

  } catch (error: any) {
    console.error("Chat Interview API failure:", error);
    return NextResponse.json({ 
      success: false, 
      error: 'The AI interviewer is temporarily unavailable.' 
    }, { status: 500 });
  }
}
