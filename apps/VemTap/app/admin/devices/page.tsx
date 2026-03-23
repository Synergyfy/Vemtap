'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminDevicesApi, adminBusinessesApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { Plus, Search, Filter, Download, MoreVertical, Trash2, Cpu, Battery, Activity, Link as LinkIcon, Edit3, Copy } from 'lucide-react';
import EditDeviceModal from '@/components/dashboard/EditDeviceModal';
import { Device } from '@/services/devices/types';
import { useSearchParams, useRouter } from 'next/navigation';

const PAGE_SIZE = 10;

const extractDevices = (payload: any): { items: any[]; total: number; page: number; lastPage: number } => {
    const roots = [payload, payload?.data, payload?.data?.data, payload?.result, payload?.payload];
    const meta = payload?.meta || payload?.data?.meta || payload?.pagination || payload?.data?.pagination;
    const total = Number(meta?.total || payload?.total || payload?.data?.total || 0) || 0;
    const page = Number(meta?.page || 1) || 1;
    const lastPage = Number(meta?.lastPage || Math.max(1, Math.ceil((total || 0) / PAGE_SIZE))) || 1;

    for (const root of roots) {
        if (Array.isArray(root)) return { items: root, total, page, lastPage };
        if (!root) continue;
        const listKeys = ['devices', 'items', 'rows', 'results', 'list', 'data'];
        for (const key of listKeys) {
            if (Array.isArray(root[key])) return { items: root[key], total, page, lastPage };
        }
    }

    return { items: [], total, page, lastPage };
};

