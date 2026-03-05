import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FormPreferencesState {
  defaultFormByBranch: Record<string, string>;
  setDefaultForm: (branchScope: string, formId: string) => void;
  clearDefaultForm: (branchScope: string) => void;
  getDefaultFormId: (branchScope: string) => string | null;
}

export const useFormPreferencesStore = create<FormPreferencesState>()(
  persist(
    (set, get) => ({
      defaultFormByBranch: {},
      setDefaultForm: (branchScope, formId) =>
        set((state) => ({
          defaultFormByBranch: {
            ...state.defaultFormByBranch,
            [branchScope]: formId,
          },
        })),
      clearDefaultForm: (branchScope) =>
        set((state) => {
          const next = { ...state.defaultFormByBranch };
          delete next[branchScope];
          return { defaultFormByBranch: next };
        }),
      getDefaultFormId: (branchScope) => get().defaultFormByBranch[branchScope] || null,
    }),
    {
      name: 'form-preferences-v1',
    }
  )
);
