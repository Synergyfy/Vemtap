'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAIStore } from '@/store/useAIStore';

interface AICopilotButtonProps {
  className?: string;
}

export default function AICopilotButton({ className = '' }: AICopilotButtonProps) {
  const toggleCopilot = useAIStore((state) => state.toggleCopilot);

  return (
    <button
      onClick={toggleCopilot}
      className={`inline-flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all ${className}`}
      title="AI Copilot"
      aria-label="AI Copilot"
    >
      <Sparkles size={16} />
    </button>
  );
}
