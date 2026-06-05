import * as dotenv from 'dotenv';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load env variables
const targetPath = join(process.cwd(), '.env');
dotenv.config({ path: targetPath });

const apiKey = process.env.GEMINI_API_KEY;
console.log('Gemini API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING');

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is not defined in the backend .env file.');
  process.exit(1);
}

async function testGemini() {
  try {
    console.log('Testing gemini-2.5-flash-image via generateContent...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: 'Generate a modern minimalist restaurant table stand menu design with white background'
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ['IMAGE']
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API Error details:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n--- SUCCESS ---');
    console.log('Candidates returned:', data.candidates?.length || 0);
    if (data.candidates && data.candidates.length > 0) {
      const parts = data.candidates[0].content?.parts || [];
      console.log('Parts count:', parts.length);
      parts.forEach((p: any, idx: number) => {
        console.log(`Part ${idx} keys:`, Object.keys(p));
        if (p.inlineData) {
          console.log(`Part ${idx} inlineData mimeType:`, p.inlineData.mimeType);
          console.log(`Part ${idx} inlineData data length:`, p.inlineData.data?.length || 0);
        }
      });
    }
  } catch (error: any) {
    console.error('\n--- FAILURE ---');
    console.error('Fetch failed:', error.message || error);
    process.exit(1);
  }
}

testGemini();
