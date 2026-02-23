'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminDevicesApi } from '@/lib/api/admin';
import { Cpu, Link as LinkIcon, Search, Loader2 } from 'lucide-react';

export default function AdminActiveDevicesPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: devicesData, isLoading } = useQuery({
        queryKey: ['admin-active-devices'],
        queryFn: () => adminDevicesApi.getAll({ status: 'active', limit: 1000 }),
    });

    const devices = Array.isArray(devicesData) ? devicesData : (devicesData?.data || []);

    const filteredDevices = devices.filter((d: any) =>
        String(d.code || d.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.business?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">Active Fleet</h1>
                    <p className="text-text-secondary font-medium">Currently deployed and linked NFC hardware</p>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search active devices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Device</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Linked Venue</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Health</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Total Scans</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center">
                                        <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                                    </td>
                                </tr>
                            ) : filteredDevices.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-text-secondary font-medium">
                                        No active devices found.
                                    </td>
                                </tr>
                            ) : (
                                filteredDevices.map((device: any) => (
                                    <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                                    <Cpu size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-text-main">{device.name || 'Device'}</span>
                                                    <span className="text-[10px] font-mono text-text-secondary">{device.code}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-text-main">
                                            <div className="flex items-center gap-2">
                                                <LinkIcon size={12} className="text-primary" />
                                                {device.business?.name || 'Linked Venue'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${device.batteryLevel > 20 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${device.batteryLevel}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-text-secondary">{device.batteryLevel}%</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-text-main">
                                            {device.totalScans || 0}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
