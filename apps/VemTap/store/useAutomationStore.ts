import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AutomationTrigger = 'registration' | 'visit' | 'order' | 'campaign_opened' | 'birthday' | 'segment_added' | 'qr_scan' | 'custom_event';
export type AutomationAction = 'send_whatsapp' | 'send_sms' | 'send_email' | 'add_tag' | 'assign_segment' | 'create_notification' | 'generate_coupon';
export type AutomationStatus = 'active' | 'paused' | 'draft' | 'archived';

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  config: any;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'welcome' | 'birthday' | 'reactivation' | 'custom';
  status: AutomationStatus;
  trigger: AutomationTrigger;
  steps: WorkflowStep[];
  stats: {
    sent: number;
    reached: number;
    successRate: number;
    lastTriggered?: string;
  };
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  automationName: string;
  action: string;
  result: string;
  status: 'success' | 'pending' | 'failed';
}

interface AutomationState {
  rules: AutomationRule[];
  activityLogs: ActivityLog[];
  isBuilderOpen: boolean;
  currentEditingRuleId: string | null;
  
  // Actions
  setBuilderOpen: (isOpen: boolean) => void;
  setEditingRule: (id: string | null) => void;
  toggleAutomationStatus: (id: string) => void;
  addRule: (rule: AutomationRule) => void;
  updateRule: (id: string, updates: Partial<AutomationRule>) => void;
  deleteRule: (id: string) => void;
  resetStore: () => void;
}

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set) => ({
      rules: [],
      activityLogs: [],
      isBuilderOpen: false,
      currentEditingRuleId: null,

      setBuilderOpen: (isBuilderOpen) => set({ isBuilderOpen }),
      
      setEditingRule: (currentEditingRuleId) => set({ currentEditingRuleId }),

      toggleAutomationStatus: (id) => set((state) => ({
        rules: state.rules.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r)
      })),

      addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),

      updateRule: (id, updates) => set((state) => ({
        rules: state.rules.map(r => r.id === id ? { ...r, ...updates } : r)
      })),

      deleteRule: (id) => set((state) => ({
        rules: state.rules.filter(r => r.id !== id)
      })),

      resetStore: () => set({ rules: [], activityLogs: [], isBuilderOpen: false, currentEditingRuleId: null }),
    }),
    {
      name: 'vemtap-automation-storage',
    }
  )
);
