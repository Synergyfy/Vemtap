import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReviewStatus = 'new' | 'replied' | 'flagged' | 'resolved';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface FeedbackThread {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  sentiment: Sentiment;
  timestamp: string;
  replies: any[];
}

interface FeedbackState {
  threads: FeedbackThread[];
  activeFilters: {
    status: ReviewStatus | 'all';
    sentiment: Sentiment | 'all';
  };
  selectedThreadId: string | null;
  
  // Actions
  addThread: (thread: FeedbackThread) => void;
  updateThreadStatus: (id: string, status: ReviewStatus) => void;
  setActiveFilters: (filters: Partial<FeedbackState['activeFilters']>) => void;
  setSelectedThread: (id: string | null) => void;
  resetStore: () => void;
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set) => ({
      threads: [],
      activeFilters: { status: 'all', sentiment: 'all' },
      selectedThreadId: null,

      addThread: (thread) => set((state) => ({ threads: [thread, ...state.threads] })),

      updateThreadStatus: (id, status) => set((state) => ({
        threads: state.threads.map(t => t.id === id ? { ...t, status } : t)
      })),

      setActiveFilters: (filters) => set((state) => ({
        activeFilters: { ...state.activeFilters, ...filters }
      })),

      setSelectedThread: (id) => set({ selectedThreadId: id }),

      resetStore: () => set({ threads: [], activeFilters: { status: 'all', sentiment: 'all' }, selectedThreadId: null }),
    }),
    {
      name: 'vemtap-feedback-storage',
    }
  )
);
