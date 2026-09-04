'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePublicBusiness, usePublicBranch } from '@/services/public/hooks';
import { useCatalogueItemsPublic } from '@/services/catalogue/hooks';
import { formatNaira } from '@/components/home/mappers';

export default function BusinessServicesPage() {
    const params = useParams();
    const router = useRouter();
    const code = Array.isArray(params?.code) ? params.code[0] : params?.code || '';

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

    const profileName = useMemo(() => {
        return business?.name || businessSummary?.name || branch?.business?.name || branch?.name || 'Business';
    }, [branch, business, businessSummary]);

    const profileLogo = useMemo(() => {
        return business?.logoUrl || businessSummary?.logoUrl || resolvedBranch?.logoUrl || '';
    }, [business, businessSummary, resolvedBranch?.logoUrl]);

    const { data: servicesData, isLoading: servicesLoading } = useCatalogueItemsPublic(
        branchId || '',
        { itemType: 'service' as any }
    );

    const services = useMemo(() => {
        const items = (servicesData as any)?.data || (Array.isArray(servicesData) ? servicesData : []);
        return items;
    }, [servicesData]);

    const isLoading = branchLoading || businessByCodeLoading || servicesLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f7f9fb' }}>
                <div className="w-12 h-12 rounded-full border-[3px] border-[#c2c6d7] border-t-[#0055c4] animate-spin" />
                <span className="mt-4 text-xs font-bold text-[#727786] uppercase tracking-[0.25em] animate-pulse">
                    Loading services...
                </span>
            </div>
        );
    }

    const STORE_NAV_ITEMS = [
        { icon: 'storefront', label: 'Overview', href: `/b/${code}` },
        { icon: 'local_offer', label: 'Deals', href: `/b/${code}/deals` },
        { icon: 'schedule', label: 'Hours', href: `/b/${code}/hours` },
        { icon: 'home_repair_service', label: 'Services', href: `/b/${code}/services` },
        { icon: 'inventory_2', label: 'Products', href: `/b/${code}/products` },
    ];

    return (
        <div className="min-h-screen" style={{ background: '#f7f9fb', color: '#191c1e', fontFamily: 'Inter, sans-serif' }}>
            {/* Desktop Header */}
            <header className="hidden md:flex fixed top-0 w-full z-50 flex-col" style={{ background: '#ffffff', borderBottom: '1px solid #e6e8ea' }}>
                <div className="flex items-center justify-between px-6 h-[60px] max-w-[1200px] mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#0055c4' }}>
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <Link href="/" className="flex items-center gap-2"><img src="/VEMTAP_PNG.png" alt="VemTap" className="h-8 w-auto" /></Link>
                        <div className="h-6 w-px bg-gray-200" />
                        <span className="text-[15px] font-bold text-gray-900">{profileName}</span>
                    </div>
                </div>
                <div className="border-t border-gray-100">
                    <nav className="max-w-[1200px] mx-auto px-6 flex items-center gap-1 h-[44px] overflow-x-auto no-scrollbar">
                        {STORE_NAV_ITEMS.map((item) => {
                            const isActive = item.href.includes('/services');
                            return (
                                <Link key={item.label} href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${isActive ? 'bg-[#0055c4]/10 text-[#0055c4]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full z-50 flex items-center justify-between" style={{ background: '#f7f9fb', borderBottom: '1px solid #c2c6d7', padding: '0 20px', height: 56 }}>
                <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-full active:scale-95" style={{ color: '#0055c4' }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-[20px] font-bold truncate mx-4" style={{ color: '#0055c4' }}>Business Profile</h1>
                <div className="w-8" />
            </header>

            {/* Main Content */}
            <main className="md:pt-[104px]" style={{ paddingTop: 56, paddingBottom: 80 }}>
                <div className="max-w-[1200px] mx-auto md:px-6">
                    {/* Business Header */}
                    <div className="text-center py-6 mb-4 md:text-left md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 md:p-6 md:mt-4">
                    {profileLogo ? (
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 mx-auto mb-3 shadow-sm" style={{ borderColor: '#066cf4' }}>
                            <img src={profileLogo} alt={profileName} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: '#eceef0', border: '2px solid #066cf4' }}>
                            <span className="material-symbols-outlined text-[40px]" style={{ color: '#727786' }}>storefront</span>
                        </div>
                    )}
                    <h2 className="text-[24px] font-semibold tracking-tight" style={{ color: '#191c1e' }}>{profileName}</h2>
                    <div className="flex items-center justify-center gap-1 mt-1" style={{ color: '#424655' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#0055c4' }}>verified</span>
                        <span className="text-[14px]">Verified Partner</span>
                    </div>
                </div>

                {/* Services Header */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined" style={{ color: '#0055c4' }}>spa</span>
                    <h3 className="text-[20px] font-semibold tracking-tight" style={{ color: '#191c1e' }}>Available Services</h3>
                </div>

                {/* Services List */}
                <div className="flex flex-col gap-4">
                    {services.length > 0 ? (
                        services.map((service: any, idx: number) => (
                            <div
                                key={service.id || idx}
                                className="rounded-xl p-4 shadow-sm relative overflow-hidden"
                                style={{ background: '#ffffff', border: '1px solid #c2c6d7' }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="text-[14px] font-semibold mb-1" style={{ color: '#191c1e' }}>
                                            {service.name || service.title || 'Service'}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[14px]" style={{ color: '#424655' }}>
                                            {service.duration && (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                                                    {service.duration}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[20px] font-bold" style={{ color: '#0055c4' }}>
                                            {service.price != null ? formatNaira(service.price) : 'Contact'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between items-center" style={{ borderTop: '1px solid #e6e8ea', paddingTop: 12 }}>
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-medium"
                                        style={{ background: '#d0e1fb', color: '#191c1e' }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event_available</span>
                                        Bookable
                                    </span>
                                    <button
                                        className="h-10 px-4 rounded-full text-[14px] font-semibold active:scale-95 transition-transform"
                                        style={{ background: '#0055c4', color: '#ffffff' }}
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-16 text-center">
                            <span className="material-symbols-outlined text-[48px] mb-3 block" style={{ color: '#c2c6d7' }}>home_repair_service</span>
                            <p className="text-[14px] font-semibold" style={{ color: '#191c1e' }}>No services available</p>
                            <p className="text-[13px] mt-1" style={{ color: '#727786' }}>Check back later for services.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
