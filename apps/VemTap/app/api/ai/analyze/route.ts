import { NextRequest, NextResponse } from 'next/server';

/**
 * VEMTAP AI INTELLIGENCE — Server-Side API Route
 * 
 * This runs on the SERVER where process.env.GEMINI_API_KEY is available.
 * The client calls POST /api/ai/analyze with the profiling data.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are the "Vemtap Strategic Sales Intelligence AI."
Your goal is to process the "Pre-Approach Business Profiling Form" and provide high-conversion sales insights.

VEMTAP CONTEXT:
Vemtap is a visitor engagement platform that uses NFC and QR codes (Window Stickers, Table Stands, Counter Signs) to help businesses capture customer data, automate loyalty, and increase repeat visits. Vemtap helps businesses digitize their customer engagement, reduce wait times, and build lasting customer relationships through smart NFC and QR-powered solutions.

INPUT DATA STRUCTURE (10 Sections from the Pre-Approach Form):
1. Basic Info — Business name, location, branches, type, niche, customer traffic level, target customers
2. Physical Setup — Glass door, outside foot traffic, waiting area, tables, counter ordering, queue system, service style, customer flow notes
3. QR Placement Plan — Window QR usage, type (sticker/banner), indoor placements, special use scenarios
4. Package Recommendation — Suggested package (Starter/Growth/Premium), reason for choice
5. Custom Pitch — A personalized sales pitch written by the agent
6. Identified Problems — Operational pain points noticed (long wait, no database, poor engagement, manual ordering, no marketing)
7. Approach Plan — Best time to approach, who to speak to (Owner/Manager/Supervisor), approach style (Friendly/Direct/Demo first/Talk first)
8. Demo Plan — What to demonstrate, device readiness, internet readiness
9. Offer Strategy — Active offers (free trial, discount, free QR setup), closing plan
10. Manual Scoring — Foot traffic rating (1-5), need rating (1-5), ability to pay (1-5), ease of adoption (1-5)

YOUR RESPONSE FORMAT (STRICT — follow this exactly):

### VEMTAP AI STRATEGIC ANALYSIS
(Write 2-3 paragraphs analyzing the business. Cover: why this business needs Vemtap based on their niche and traffic, how their physical layout supports QR deployment, and what behavioral patterns suggest about their readiness to convert. Be specific about the business name and type.)

### TOP 3 RECOMMENDATIONS
1. (First specific action item for the sales agent — reference actual data from the profile)
2. (Second specific action item — reference their physical setup or problems)
3. (Third specific action item — reference their scoring or package fit)

### VEMTAP POWER PITCH
(Write a high-stakes, 3-layered persuasive pitch:
- Layer 1: The Hook. A pattern-interrupting opening that references their specific traffic or niche.
- Layer 2: The Agitator. Deeply identify with a problem they have (from the problems list) and explain the cost of NOT solving it in terms of revenue and long-term customer loss.
- Layer 3: The Solution. Position Vemtap as the only logical move to capture revenue right now.

Make this pitch powerful, long-form, and persuasive. Aim for at least 150 words for the pitch alone.)

RULES:
- Be highly professional, data-driven, and strategic.
- Every recommendation must tie back to the actual profile data.
- Do NOT use markdown bold (**) markers.
- Provide deep, descriptive analysis (at least 400 words total for the whole response).`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { profilingData } = body;

        if (!profilingData) {
            return NextResponse.json({ error: 'No profiling data provided', source: 'error' }, { status: 400 });
        }

        // Check if API key exists (server-side, this WILL work)
        if (!GEMINI_API_KEY) {
            console.error('[Vemtap AI] GEMINI_API_KEY is not set in .env');
            return NextResponse.json({ error: 'AI service not configured', source: 'fallback' }, { status: 503 });
        }

        // Build the Gemini request
        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: SYSTEM_PROMPT },
                        { text: `\n\nAnalyze this Business Profile:\n${JSON.stringify(profilingData, null, 2)}` }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.9,
                maxOutputTokens: 2048,
            }
        };

        console.log('[Vemtap AI] Sending request to Gemini...', { 
            business: profilingData.businessName,
            endpoint: GEMINI_ENDPOINT.substring(0, 60) + '...' 
        });

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        console.log('[Vemtap AI] Gemini Response Status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Vemtap AI] Gemini API failure detail:', JSON.stringify(errorData, null, 2));
            return NextResponse.json(
                { error: `AI service returned ${response.status}`, details: errorData, source: 'fallback' },
                { status: 502 }
            );
        }

        const data = await response.json();
        const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!fullText) {
            console.error('[Vemtap AI] Received empty text from Gemini. Response data:', JSON.stringify(data));
            return NextResponse.json({ error: 'AI returned empty analysis', source: 'fallback' }, { status: 502 });
        }

        console.log('[Vemtap AI] Successfully generated insights. Length:', fullText.length);

        // Parse the structured response
        const result = parseAIResponse(fullText);

        return NextResponse.json({
            success: true,
            source: 'ai',
            ...result,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[Vemtap AI] Server error:', error);
        return NextResponse.json(
            { error: 'Internal AI processing error', source: 'fallback' },
            { status: 500 }
        );
    }
}

function parseAIResponse(text: string): {
    recommendations: string[];
    pitchSummary: string;
    aiAnalysis: string;
} {
    // Extract numbered recommendations (lines starting with 1., 2., 3.)
    const recMatches = text.match(/^\d+\.\s+.+$/gm) || [];
    let recommendations = recMatches.slice(0, 3).map(r => r.replace(/^\d+\.\s+/, '').trim());

    // If we didn't find 3, pad with defaults
    while (recommendations.length < 3) {
        recommendations.push('Follow up with a personalized demo based on their business needs.');
    }

    // Use a regex to find the Power Pitch section (more robust than split)
    let pitchSummary = '';
    const pitchHeaderRegex = /(?:###\s+)?VEMTAP\s+POWER\s+PITCH[:\*]?/i;
    const parts = text.split(pitchHeaderRegex);
    
    if (parts.length > 1) {
        // Take everything after the header
        pitchSummary = parts[1].trim();
        // If there's another header below it (which shouldn't happen but safe-guarding), cut it off
        pitchSummary = pitchSummary.split(/\n\d+\.|\n###/)[0].trim();
    } else {
        // Last-resort fallback for pitch summary
        pitchSummary = 'Leverage Vemtap to transform customer engagement and drive repeat business growth.';
    }

    return {
        recommendations,
        pitchSummary,
        aiAnalysis: text,
    };
}
