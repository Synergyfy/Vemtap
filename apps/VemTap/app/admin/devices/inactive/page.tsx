'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminDevicesApi } from '@/lib/api/admin';
import { Cpu, Search, Loader2, Package } from 'lucide-react';

export default function AdminInactiveDevicesPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: devicesData, isLoading } = useQuery({
        queryKey: ['admin-inactive-devices'],
        queryFn: () => adminDevicesApi.getAll({ status: 'inactive', limit: 1000 }),
    });

    const devices = Array.isArray(devicesData) ? devicesData : (devicesData?.data || []);

    const filteredDevices = devices.filter((d: any) =>
        String(d.code || d.id).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">Inactive Inventory</h1>
                    <p className="text-text-secondary font-medium">Unlinked hardware ready for provisioning</p>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search inventory..."
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
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Device ID</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Type</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Created</th>
                                <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Status</th>
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
                                        No inactive hardware in inventory.
                                    </td>
                                </tr>
                            ) : (
                                filteredDevices.map((device: any) => (
                                    <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                                    <Package size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-text-main">{device.name || 'Unprovisioned'}</span>
                                                    <span className="text-[10px] font-mono text-text-secondary">{device.code}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-gray-100 px-2 py-1 rounded">
                                                {device.type || 'Card'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-text-secondary">
                                            {new Date(device.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-500">
                                                Available
                                            </span>
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
