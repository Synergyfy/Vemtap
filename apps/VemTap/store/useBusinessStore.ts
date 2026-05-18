import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useAuthStore } from './useAuthStore';

export interface Branch {
  id: string;
  username?: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  manager?: string;
  whatsappNumber?: string;
  smsSenderId?: string;
  chatbotEnabled?: boolean;
  chatbotName?: string;
}

interface BusinessState {
  branches: Branch[];
  setBranches: (branches: Branch[]) => void;
  getBranch: (id: string) => Branch | undefined;
  getActiveBranch: () => Branch | undefined;
  addBranch: (branch: Omit<Branch, 'id'>) => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      branches: [], // Start empty, let the API fill it

      setBranches: (branches: Branch[]) => set({ branches }),

      getBranch: (id: string) => {
        return get().branches.find(b => b.id === id);
      },

      getActiveBranch: () => {
        const { branches } = get();
        const activeBranchId = useAuthStore.getState().activeBranchId;
        return branches.find(b => b.id === activeBranchId);
      },

      addBranch: (branchData: Omit<Branch, 'id'>) => {
        const newBranch: Branch = {
          ...branchData,
          id: `branch-${Date.now().toString(36)}`,
        };
        set((state) => ({ branches: [...state.branches, newBranch] }));
      }
    }),
    {
      name: 'business-storage',
    }
  )
);

