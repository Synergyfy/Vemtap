# VemTap Hybrid Support Bot - Architecture & Implementation Plan

## 1. Design Philosophy: "Efficiency First"
The goal is to provide instant, zero-cost answers for 80% of common queries using a rule-based engine, falling back to OpenAI only for complex or unique questions.

## 2. The Tiered Response Engine

### **Tier 1: Direct Keyword Matching (0 Cost)**
- **How it works**: A simple "Map" of keywords to responses stored in the backend.
- **Example**: `["price", "plan", "cost"]` -> Returns a link to the Pricing page.
- **Implementation**: Expand the `ChatSettingsService` in the backend to support "Global Platform FAQs".

### **Tier 2: Semantic Knowledge Base (0 Cost)**
- **How it works**: A local search (using basic fuzzy matching or a library like `Fuse.js`) against the `knowledge-base.ts` file.
- **Improvement**: Move this knowledge base to the database so it can be updated via the Admin Dashboard.

### **Tier 3: Intent-Based AI Fallback (Low Cost)**
- **How it works**: If Tiers 1 & 2 fail (confidence score < 0.6), the message is sent to OpenAI with a specific "Clarification" prompt.
- **Logic**: "The user asked '[query]'. I couldn't find a direct match in my FAQ. Based on our platform docs, give them a helpful answer or ask for clarification."

---

## 3. Proposed Backend Architecture (NestJS)

### **AI-Rule Controller**
- `POST /support/bot/query`: The main endpoint the floating icon will call.
- **Workflow**:
  1. **Sanitize**: Clean the user input.
  2. **Rule Check**: Query `AutomationRules` for active "Global FAQs".
  3. **KB Search**: Search the `KnowledgeBase` entities for matches.
  4. **Decision**: 
     - If Match found -> Return Response + Source ("Rule Engine").
     - If No Match -> Forward to `OpenAIService` -> Return Response + Source ("AI Fallback").

### **Persistence Layer**
- **`SupportBotHistory`**: Track which questions are being asked and whether they were answered by Rules or AI. This helps admins identify new "Rule" candidates to save costs.

---

## 4. Implementation Roadmap

### **Phase 1: Rule Engine Foundation**
- [ ] Migrate `lib/knowledge-base.ts` to a `KnowledgeBase` table in PostgreSQL.
- [ ] Implement a `BotService` in the backend that performs the Tier 1 & 2 checks.
- [ ] Connect the frontend `SupportChatbot.tsx` to this new backend service.

### **Phase 2: Intent Detection**
- [ ] Add "Intent" tags to FAQ entries (e.g., `#billing`, `#nfc-setup`).
- [ ] Use regex and simple NLP to detect intents before calling OpenAI.

### **Phase 3: Admin Dashboard**
- [ ] Create a UI for VemTap Admins to add/edit FAQ pairs.
- [ ] Show a "Missed Questions" log where the bot failed, allowing admins to create new rules for those queries.

### **Phase 4: OpenAI Integration (The Fallback)**
- [ ] Securely move OpenAI calls to the backend.
- [ ] Implement "Context Injection" (e.g., pass the user's current subscription status so the AI knows if they can access certain features).
