/**
 * VEMTAP AI INTELLIGENCE — Client-Side Service
 * 
 * This calls the server-side API route at /api/ai/analyze
 * which has access to GEMINI_API_KEY via process.env.
 * 
 * The client CANNOT read process.env.GEMINI_API_KEY directly
 * because it is not prefixed with NEXT_PUBLIC_.
 * This is intentional — API keys must stay on the server.
 */

export interface AIAnalysisResult {
    recommendations: string[];
    pitchSummary: string;
    aiAnalysis: string;
    source: string;
}

export async function analyzeWithVemtapAI(profilingData: any): Promise<AIAnalysisResult> {
    const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilingData }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI analysis failed');
    }

    return {
        recommendations: data.recommendations,
        pitchSummary: data.pitchSummary,
        aiAnalysis: data.aiAnalysis,
        source: data.source || 'ai',
    };
}
