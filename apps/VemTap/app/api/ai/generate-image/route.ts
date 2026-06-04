import { NextRequest, NextResponse } from 'next/server';

/**
 * VEMTAP AI IMAGE GENERATION — Server-Side API Route
 * 
 * This calls the Gemini Nano Banana (Image Generation) API.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// Note: Adjust the model name based on actual Nano Banana availability/endpoint
const GEMINI_MODEL = 'gemini-1.5-flash'; 
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt, businessInfo, options } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
        }

        // Construct a comprehensive system prompt for image generation
        const systemPrompt = `You are a professional graphic designer for Vemtap.
        Your task is to generate a marketing asset design based on the following business information and user prompt.
        
        BUSINESS INFO:
        - Name: ${businessInfo?.name || 'Vemtap Business'}
        - Logo: ${businessInfo?.logoUrl || 'Default Logo'}
        - Primary Color: ${businessInfo?.primaryColor || '#493EE5'}
        - Accent Color: ${businessInfo?.accentColor || '#FFFFFF'}
        
        DESIGN OPTIONS:
        - Goal: ${options?.goal || 'General Engagement'}
        - Format: ${options?.format || 'Table Stand'}
        
        USER PROMPT: "${prompt}"
        
        CRITICAL DESIGN REQUIREMENT:
        You MUST include a clean, solid white square area in the design where a QR code will be placed. 
        - The white square should be high-contrast and stand out from the background.
        - Position it where it makes the most sense for a professional marketing layout (e.g., bottom-center or a designated side panel).
        - Ensure the design flows around this placeholder.
        
        The design MUST:
        1. Use the business's brand colors primarily.
        2. Be high-quality, modern, and professional.
        3. Focus on the goal: ${options?.goal}.
        
        Return the generated image data.`;

        // This is a placeholder for actual image generation call
        // Depending on how Nano Banana is integrated (Imagen 3 via Vertex AI or Gemini 2.0+ Image Gen),
        // the payload structure might differ.
        
        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        };

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'AI service failed' }, { status: 502 });
        }

        const data = await response.json();
        
        // Mocking a successful image generation response for now
        // In a real scenario, this would return a URL or base64 of the generated image
        return NextResponse.json({
            success: true,
            imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2074&auto=format&fit=crop', // Placeholder
            promptUsed: prompt
        });

    } catch (error) {
        console.error('[Vemtap AI Image] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
