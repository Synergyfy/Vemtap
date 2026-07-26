import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse, ChatMessage } from '@/lib/chat-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages, context } = body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ 
        role: 'assistant', 
        content: "Hello! How can I assist you with VemTap today?",
        timestamp: new Date().toISOString()
      });
    }

    const responseText = await generateChatResponse(messages, context);

    return NextResponse.json({ 
        role: 'assistant', 
        content: responseText || "How can I assist you today?",
        timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ 
      role: 'assistant',
      content: "I'm operating in offline mode right now. How can I help you?",
      timestamp: new Date().toISOString()
    });
  }
}
