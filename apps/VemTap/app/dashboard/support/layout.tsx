'use client';

import React from 'react';

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-full bg-[#f8fafb] overflow-hidden">
            
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
