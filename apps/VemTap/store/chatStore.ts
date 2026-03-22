import { create } from 'zustand';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatState {
  history: Message[];
  isOpen: boolean;
  isVisible: boolean;
  addMessage: (message: Omit<Message, 'timestamp'>) => void;
  clearHistory: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsVisible: (isVisible: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  (set) => ({
    history: [],
    isOpen: false,
    isVisible: true,
    addMessage: (message) => set((state) => ({
      history: [...state.history, { ...message, timestamp: Date.now() }]
    })),
    clearHistory: () => set({ history: [] }),
    setIsOpen: (isOpen) => set({ isOpen }),
    setIsVisible: (isVisible) => set({ isVisible }),
  })
);
