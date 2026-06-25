import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SettingsTab = 'profile' | 'team' | 'subscription' | 'billing' | 'notifications' | 'security' | 'documents' | 'kyc';

interface SettingsState {
  activeTab: SettingsTab;
  
  // Actions
  setActiveTab: (tab: SettingsTab) => void;
  resetStore: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      activeTab: 'profile',

      setActiveTab: (activeTab) => set({ activeTab }),

      resetStore: () => set({
        activeTab: 'profile',
      }),
    }),
    {
      name: 'vemtap-settings-storage',
    }
  )
);
