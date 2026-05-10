"use client";

import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const MOCK_LOGS = [
    { id: 1, type: 'Warning', biz: 'Tech Hub', action: 'Excessive Point Issuance', detail: '20,000 points issued to 1 user in 5 mins', time: '2h ago' },
    { id: 2, type: 'Alert', biz: 'Metro Grocery', action: 'Unusual Redemption Pattern', detail: '50 redemptions within 10 minutes at Branch #4', time: '5h ago' },
    { id: 3, type: 'Log', biz: 'Brew & Co', action: 'Mass Point Adjustment', detail: 'Admin adjusted 500 user balances', time: '12h ago' },
    { id: 4, type: 'Warning', biz: 'Urban Salon', action: 'Duplicate QR Scan', detail: 'Same QR code scanned twice within 30 seconds', time: '1d ago' },
];

export default function AdminMonitoringLoyaltyPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                        placeholder="Search logs..." 
                        className="pl-11 h-12 rounded-2xl border-gray-100 bg-white shadow-sm"
                    />
                </div>
                <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-100 gap-2 font-bold">
                    <Filter size={18} /> Filter by Severity
                </Button>
            </div>

            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                    <ShieldAlert size={20} className="text-red-500" />
                    <h2 className="font-bold text-gray-900">Security & Activity Audit</h2>
                </div>
                
                <div className="divide-y divide-gray-50">
                    {MOCK_LOGS.map((log) => (
                        <div key={log.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors group">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-2xl shrink-0 ${
                                    log.type === 'Alert' ? 'bg-red-50 text-red-600' : 
                                    log.type === 'Warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {log.type === 'Log' ? <Clock size={20} /> : <AlertTriangle size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="rounded-lg text-[10px] uppercase font-bold tracking-wider">
                                            {log.biz}
                                        </Badge>
                                        <span className="text-sm font-bold text-gray-900">{log.action}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{log.detail}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 ml-auto md:ml-0">
                                <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{log.time}</span>
                                <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5 rounded-xl px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Investigate
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
