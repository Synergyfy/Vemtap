'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';

export default function IntegrationsPage() {
    const integrations = [
        { name: 'Square POS', desc: 'Sync customer purchase data with your loyalty program.', icon: 'point_of_sale', status: 'Connect', color: 'blue' },
        { name: 'Mailchimp', desc: 'Sync visitor emails to your marketing segments.', icon: 'email', status: 'Connect', color: 'yellow' },
        { name: 'Shopify', desc: 'Track online vs offline visitor behavior.', icon: 'shopping_bag', status: 'Connect', color: 'indigo' },
        { name: 'Zapier', desc: 'Connect VemTap with 5000+ other web applications.', icon: 'bolt', status: 'Connect', color: 'orange' },
    ];

    return (
        <div className="p-8">
            <PageHeader
                title="Integrations"
                description="Connect VemTap with your favorite tools and platforms"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((app, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-${app.color}-50 flex items-center justify-center text-${app.color}-600`}>
                                <span className="material-icons-round text-2xl">{app.icon}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${app.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {app.status}
                            </span>
                        </div>
                        <h3 className="text-lg font-display font-bold text-text-main mb-1">{app.name}</h3>
                        <p className="text-sm text-text-secondary font-medium leading-relaxed flex-1">{app.desc}</p>

                        <button className={`mt-6 py-2.5 rounded-xl font-bold text-sm transition-all ${app.status === 'Connected'
                            ? 'bg-gray-50 text-text-main border border-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
                            : 'bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20'
                            }`}>
                            {app.status === 'Connected' ? 'Disconnect' : 'Setup Integration'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-12 bg-gray-900 rounded-3xl p-12 text-center text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <span className="material-icons-round text-[200px]">api</span>
                </div>
                <div className="relative z-10 max-w-lg mx-auto">
                    <h2 className="text-3xl font-display font-bold mb-4 tracking-tight">Looking for a custom API?</h2>
                    <p className="text-gray-400 font-medium mb-8">Access our full developer documentation to build your own custom integrations and webhooks.</p>
                    <button className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all">
                        View API Docs
                    </button>
                </div>
            </div>
        </div>
    );
}
