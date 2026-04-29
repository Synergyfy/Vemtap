import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SudoTargetType = 'business' | 'customer';

export interface SudoSession {
    type: SudoTargetType;
    subjectId: string;
    token: string;
    ticketRef?: string;
    startTime: number;
    expiresAt: number;
    permissions?: string[];
}

interface SudoState {
    activeSession: SudoSession | null;
    startSession: (session: Omit<SudoSession, 'startTime'>) => void;
    endSession: () => void;
    isSessionActive: () => boolean;
}

export const useSudoStore = create<SudoState>()(
    persist(
        (set, get) => ({
            activeSession: null,

            startSession: (session) => {
                set({
                    activeSession: {
                        ...session,
                        startTime: Date.now(),
                    },
                });
            },

            endSession: () => {
                set({ activeSession: null });
                // Optional: clear any specific sudo-related query params from URL if needed
            },

            isSessionActive: () => {
                const session = get().activeSession;
                if (!session) return false;
                return Date.now() < session.expiresAt;
            },
        }),
        {
            name: 'vemtap-sudo-storage',
        }
    )
);
