'use client';

import React from 'react';
import { Smartphone, Sparkles } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';

export default function DiscoveryPage() {
    return (
        <div className="p-8 pb-32 max-w-5xl mx-auto">
            <PageHeader 
                title="Discovery Network" 
                description="Expand your reach and attract new customers."
            />
            
            <div className="mt-8 bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative">
                    <Smartphone size={40} className="text-[#066CF4]" />
                    <div className="absolute -top-2 -right-2 bg-yellow-100 text-yellow-600 p-1.5 rounded-full">
                        <Sparkles size={16} />
                    </div>
                </div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#066CF4] rounded-full text-sm font-bold mb-6">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#066CF4] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#066CF4]"></span>
                    </span>
                    Coming Soon
                </div>
                
                <h2 className="text-3xl font-black text-gray-900 mb-4 max-w-xl">
                    Reach More Customers with Vemtap Discovery
                </h2>
                
                <p className="text-gray-500 text-lg max-w-2xl leading-relaxed mb-8">
                    The Discovery Network will allow your business to reach more customers by featuring your promotions, offers, and business profile across the entire Vemtap ecosystem. Connect with locals looking for exactly what you offer.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full text-left mt-8">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="font-black text-gray-900 mb-2">Promote Offers</div>
                        <div className="text-sm text-gray-500">Push your best deals directly to nearby Vemtap users.</div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="font-black text-gray-900 mb-2">Track Engagement</div>
                        <div className="text-sm text-gray-500">See exactly how many people view and click your profile.</div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="font-black text-gray-900 mb-2">Boost Visibility</div>
                        <div className="text-sm text-gray-500">Stand out in local search results and category listings.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
