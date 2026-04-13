-- Migration: Add chatbot knowledge base enhancements
-- Run this in your PostgreSQL database

-- Add columns to support_knowledge
ALTER TABLE support_knowledge ADD COLUMN IF NOT EXISTS confidence float DEFAULT 0;
ALTER TABLE support_knowledge ADD COLUMN IF NOT EXISTS success_rate float DEFAULT 0;
ALTER TABLE support_knowledge ADD COLUMN IF NOT EXISTS match_count integer DEFAULT 0;
ALTER TABLE support_knowledge ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false;
ALTER TABLE support_knowledge ADD COLUMN IF NOT EXISTS buttons jsonb;

-- Add columns to bot_interactions
ALTER TABLE bot_interactions ADD COLUMN IF NOT EXISTS confidence float DEFAULT 0;
ALTER TABLE bot_interactions ADD COLUMN IF NOT EXISTS buttons jsonb;
ALTER TABLE bot_interactions ADD COLUMN IF NOT EXISTS conversation_path varchar;

-- Create bot_conversation_context table
CREATE TABLE IF NOT EXISTS bot_conversation_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
  user_id varchar NOT NULL,
  session_id varchar NOT NULL,
  messages jsonb DEFAULT '[]',
  current_path varchar,
  user_responses jsonb,
  last_activity timestamp,
  is_active boolean DEFAULT true
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bot_conversation_context_user_session ON bot_conversation_context(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_bot_conversation_context_last_activity ON bot_conversation_context(last_activity) WHERE is_active = true;
