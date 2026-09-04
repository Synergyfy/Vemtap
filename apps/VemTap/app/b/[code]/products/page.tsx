'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePublicBusiness, usePublicBranch } from '@/services/public/hooks';
import { useCatalogueItemsPublic } from '@/services/catalogue/hooks';
import { formatNaira } from '@/components/home/mappers';

export default function BusinessProductsPage() {
    const params = useParams();
    const router = useRouter();
    const code = Array.isArray(params?.code) ? params.code[0] : params?.code || '';
    const [searchQuery, setSearchQuery] = useState('');

    const { data: branchData, isLoading: branchLoading } = usePublicBranch(code, !!code);
    const { data: businessByCode, isLoading: businessByCodeLoading } = usePublicBusiness(code, !!code);

    const rawBranchData = (branchData as any)?.data || branchData;
    const rawBusinessByCode = (businessByCode as any)?.data || businessByCode;

    const branchBusinessCode = rawBranchData?.business?.uniqueCode;
    const { data: businessByBranch } = usePublicBusiness(
        branchBusinessCode || '',
        !!branchBusinessCode && branchBusinessCode !== code
    );

    const rawBusinessByBranch = (businessByBranch as any)?.data || businessByBranch;
    const business = rawBusinessByCode?.id ? rawBusinessByCode : rawBusinessByBranch;
    const branch = rawBusinessByCode?.id ? null : rawBranchData || null;
    const businessSummary = rawBranchData?.business;
    const branches = useMemo(() => business?.branches || [], [business?.branches]);
    const mainBranch = useMemo(() => branches.find((item: any) => item.isMainBranch) || branches[0] || null, [branches]);
    const resolvedBranch = branch || mainBranch;
    const branchId = resolvedBranch?.id;

    const { data: productsData, isLoading: productsLoading } = useCatalogueItemsPublic(
        branchId || '',
        { itemType: 'product' as any }
    );

    const products = useMemo(() => {
        const items = (productsData as any)?.data || (Array.isArray(productsData) ? productsData : []);
        return items;
    }, [productsData]);

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const q = searchQuery.toLowerCase();
        return products.filter((p: any) =>
            p.name?.toLowerCase().includes(q) ||
            p.title?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        );
    }, [products, searchQuery]);

    const isLoading = branchLoading || businessByCodeLoading || productsLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f7f9fb' }}>
                <div className="w-12 h-12 rounded-full border-[3px] border-[#c2c6d7] border-t-[#0055c4] animate-spin" />
                <span className="mt-4 text-xs font-bold text-[#727786] uppercase tracking-[0.25em] animate-pulse">
                    Loading products...
                </span>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#f7f9fb', color: '#191c1e', fontFamily: 'Inter, sans-serif' }}>
            {/* TopAppBar */}
            <header
                className="fixed top-0 w-full z-50 flex items-center justify-between"
                style={{ background: '#f7f9fb', borderBottom: '1px solid #c2c6d7', padding: '0 20px', height: 56 }}
            >
                <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-full active:scale-95" style={{ color: '#0055c4' }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-[20px] font-bold truncate mx-4" style={{ color: '#0055c4' }}>Products</h1>
                <div className="w-8" />
            </header>

            {/* Main Content */}
            <main style={{ paddingTop: 56, paddingBottom: 80 }} className="max-w-md mx-auto px-5">
                {/* Search Bar */}
                <div className="relative w-full mt-6 mb-6">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#424655', fontSize: 20 }}>
                        search
                    </span>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-full text-[14px] focus:outline-none transition-colors"
                        style={{
                            background: '#f2f4f6',
                            border: '1px solid #c2c6d7',
                            color: '#191c1e',
                        }}
                        placeholder="Search products..."
                        type="text"
                    />
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product: any, idx: number) => {
                            const image = product.mainImage || product.image || product.galleryImages?.[0];
                            const price = product.calculatedPrice != null
                                ? product.calculatedPrice
                                : product.fixedPrice != null
                                    ? product.fixedPrice
                                    : null;

                            return (
                                <article
                                    key={product.id || idx}
                                    className="rounded-xl overflow-hidden shadow-sm flex flex-col active:scale-[0.97] transition-transform cursor-pointer"
                                    style={{ background: '#ffffff', border: '1px solid #c2c6d7' }}
                                >
                                    <div className="w-full aspect-square relative" style={{ background: '#f2f4f6' }}>
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={product.name || 'Product'}
                                                className="object-cover w-full h-full absolute inset-0"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[32px]" style={{ color: '#c2c6d7' }}>image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex flex-col gap-1 flex-1 justify-between">
                                        <h2 className="text-[14px] font-semibold line-clamp-2" style={{ color: '#191c1e' }}>
                                            {product.name || product.title || 'Product'}
                                        </h2>
                                        <p className="text-[20px] font-bold" style={{ color: '#0055c4' }}>
                                            {price != null ? formatNaira(price) : 'View Price'}
                                        </p>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-16 text-center">
                            <span className="material-symbols-outlined text-[48px] mb-3 block" style={{ color: '#c2c6d7' }}>inventory_2</span>
                            <p className="text-[14px] font-semibold" style={{ color: '#191c1e' }}>
                                {searchQuery ? 'No products match your search' : 'No products available'}
                            </p>
                            <p className="text-[13px] mt-1" style={{ color: '#727786' }}>
                                {searchQuery ? 'Try a different search term.' : 'Check back later for products.'}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
