import { searchKnowledgeBase } from './knowledge-base';

// Interface for chat messages
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * GENERATE CHAT RESPONSE (Frontend Fallback)
 * 
 * This is a lightweight, rule-based fallback for when the backend
 * support bot API is unavailable. It does NOT use external AI
 * to ensure privacy and reduce client-side complexity.
 */
export async function generateChatResponse(messages: ChatMessage[], context?: string): Promise<string> {
  const lastMessage = messages[messages.length - 1].content;
  
  // 1. Try to find in Knowledge Base directly
  const kbContent = searchKnowledgeBase(lastMessage);
  if (kbContent) {
     return `I found this information in our help center that might help:\n\n${kbContent}\n\n*Note: I am currently operating in basic offline mode.*`; 
  }

  // 2. Keyword-based fallback responses
  const query = lastMessage.toLowerCase();
  
  if (query.includes('price') || query.includes('cost') || query.includes('billing')) {
    return "We offer flexible pricing plans starting from a Free tier up to Enterprise solutions. Basic: ₦15,000/mo, Premium: ₦45,000/mo. Please visit our pricing page for more details.";
  }
  
  if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
    return "Hello! I'm the VemTap Assistant. How can I help you today?";
  }

  if (query.includes('human') || query.includes('agent') || query.includes('support')) {
    return "I can connect you with a human agent. Please reach out to us at support@vemtap.io or open a support ticket from the dashboard.";
  }

  // 3. Ultimate Fallback
  return "Sorry, I can't answer this for now. Can I connect you to a human agent?";
}
