import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Quote {
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    quantity: number;
    message: string;
    estimatedValue: number | 'quote';
    status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
    createdAt: Date;
    nfcLinksGenerated?: number;
    businessId?: string; // For admin-granted quotes
    businessName?: string; // For admin-granted quotes
}

interface QuoteStore {
    quotes: Quote[];
    addQuote: (quote: Omit<Quote, 'id' | 'status' | 'createdAt'>) => void;
    updateQuoteStatus: (id: string, status: Quote['status']) => void;
    deleteQuote: (id: string) => void;
    getQuotesByProduct: (productId: string) => Quote[];
    getQuotesByStatus: (status: Quote['status']) => Quote[];
    consumeNfcQuota: (quoteId: string, amount: number) => void;
    getRemainingNfcQuota: (quoteId: string) => number;
}

export const useQuoteStore = create<QuoteStore>()(
    persist(
        (set, get) => ({
            quotes: [],

            addQuote: (quoteData) => {
                const newQuote: Quote = {
                    ...quoteData,
                    id: `QT-${Date.now().toString().slice(-4)}`,
                    status: 'Pending',
                    createdAt: new Date(),
                };
                set((state) => ({
                    quotes: [newQuote, ...state.quotes],
                }));
            },

            updateQuoteStatus: (id, status) => {
                set((state) => ({
                    quotes: state.quotes.map((quote) =>
                        quote.id === id ? { ...quote, status } : quote
                    ),
                }));
            },

            deleteQuote: (id) => {
                set((state) => ({
                    quotes: state.quotes.filter((quote) => quote.id !== id),
                }));
            },

            getQuotesByProduct: (productId) => {
                return get().quotes.filter((quote) => quote.productId === productId);
            },

            getQuotesByStatus: (status) => {
                return get().quotes.filter((quote) => quote.status === status);
            },

            consumeNfcQuota: (quoteId, amount) => {
                set((state) => ({
                    quotes: state.quotes.map((q) =>
                        q.id === quoteId
                            ? { ...q, nfcLinksGenerated: (q.nfcLinksGenerated || 0) + amount }
                            : q
                    ),
                }));
            },

            getRemainingNfcQuota: (quoteId) => {
                const quote = get().quotes.find((q) => q.id === quoteId);
                if (!quote) return 0;
                return Math.max(0, quote.quantity - (quote.nfcLinksGenerated || 0));
            },
        }),
        {
            name: 'quote-storage',
        }
    )
);
