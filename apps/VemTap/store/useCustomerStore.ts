import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
  visitCount: number;
  lastVisit: string | null;
  createdAt: string;
  tags: string[];
}

interface CustomerState {
  customers: Customer[];
  isSeeded: boolean;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'totalSpent' | 'visitCount' | 'lastVisit' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  
  // Stats
  getTotalCustomers: () => number;
  
  seedCustomers: () => void;
  resetStore: () => void;
}

const SEED_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Chinedu Okeke', phone: '08012345678', email: 'chinedu@example.com', totalSpent: 125000, visitCount: 12, lastVisit: new Date().toISOString(), createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), tags: ['VIP', 'Frequent'] },
  { id: 'c2', name: 'Aisha Bello', phone: '08123456789', email: 'aisha@example.com', totalSpent: 45000, visitCount: 3, lastVisit: new Date(Date.now() - 2 * 86400000).toISOString(), createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), tags: [] },
  { id: 'c3', name: 'Tunde Bakare', phone: '07098765432', email: 'tunde@example.com', totalSpent: 210000, visitCount: 8, lastVisit: new Date(Date.now() - 5 * 86400000).toISOString(), createdAt: new Date(Date.now() - 120 * 86400000).toISOString(), tags: ['Wholesale'] },
  { id: 'c4', name: 'Grace Johnson', phone: '08087654321', email: 'grace@example.com', totalSpent: 15000, visitCount: 1, lastVisit: new Date(Date.now() - 10 * 86400000).toISOString(), createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), tags: ['New'] },
];

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      isSeeded: false,

      addCustomer: (customer) => set((state) => ({
        customers: [{
          ...customer,
          id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          totalSpent: 0,
          visitCount: 0,
          lastVisit: null,
          createdAt: new Date().toISOString(),
        }, ...state.customers]
      })),

      updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),

      getCustomer: (id) => get().customers.find(c => c.id === id),

      getTotalCustomers: () => get().customers.length,

      seedCustomers: () => {
        if (!get().isSeeded) {
          set({ customers: SEED_CUSTOMERS, isSeeded: true });
        }
      },

      resetStore: () => set({ customers: [], isSeeded: false }),
    }),
    { name: 'vemtap-customer-storage-v2' }
  )
);
