import { create } from 'zustand';

interface ConflictStore {
    isOpen: boolean;
    message: string;
    openConflict: (message: string) => void;
    closeConflict: () => void;
}

export const useConflictStore = create<ConflictStore>((set) => ({
    isOpen: false,
    message: '',
    openConflict: (message) => set({ isOpen: true, message }),
    closeConflict: () => set({ isOpen: false, message: '' }),
}));
