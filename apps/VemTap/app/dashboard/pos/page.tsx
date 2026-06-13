'use client';

import React from 'react';
import { POSHeader } from '@/components/dashboard/pos/POSHeader';
import { ProductGrid } from '@/components/dashboard/pos/ProductGrid';
import { CartPanel } from '@/components/dashboard/pos/CartPanel';
import { useCatalogueItems } from '@/services/catalogue/hooks';
import Spinner from '@/components/ui/Spinner';

export default function POSPage() {
    const { data: items = [], isLoading } = useCatalogueItems();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <POSHeader />
            <div className="p-4">
                <ProductGrid items={items} />
            </div>
            <CartPanel />
        </div>
    );
}
