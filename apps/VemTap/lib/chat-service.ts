import OpenAI from 'openai';
import { KNOWLEDGE_BASE, searchKnowledgeBase } from './knowledge-base';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key', // Fallback to avoid crash on init if key is missing
  dangerouslyAllowBrowser: true // Only if used client-side, but we are using it server-side. 
});

// Interface for chat messages
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Simple in-memory cache for AI responses
const responseCache = new Map<string, string>();

export async function generateChatResponse(messages: ChatMessage[], context?: string): Promise<string> {
  // 1. Check if we have an API key. If not, use rule-based fallback.
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not found. Using fallback logic.");
    return fallbackResponse(messages);
  }

  // 2. Extract the latest user message
  const lastUserMessage = messages[messages.length - 1].content;
  const normalizedQuery = lastUserMessage.toLowerCase().trim();

  // 3. AI Cost Optimization: Use Caching for frequent/exact questions
  if (responseCache.has(normalizedQuery)) {
    console.log("Serving response from cache:", normalizedQuery);
    return responseCache.get(normalizedQuery)!;
  }

  // 4. Search Knowledge Base for relevant info
  const knowledge = searchKnowledgeBase(lastUserMessage);

  // 5. Construct System Prompt
  const systemPrompt = `You are the VemTap AI Assistant, a helpful and friendly bot for the VemTap Visitor Engagement Platform.
  
  Your goal is to assist users with platform questions, troubleshooting, and guidance.
  
  CONTEXT FROM KNOWLEDGE BASE:
  ${knowledge}
  
  CURRENT PAGE CONTEXT: ${context || 'General'}
  
  INSTRUCTIONS:
  - Be concise, professional, and friendly.
  - Use the provided CONTEXT to answer. If the answer is in the context, use it.
  - If the answer is NOT in the context, politely say you don't know and offer to connect them with a human agent.
  - Do NOT hallucinate features that are not mentioned.
  - If the user seems frustrated or asks for a human, suggest escalation.
  - Format your response with clear paragraphs or bullet points if needed.
  `;

  // 6. AI Cost Optimization: Limit session history to last 5 messages
  const historyLimit = 5;
  const limitedMessages = messages.slice(-historyLimit);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // GPT-4o-mini is efficient and high-quality for majority of tasks
      messages: [
        { role: 'system', content: systemPrompt },
        ...limitedMessages
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content || "I apologize, but I couldn't generate a response at the moment.";
    
    // Save to cache if it's a short, high-confidence response
    if (response.length < 500) {
      responseCache.set(normalizedQuery, response);
    }

    return response;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "I'm having trouble connecting to my brain right now. Please try again in a moment, or contact support if the issue persists.";
  }
}

function fallbackResponse(messages: ChatMessage[]): string {
  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  
  // Simple keyword matching for fallback
  if (lastMessage.includes('price') || lastMessage.includes('cost')) {
    return "We offer flexible pricing plans starting from a Free tier up to Enterprise solutions. Basic: ₦15,000/mo, Premium: ₦45,000/mo.";
  }
  
  if (lastMessage.includes('hello') || lastMessage.includes('hi')) {
    return "Hello! I'm the VemTap Assistant (running in offline mode). How can I help you regarding our platform?";
  }

  // Try to find in KB directly
  const content = searchKnowledgeBase(lastMessage);
  if (content) {
     return `I found this information in our knowledge base that might help:\n\n${content}\n\n*Note: I am currently operating in basic mode.*`; 
  }

  return "I'm currently in maintenance mode (offline) and can only answer basic questions. For detailed assistance, please reach out to our support team at support@vemtap.io or visit our help center. We're here to help!";
}
