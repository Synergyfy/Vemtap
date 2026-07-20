'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';

interface PageGuideButtonProps {
  className?: string;
}

export default function PageGuideButton({ className = '' }: PageGuideButtonProps) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('start-page-guide'));
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center size-9 rounded-xl bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 shadow-sm hover:shadow transition-all active:scale-95 ${className}`}
      title="Page guide"
      aria-label="Page guide"
    >
      <BookOpen size={16} />
    </button>
  );
}
