import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CustomerStatus = 'active' | 'inactive' | 'new' | 'vip';
export type SortOption = 'newest' | 'oldest' | 'most_active' | 'least_active' | 'alphabetical';

export interface CRMFilters {
  registrationDate?: { start: string; end: string };
  lastVisit?: { start: string; end: string };
  status?: CustomerStatus[];
  segment?: string[];
  gender?: string[];
  interests?: string[];
  source?: string[];
}

interface CRMState {
  selectedCustomerIds: string[];
  isBulkActionActive: boolean;
  activeFilters: CRMFilters;
  activeSort: SortOption;
  
  // Actions
  toggleCustomerSelection: (id: string) => void;
  selectAllCustomers: (ids: string[]) => void;
  clearSelection: () => void;
  setBulkActionActive: (active: boolean) => void;
  setFilters: (filters: Partial<CRMFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: SortOption) => void;
}

const DEFAULT_FILTERS: CRMFilters = {};

export const useCRMStore = create<CRMState>()(
  persist(
    (set) => ({
      selectedCustomerIds: [],
      isBulkActionActive: false,
      activeFilters: DEFAULT_FILTERS,
      activeSort: 'newest',

      toggleCustomerSelection: (id) => set((state) => {
        const isSelected = state.selectedCustomerIds.includes(id);
        const newList = isSelected 
          ? state.selectedCustomerIds.filter(cid => cid !== id)
          : [...state.selectedCustomerIds, id];
        return { 
          selectedCustomerIds: newList,
          isBulkActionActive: newList.length > 0 
        };
      }),

      selectAllCustomers: (ids) => set({ 
        selectedCustomerIds: ids,
        isBulkActionActive: ids.length > 0
      }),

      clearSelection: () => set({ 
        selectedCustomerIds: [],
        isBulkActionActive: false 
      }),

      setBulkActionActive: (isBulkActionActive) => set({ isBulkActionActive }),
      
      setFilters: (filters) => set((state) => ({
        activeFilters: { ...state.activeFilters, ...filters }
      })),

      clearFilters: () => set({ activeFilters: DEFAULT_FILTERS }),
      
      setSort: (activeSort) => set({ activeSort }),
    }),
    {
      name: 'vemtap-crm-storage',
    }
  )
);
