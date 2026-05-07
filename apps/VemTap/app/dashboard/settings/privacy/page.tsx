'use client';

import React from 'react';

/**
 * DEPRECATED: This page has been migrated to /dashboard/compliance?tab=privacy
 * The code below is kept for reference as requested.
 * 
 * --- OLD CODE START ---
 * 
 * import PageHeader from '@/components/dashboard/PageHeader';
 * 
 * export default function PrivacySettingsPage() {
 *     return (
 *         <div className="p-8 max-w-4xl mx-auto">
 *             <PageHeader
 *                 title="Privacy & Data Control"
 *                 description="Manage how your customer data is stored and used"
 *                 actions={
 *                     <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20">
 *                         Save Changes
 *                     </button>
 *                 }
 *             />
 * 
 *             <div className="space-y-8">
 *                 <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
 *                     <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
 *                         <h3 className="font-display font-bold text-text-main">Data Retention Policy</h3>
 *                     </div>
 *                     <div className="p-8 space-y-6">
 *                         <div className="space-y-2">
 *                             <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Automatically Delete Customer Data After</label>
 *                             <select className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none">
 *                                 <option>Never (Retain indefinitely)</option>
 *                                 <option>6 Months of inactivity</option>
 *                                 <option>1 Year of inactivity</option>
 *                                 <option>2 Years of inactivity</option>
 *                             </select>
 *                         </div>
 *                     </div>
 *                 </div>
 *                 ... (Refer to git history or Legal & Compliance page for full implementation)
 *             </div>
 *         </div>
 *     );
 * }
 * 
 * --- OLD CODE END ---
 */

export default function PrivacySettingsPage() {
    return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <h2 className="text-2xl font-display font-bold text-text-main">Page Migrated</h2>
            <p className="text-text-secondary italic max-w-md">
                The Privacy & Data settings have been moved to the centralized 
                <br />
                <a href="/dashboard/compliance?tab=privacy" className="text-primary font-bold underline hover:text-primary-hover transition-colors">
                    Legal & Compliance
                </a> 
                <br />
                dashboard for better accessibility.
            </p>
        </div>
    );
}
