import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NFCLink {
    id: string;
    businessId: string;
    quoteId: string; // 'TRIAL' or a real quote ID
    url: string;
    label: string;
    createdAt: string;
    status: 'active' | 'inactive';
    uniqueId: string;
}

interface NFCState {
    links: NFCLink[];
    addLink: (link: NFCLink) => void;
    addLinks: (links: NFCLink[]) => void;
    updateLink: (id: string, updates: Partial<NFCLink>) => void;
    removeLink: (id: string) => void;
    getLinksByBusiness: (businessId: string) => NFCLink[];
}

export const useNfcStore = create<NFCState>()(
    persist(
        (set, get) => ({
            links: [],
            addLink: (link) => set((state) => ({
                links: [link, ...state.links]
            })),
            addLinks: (newLinks) => set((state) => ({
                links: [...newLinks, ...state.links]
            })),
            updateLink: (id, updates) => set((state) => ({
                links: state.links.map((l) => l.id === id ? { ...l, ...updates } : l)
            })),
            removeLink: (id) => set((state) => ({
                links: state.links.filter((l) => l.id !== id)
            })),
            getLinksByBusiness: (businessId) => {
                return get().links.filter((l) => l.businessId === businessId);
            },
        }),
        {
            name: 'nfc-storage',
        }
    )
);
