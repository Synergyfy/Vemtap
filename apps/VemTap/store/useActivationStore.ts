import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivationStep = 'profile' | 'qr' | 'assets' | 'customer' | 'campaign';

interface ActivationState {
  isActivated: boolean;
  progress: number;
  completedSteps: ActivationStep[];
  isWizardOpen: boolean;
  currentWizardStep: number;
  
  // Actions
  completeStep: (stepId: ActivationStep) => void;
  setWizardOpen: (isOpen: boolean) => void;
  setWizardStep: (step: number) => void;
  resetActivation: () => void;
  toggleActivation: (status: boolean) => void;
}

export const useActivationStore = create<ActivationState>()(
  persist(
    (set, get) => ({
      isActivated: false,
      progress: 0,
      completedSteps: [],
      isWizardOpen: false,
      currentWizardStep: 1,

      completeStep: (stepId: ActivationStep) => {
        const { completedSteps } = get();
        if (completedSteps.includes(stepId)) return;

        const newCompletedSteps = [...completedSteps, stepId];
        const newProgress = Math.round((newCompletedSteps.length / 5) * 100);
        
        set({
          completedSteps: newCompletedSteps,
          progress: newProgress,
          isActivated: newProgress === 100,
        });
      },

      setWizardOpen: (isOpen: boolean) => set({ isWizardOpen: isOpen }),
      
      setWizardStep: (step: number) => set({ currentWizardStep: step }),

      resetActivation: () => set({
        isActivated: false,
        progress: 0,
        completedSteps: [],
        isWizardOpen: false,
        currentWizardStep: 1,
      }),

      toggleActivation: (status: boolean) => set({ isActivated: status }),
    }),
    {
      name: 'vemtap-activation-storage',
    }
  )
);
