import { create } from 'zustand';

export interface ChatButton {
  label: string;
  action: 'navigate' | 'url' | 'action';
  value: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  source?: 'rule' | 'ai' | 'fallback';
  interactionId?: string;
  wasHelpful?: boolean;
  buttons?: ChatButton[];
  followUp?: string[];
}

interface ChatState {
  history: Message[];
  isOpen: boolean;
  isVisible: boolean;
  addMessage: (message: Omit<Message, 'timestamp'>) => void;
  updateMessage: (idx: number, updates: Partial<Message>) => void;
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
    updateMessage: (idx, updates) => set((state) => {
      const newHistory = [...state.history];
      newHistory[idx] = { ...newHistory[idx], ...updates };
      return { history: newHistory };
    }),
    clearHistory: () => set({ history: [] }),
    setIsOpen: (isOpen) => set({ isOpen }),
    setIsVisible: (isVisible) => set({ isVisible }),
  })
);
