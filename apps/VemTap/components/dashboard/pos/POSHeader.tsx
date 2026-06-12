'use client';

import React from 'react';
import { Search, Scan, Zap, Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function POSHeader() {
    return (
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
            <div>
                <h1 className="text-xl font-black text-gray-900">Point Of Sale</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Scan size={20} className="text-gray-600" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Bell size={20} className="text-gray-600" />
                </Button>
            </div>
        </div>
    );
}
