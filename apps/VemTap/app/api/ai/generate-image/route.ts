import { NextRequest, NextResponse } from 'next/server';

/**
 * VEMTAP AI IMAGE GENERATION — Server-Side API Route
 * 
 * This calls the Gemini Nano Banana (Image Generation) API.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'imagen-4.0-generate-001'; 
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:predict?key=${GEMINI_API_KEY}`;

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

        const payload = {
            instances: [
                {
                    prompt: systemPrompt
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: '1:1',
                outputMimeType: 'image/jpeg'
            }
        };

        let imageUrl = '';
        let isSuccess = false;
        let apiError = '';

        // 1. Attempt image generation via gemini-2.5-flash-image (available on free keys)
        try {
            console.log('[Vemtap AI Image] Attempting image generation via gemini-2.5-flash-image...');
            const geminiImageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
            const geminiPayload = {
                contents: [
                    {
                        parts: [
                            {
                                text: `Generate a high-quality, professional marketing design/graphic based on: "${prompt}". 
Ensure the design matches the brand colors (Primary: ${businessInfo?.primaryColor || '#493EE5'}, Accent: ${businessInfo?.accentColor || '#FFFFFF'}) where appropriate. 
Include a clean, solid white square area in the layout for a QR code to be overlaid later.`
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseModalities: ['IMAGE']
                }
            };

            const response = await fetch(geminiImageUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiPayload),
            });

            console.log('[Vemtap AI Image] gemini-2.5-flash-image response status:', response.status);
            const data = await response.json();

            if (response.ok && data.candidates && data.candidates.length > 0) {
                const parts = data.candidates[0].content?.parts || [];
                const imagePart = parts.find((p: any) => p.inlineData && p.inlineData.data);
                if (imagePart) {
                    const mime = imagePart.inlineData.mimeType || 'image/png';
                    const bytes = imagePart.inlineData.data;
                    imageUrl = `data:${mime};base64,${bytes}`;
                    isSuccess = true;
                    console.log('[Vemtap AI Image] Successfully generated image via gemini-2.5-flash-image.');
                } else {
                    throw new Error('No inline image bytes in candidates response');
                }
            } else {
                const errMsg = data.error?.message || 'Unknown Gemini Image Error';
                console.warn('[Vemtap AI Image] gemini-2.5-flash-image did not succeed:', errMsg);
                apiError = errMsg;
            }
        } catch (err: any) {
            console.error('[Vemtap AI Image] Failed to generate image via gemini-2.5-flash-image, falling back:', err.message);
            apiError = err.message;
        }

        // 2. If gemini-2.5-flash-image failed, attempt paid Imagen 4.0 API
        if (!isSuccess) {
            try {
                console.log('[Vemtap AI Image] Trying Imagen 4.0 API...', GEMINI_ENDPOINT.substring(0, 60) + '...');
                const response = await fetch(GEMINI_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                console.log('[Vemtap AI Image] Imagen 4.0 response status:', response.status);
                const data = await response.json();

                if (response.ok && data.predictions && data.predictions.length > 0) {
                    const base64Bytes = data.predictions[0].bytesBase64Encoded;
                    if (base64Bytes) {
                        imageUrl = `data:image/jpeg;base64,${base64Bytes}`;
                        isSuccess = true;
                        console.log('[Vemtap AI Image] Successfully generated image via Imagen.');
                    } else {
                        throw new Error('No base64 image bytes in prediction response');
                    }
                } else {
                    const errMsg = data.error?.message || 'Unknown API Error';
                    console.warn('[Vemtap AI Image] Imagen 4.0 call did not succeed:', errMsg);
                    apiError = errMsg;
                }
            } catch (err: any) {
                console.error('[Vemtap AI Image] Failed to call Gemini Imagen API:', err.message);
                apiError = err.message;
            }
        }

        let isFallback = !isSuccess;
        if (isFallback) {
            try {
                console.log('[Vemtap AI Image] Free-tier key detected or Imagen failed. Generating custom brand-aligned SVG via Gemini Flash...');
                const textModel = 'gemini-flash-latest';
                const textEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${textModel}:generateContent?key=${GEMINI_API_KEY}`;
                
                const formatRaw = options?.format || 'table-stand';
                const formatNormalized = String(formatRaw).toLowerCase().replace(/[\s_]+/g, '-');
                
                let width = 500;
                let height = 500;
                if (formatNormalized === 'poster' || formatNormalized === 'flyer' || formatNormalized === 'table-stand') {
                    width = 400;
                    height = 600;
                } else if (formatNormalized === 'banner') {
                    width = 800;
                    height = 300;
                }

                const keywords = getKeywordsFromPrompt(prompt);
                const backgroundUrl = `https://loremflickr.com/${width}/${height}/${encodeURIComponent(keywords)}`;

                const svgSystemPrompt = `You are a professional graphic designer.
Generate a modern, premium, and visually stunning marketing asset design in raw SVG format.
Brand Details:
- Business Name: ${businessInfo?.name || 'Vemtap Business'}
- Primary Brand Color: ${businessInfo?.primaryColor || '#493EE5'}
- Accent Brand Color: ${businessInfo?.accentColor || '#FFFFFF'}

Marketing Context:
- Design Goal: ${options?.goal || 'General Engagement'}
- Format: ${options?.format || 'Table Stand'}
- Prompt/Vibe: "${prompt}"

Layout Requirements:
- Use a viewport (viewBox) that fits the format: "0 0 ${width} ${height}".
- Background: You MUST start by embedding a photographic background image from LoremFlickr:
  <image href="${backgroundUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
- Background Tint Overlay: Overlay a semi-transparent black rectangle (fill="#000000" opacity="0.45") and optionally a gradient overlay using the brand colors to ensure contrast and premium feel.
- QR Code Placeholder: You MUST place a high-contrast white rounded square (e.g. rect with rx="12", ry="12", fill="#FFFFFF", width="150", height="150") at a prominent position (e.g., center or bottom-center) so a QR code can be overlaid.
- Text: Include some beautiful typography matching the brand and prompt (e.g. "Welcome", "Scan Me", or a catchy tag). Ensure all text uses fill colors with high contrast relative to the background (e.g., white text on dark primary backgrounds, or dark text on light backgrounds).
- Overall Look: Premium, modern, clean, with glassmorphism or sleek shapes. Avoid plain colors or looking like a mockup frame. Keep it flat and modern.

CRITICAL: Return ONLY valid, raw SVG code. Do NOT wrap it in markdown block syntax (like \`\`\`xml or \`\`\`svg). Start directly with "<svg" and end with "</svg>".`;

                const textPayload = {
                    contents: [{ parts: [{ text: svgSystemPrompt }] }]
                };

                const textResponse = await fetch(textEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(textPayload)
                });

                if (textResponse.ok) {
                    const textData = await textResponse.json();
                    const svgRaw = textData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    let svgClean = svgRaw.trim();
                    if (svgClean.startsWith('```')) {
                        svgClean = svgClean.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();
                    }
                    if (svgClean.includes('<svg') && svgClean.includes('</svg>')) {
                        const base64Svg = Buffer.from(svgClean).toString('base64');
                        imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
                        console.log('[Vemtap AI Image] Successfully generated brand-aligned custom SVG design fallback.');
                        isFallback = false; // Override since we did generate a customized graphic!
                    } else {
                        console.warn('[Vemtap AI Image] SVG generated by Gemini was invalid, using local SVG generator.');
                        imageUrl = getLocalSvgDataUri(prompt, businessInfo, options);
                        isFallback = false;
                    }
                } else {
                    const textErr = await textResponse.text();
                    console.error('[Vemtap AI Image] Gemini Flash text API returned error status:', textResponse.status, textErr);
                    imageUrl = getLocalSvgDataUri(prompt, businessInfo, options);
                    isFallback = false;
                }
            } catch (svgErr: any) {
                console.error('[Vemtap AI Image] Failed to generate custom SVG fallback:', svgErr.message);
                imageUrl = getLocalSvgDataUri(prompt, businessInfo, options);
                isFallback = false;
            }
        }

        return NextResponse.json({
            success: true,
            imageUrl,
            promptUsed: prompt,
            isFallback,
            error: isFallback ? apiError : undefined
        });

    } catch (error: any) {
        console.error('[Vemtap AI Image] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

function getLocalSvgDataUri(prompt: string, businessInfo: any, options: any): string {
    const primary = businessInfo?.primaryColor || '#493EE5';
    const accent = businessInfo?.accentColor || '#FFFFFF';
    const name = businessInfo?.name || 'Vemtap Business';
    const goal = options?.goal || 'General Engagement';
    
    // Normalize format
    const formatRaw = options?.format || 'table-stand';
    const formatNormalized = String(formatRaw).toLowerCase().replace(/[\s_]+/g, '-');

    let width = 500;
    let height = 500;
    if (formatNormalized === 'poster' || formatNormalized === 'flyer' || formatNormalized === 'table-stand') {
        width = 400;
        height = 600;
    } else if (formatNormalized === 'banner') {
        width = 800;
        height = 300;
    }

    const darkPrimary = adjustColorBrightness(primary, -35);
    
    // Extract keywords for LoremFlickr
    const keywords = getKeywordsFromPrompt(prompt);
    const backgroundUrl = `https://loremflickr.com/${width}/${height}/${encodeURIComponent(keywords)}`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${primary}" />
                <stop offset="100%" stop-color="${darkPrimary}" />
            </linearGradient>
            <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.3"/>
            </filter>
        </defs>
        
        <!-- Base Gradient Background -->
        <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
        
        <!-- Photographic Content from LoremFlickr -->
        <image href="${backgroundUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
        
        <!-- Overlay for brand coloring and readability -->
        <rect width="${width}" height="${height}" fill="#000000" opacity="0.4" />
        <rect width="${width}" height="${height}" fill="url(#bgGrad)" opacity="0.45" />
        
        <!-- Top bar / logo branding -->
        <g transform="translate(30, 45)">
            <rect width="12" height="12" rx="3" fill="${accent}" />
            <text x="22" y="11" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${accent}" letter-spacing="1.5">${name.toUpperCase()}</text>
        </g>
        
        <!-- Main Design content (User Prompt) -->
        <text x="30" y="${height * 0.22}" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF">
            ${formatTextToLines(prompt || 'Scan to Connect', 20, 30, height * 0.22)}
        </text>
        
        <!-- Marketing Goal Badge -->
        <g transform="translate(30, ${height * 0.42})">
            <rect width="130" height="26" rx="13" fill="${accent}" opacity="0.2" />
            <text x="65" y="17" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="${accent}" text-anchor="middle" letter-spacing="1">${goal.replace('-', ' ').toUpperCase()}</text>
        </g>
        
        <!-- QR Code Placeholder White Square (Required by spec) -->
        <g filter="url(#dropShadow)">
            <rect x="${width / 2 - 75}" y="${height * 0.55}" width="150" height="150" rx="16" fill="#FFFFFF" />
            <!-- Centered minimal Scan pattern / placeholder icon -->
            <rect x="${width / 2 - 55}" y="${height * 0.55 + 20}" width="110" height="110" rx="8" fill="none" stroke="${primary}" stroke-width="2" stroke-dasharray="6 4" opacity="0.3" />
            <text x="${width / 2}" y="${height * 0.55 + 72}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="${primary}" text-anchor="middle" opacity="0.6">SCAN HERE</text>
            <text x="${width / 2}" y="${height * 0.55 + 92}" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="#94A3B8" text-anchor="middle" opacity="0.8">NFC / QR CODE</text>
        </g>
        
        <!-- Footer line -->
        <text x="${width / 2}" y="${height - 25}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#FFFFFF" opacity="0.5" text-anchor="middle" letter-spacing="1">POWERED BY VEMTAP NFC</text>
    </svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function getKeywordsFromPrompt(prompt: string): string {
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'for', 'with', 'of', 'and', 'or', 'to', 'is', 'it', 'about', 'graphics', 'design', 'invite', 'invitation']);
    const cleanWords = prompt
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .split(/\s+/)
        .filter(w => w && !stopWords.has(w));
    
    if (cleanWords.length === 0) {
        return 'marketing';
    }
    
    return cleanWords.join(',');
}

function adjustColorBrightness(hex: string, percent: number): string {
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    let r = parseInt(hex.substring(0, 2), 16),
        g = parseInt(hex.substring(2, 4), 16),
        b = parseInt(hex.substring(4, 6), 16);

    r = Math.min(255, Math.max(0, r + (percent * 2.55)));
    g = Math.min(255, Math.max(0, g + (percent * 2.55)));
    b = Math.min(255, Math.max(0, b + (percent * 2.55)));

    return `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)}`;
}

function formatTextToLines(text: string, maxCharPerLine: number, x: number, startY: number): string {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (const word of words) {
        if ((currentLine + ' ' + word).length > maxCharPerLine) {
            lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine += ' ' + word;
        }
    }
    if (currentLine) {
        lines.push(currentLine.trim());
    }
    
    const limitedLines = lines.slice(0, 3);
    
    return limitedLines.map((line, idx) => {
        return `<tspan x="${x}" dy="${idx === 0 ? 0 : 34}">${escapeXml(line)}</tspan>`;
    }).join('');
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
