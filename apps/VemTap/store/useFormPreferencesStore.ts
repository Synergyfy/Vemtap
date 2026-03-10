import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FormPreferencesState {
  defaultFormByBranch: Record<string, string>;
  activeFormIdsByBranch: Record<string, string[]>;
  setDefaultForm: (branchScope: string, formId: string) => void;
  clearDefaultForm: (branchScope: string) => void;
  getDefaultFormId: (branchScope: string) => string | null;
  toggleActiveForm: (branchScope: string, formId: string) => void;
  isActiveForm: (branchScope: string, formId: string) => boolean;
  getActiveFormIds: (branchScope: string) => string[];
}

export const useFormPreferencesStore = create<FormPreferencesState>()(
  persist(
    (set, get) => ({
      defaultFormByBranch: {},
      activeFormIdsByBranch: {},
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
      toggleActiveForm: (branchScope, formId) =>
        set((state) => {
          const current = state.activeFormIdsByBranch[branchScope] || [];
          const next = current.includes(formId)
            ? current.filter((id) => id !== formId)
            : [...current, formId];
          return {
            activeFormIdsByBranch: {
              ...state.activeFormIdsByBranch,
              [branchScope]: next,
            },
          };
        }),
      isActiveForm: (branchScope, formId) => {
        const ids = get().activeFormIdsByBranch[branchScope] || [];
        return ids.includes(formId);
      },
      getActiveFormIds: (branchScope) => get().activeFormIdsByBranch[branchScope] || [],
    }),
    {
      name: 'form-preferences-v1',
    }
  )
);