export default function AdminDevicesPage() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const router = useRouter();
    const statusParam = searchParams.get('status') || 'all';

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState(statusParam);
    const [filterBusiness, setFilterBusiness] = useState('');
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<any>(null);
    const [origin, setOrigin] = useState('https://vemtap.com');
    const [currentPage, setCurrentPage] = useState(1);
    const [businessesList, setBusinessesList] = useState<any[]>([]);
    const [filterBusinessesList, setFilterBusinessesList] = useState<any[]>([]);
    const [isBusinessesLoading, setIsBusinessesLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    useEffect(() => {
        setFilterStatus(statusParam);
    }, [statusParam]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus, filterBusiness]);

    const handleStatusChange = (newStatus: string) => {
        setFilterStatus(newStatus);
        const params = new URLSearchParams(searchParams.toString());
        if (newStatus === 'all') {
            params.delete('status');
        } else {
            params.set('status', newStatus);
        }
        router.push(`/admin/devices?${params.toString()}`);
    };

    useEffect(() => {
        const fetchAllBusinesses = async () => {
            setIsBusinessesLoading(true);
            try {
                // Fetch first 100 businesses for the dropdowns
                const data = await adminBusinessesApi.getAll({ limit: 100, status: 'active' });
                const roots = [data, data?.data, data?.data?.data, data?.result, data?.payload];
                let items = [];
                for (const root of roots) {
                    if (Array.isArray(root)) { items = root; break; }
                    if (!root) continue;
                    const listKeys = ['businesses', 'items', 'rows', 'results', 'list', 'data'];
                    const key = listKeys.find(k => Array.isArray(root[k]));
                    if (key) { items = root[key]; break; }
                }
                setBusinessesList(items);
                setFilterBusinessesList(items);
            } catch (err: any) {
                console.error('Failed to fetch businesses for dropdown', err);
            } finally {
                setIsBusinessesLoading(false);
            }
        };

        fetchAllBusinesses();
    }, []);

    // Fetch Devices from live API
    const { data: devicesData, isLoading: isDevicesLoading } = useQuery({
        queryKey: ['admin-devices', searchQuery, filterStatus, filterBusiness, currentPage],
        queryFn: () =>
            adminDevicesApi.getAll({
                search: searchQuery || undefined,
                status: filterStatus === 'all' ? undefined : filterStatus,
                businessId: filterBusiness || undefined,
                page: currentPage,
                limit: PAGE_SIZE,
            }),
    });

    // Fetch Stats from live API
    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ['admin-device-stats'],
        queryFn: () => adminDevicesApi.getStats(),
    });

    const isLoading = isDevicesLoading || isStatsLoading;
    const parsedDevices = extractDevices(devicesData);
    const rawDevices = parsedDevices.items;

    // Map devices to the structure expected by the UI
    const devices = rawDevices.map((d: any) => ({
        ...d,
        assignedTo: d.business?.name || d.businessId || 'Unassigned',
        batteryLevel: d.batteryLevel ?? 100,
        lastActive: d.lastActive ? new Date(d.lastActive).toLocaleDateString() : 'Never',
    }));

    const addDeviceMutation = useMutation({
        mutationFn: adminDevicesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-devices'] });
            setIsRegisterModalOpen(false);
            notify.success('Device registered and provisioned successfully');
        },
        onError: (err: any) => {
            notify.error(err.message || 'Failed to register device. Please check the Serial ID.');
        }
    });

    const updateDeviceMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) =>
            adminDevicesApi.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-devices'] });
            setEditingDevice(null);
            notify.success('Device configuration updated');
        },
        onError: (err: any) => {
            notify.error(err.message || 'Failed to update device configuration');
        }
    });

    const deleteDeviceMutation = useMutation({
        mutationFn: adminDevicesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-devices'] });
            setEditingDevice(null);
            notify.success('Device decommissioned successfully');
        },
        onError: (err: any) => {
            notify.error(err.message || 'Failed to decommission device');
        }
    });

    const handleRegisterDevice = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const deviceData = {
            code: formData.get('code') as string, // Backend relies on code initially
            name: formData.get('name') as string || 'New Device',
            type: formData.get('type') as string,
            businessId: formData.get('businessId') as string || undefined,
        };

        if (!deviceData.businessId) delete deviceData.businessId;

        addDeviceMutation.mutate(deviceData);
    };

    const handleDeleteDevice = (id: string) => {
        if (window.confirm(`Are you sure you want to decommission device? This action cannot be undone.`)) {
            deleteDeviceMutation.mutate(id);
        }
    };

    const handleUpdateDevice = (id: string, updates: any) => {
        updateDeviceMutation.mutate({ id, updates });
    };

    const stats = [
        { label: 'Total Hardware', value: statsData?.total?.toLocaleString() || '0', icon: 'nfc', color: 'blue' },
        { label: 'Active Links', value: statsData?.active?.toLocaleString() || '0', icon: 'check_circle', color: 'green' },
        { label: 'Inventory', value: statsData?.inventory?.toLocaleString() || '0', icon: 'inventory_2', color: 'orange' },
        { label: 'Alerts', value: statsData?.alerts?.toLocaleString() || '0', icon: 'battery_alert', color: 'red' },
    ];

    const totalItems = parsedDevices.total || devices.length;
    const totalPages = Math.max(1, parsedDevices.lastPage || Math.ceil(totalItems / PAGE_SIZE) || 1);

    const handleExportCSV = () => {
        if (devices.length === 0) {
            notify.error('No devices to export');
            return;
        }

        const headers = ['ID', 'Name', 'Code (UID)', 'Type', 'Assigned To', 'Battery Level', 'Total Scans', 'Last Active', 'Status'];
        const rows = devices.map((d: any) => [
            d.id,
            d.name || 'N/A',
            d.code || 'N/A',
            d.type || 'Card',
            d.assignedTo || 'Unassigned',
            `${d.batteryLevel}%`,
            d.totalScans || 0,
            d.lastActive || 'Never',
            d.status || 'N/A',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `devices-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        notify.success('Devices exported successfully');
    };

    return (
        <>
            <div className="p-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-text-main mb-2">Device Fleet Management</h1>
                        <p className="text-text-secondary font-medium">Provision and manage hardware tokens across all businesses</p>
                    </div>
                    <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Plus size={18} />
                        Provision New Device
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'green' ? 'bg-green-50 text-green-600' :
                                    stat.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                                        stat.color === 'red' ? 'bg-red-50 text-red-600' :
                                            'bg-blue-50 text-blue-600'
                                    }`}>
                                    <span className="material-icons-round text-xl">{stat.icon}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">{stat.label}</p>
                                    <p className="text-2xl font-display font-bold text-text-main">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by Device UID or assigned venue..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active/Linked</option>
                                <option value="inactive">Available</option>
                            </select>
                            <select
                                value={filterBusiness}
                                onChange={(e) => setFilterBusiness(e.target.value)}
                                className="h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">All Businesses</option>
                                {filterBusinessesList.map((biz: any) => (
                                    <option key={biz.id} value={biz.id}>{biz.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleExportCSV}
                                className="h-12 px-6 bg-white border border-gray-200 text-text-main font-bold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Download size={18} />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Devices Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Device ID (UID)</th>
                                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Form Factor</th>
                                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Linked Venue</th>
                                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Tap Link</th>
                                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Health</th>
                                    <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Activity</th>
                                    <th className="text-right py-4 px-6 text-xs font-black uppercase tracking-wider text-text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : devices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-text-secondary font-medium">
                                            No devices found in the current view.
                                        </td>
                                    </tr>
                                ) : (
                                    devices.map((device: any) => (
                                        <tr key={device.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                                                        <Cpu size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-text-main tracking-tight">{device.name}</span>
                                                        <span className="text-[10px] font-mono text-text-secondary">{device.code}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                                                    {device.type || 'Card'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {device.assignedTo === 'Unassigned' ? (
                                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <span className="size-1.5 rounded-full bg-gray-300" />
                                                        Unlinked
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <LinkIcon size={12} className="text-primary" />
                                                        <span className="text-sm font-bold text-text-main">{device.assignedTo}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-text-secondary truncate max-w-[120px]">
                                                        {origin.replace(/^https?:\/\//, '')}/tap/{device.code || device.id}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${origin}/tap/${device.code || device.id}`);
                                                            notify.success('Link copied');
                                                        }}
                                                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-primary"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 max-w-[60px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${device.batteryLevel > 20 ? 'bg-green-500' : 'bg-red-500'}`}
                                                            style={{ width: `${device.batteryLevel}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-text-secondary">{device.batteryLevel}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-text-main">{device.totalScans || 0} Scans</span>
                                                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Last: {device.lastActive}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setEditingDevice(device)}
                                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Edit Configuration"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => notify.info('Remote diagnostics initiated...')}
                                                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                        title="Diagnostics"
                                                    >
                                                        <Activity size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDevice(device.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Decommission"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-xs text-text-secondary font-black uppercase tracking-widest">
                            {isLoading ? 'Loading...' : `${totalItems} device${totalItems !== 1 ? 's' : ''} total`}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                                className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                            >
                                Prev
                            </button>
                            <span className="text-xs font-bold text-text-secondary">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Register Modal */}
            {
                isRegisterModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsRegisterModalOpen(false)}></div>
                        <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-text-main">Device Provisioning</h2>
                                    <p className="text-sm text-text-secondary font-medium">Add new hardware to the global fleet</p>
                                </div>
                                <button onClick={() => setIsRegisterModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Plus size={24} className="rotate-45 text-text-secondary" />
                                </button>
                            </div>

                            <form onSubmit={handleRegisterDevice} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Device Name</label>
                                    <input
                                        name="name"
                                        required
                                        placeholder="e.g. Front Door Scanner"
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all text-sm font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Unique Serial Code (UID)</label>
                                    <div className="relative">
                                        <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            name="code"
                                            required
                                            placeholder="Serial Number (e.g. SN-XXXX-XXXX)"
                                            className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all font-mono text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Hardware Form Factor</label>
                                    <select
                                        name="type"
                                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all font-bold text-sm"
                                    >
                                        <option value="Card">Premium NFC Card</option>
                                        <option value="Sticker">Smart Sticker</option>
                                        <option value="Fob">Rugged Key Fob</option>
                                        <option value="Plate">Metal Venue Plate</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1">Assign to Business</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            name="businessId"
                                            className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all font-bold text-sm appearance-none"
                                        >
                                            <option value="">Global Inventory (Unassigned)</option>
                                            {businessesList.map((biz: any) => (
                                                <option key={biz.id} value={biz.id}>
                                                    {biz.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">Select a business to link this device immediately</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={addDeviceMutation.isPending}
                                    className="w-full h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 mt-4 active:scale-95 disabled:opacity-50"
                                >
                                    {addDeviceMutation.isPending ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Cpu size={20} />
                                            Authorize & Link Device
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            <EditDeviceModal
                isOpen={!!editingDevice}
                onClose={() => setEditingDevice(null)}
                onSubmit={handleUpdateDevice}
                onDelete={handleDeleteDevice}
                device={editingDevice as any}
                isLoading={updateDeviceMutation.isPending || deleteDeviceMutation.isPending}
            />
        </>
    );
}
