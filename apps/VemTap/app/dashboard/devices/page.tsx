'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDevices, useAddDevice, useUpdateDevice, useDeleteDevice } from '@/services/devices/hooks';
import { Device } from '@/services/devices/types';
import { notify } from '@/lib/notify';
import AddDeviceModal from '@/components/dashboard/AddDeviceModal';
import EditDeviceModal from '@/components/dashboard/EditDeviceModal';
import Link from 'next/link';
import LogoIcon from '@/components/brand/LogoIcon';
import DeviceQRModal from '@/components/dashboard/DeviceQRModal';

export default function DevicesPage() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    const { data: devices = [], isLoading } = useDevices();

    // Mutations
    const addDeviceMutation = useAddDevice();
    const updateDeviceMutation = useUpdateDevice();
    const deleteDeviceMutation = useDeleteDevice();

    const handleAddSubmit = (data: any) => {
        addDeviceMutation.mutate(data, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                notify.success('Device linked successfully!');
            },
            onError: () => notify.error('Failed to link device')
        });
    };

    const handleUpdateSubmit = (id: string, updates: any) => {
        updateDeviceMutation.mutate({ id, updates }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                notify.success('Device configuration updated');
            },
            onError: () => notify.error('Update failed')
        });
    };

    const handleDeleteSubmit = (id: string) => {
        deleteDeviceMutation.mutate(id, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                notify.success('Device removed permanently');
            },
            onError: () => notify.error('Deletion failed')
        });
    };

    const stats = [
        { label: 'Total Devices', value: devices.length, icon: 'nfc', color: 'blue' },
        { label: 'Active Now', value: devices.filter((d: Device) => d.status === 'active').length, icon: 'check_circle', color: 'green' },
        { label: 'Total Scans', value: devices.reduce((acc: number, d: Device) => acc + (d.totalScans || 0), 0).toLocaleString(), icon: 'touch_app', color: 'purple' },
        { label: 'Offline', value: devices.filter((d: Device) => d.status === 'inactive').length, icon: 'error', color: 'red' },
    ];

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 md:p-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-text-main mb-2">NFC Devices</h1>
                        <p className="text-text-secondary font-medium">Manage and monitor your tap devices</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <span className="material-icons-round">add</span>
                        Add Device
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'green' ? 'bg-green-50' :
                                    stat.color === 'red' ? 'bg-red-50' :
                                        stat.color === 'purple' ? 'bg-purple-50' :
                                            'bg-primary/10'
                                    }`}>
                                    <span className={`material-icons-round text-xl ${stat.color === 'green' ? 'text-green-600' :
                                        stat.color === 'red' ? 'text-red-600' :
                                            stat.color === 'purple' ? 'text-purple-600' :
                                                'text-primary'
                                        }`}>{stat.icon}</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">{stat.label}</p>
                                    <p className="text-2xl font-display font-bold text-text-main">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Devices Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.map((device: Device) => (
                        <div key={device.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                                        <LogoIcon size={32} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-main">{device.name}</h3>
                                        <p className="text-xs text-text-secondary font-medium">{device.code}</p>
                                    </div>
                                </div>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${device.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {device.status === 'active' ? '● Online' : '● Offline'}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-secondary font-medium">Location</span>
                                    <span className="text-sm font-bold text-text-main">{device.location}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-secondary font-medium">Total Scans</span>
                                    <span className="text-sm font-bold text-text-main">{(device.totalScans || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-secondary font-medium">Last Active</span>
                                    <span className="text-sm font-bold text-text-main">{device.lastActive}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        setSelectedDevice(device);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="flex-1 py-2 px-4 bg-gray-50 text-text-main font-bold rounded-lg hover:bg-gray-100 transition-colors text-sm cursor-pointer"
                                >
                                    Configure
                                </button>
                                <Link
                                    href={`/dashboard/devices/${device.id}`}
                                    className="flex-1 py-2 px-4 bg-primary/5 text-primary font-bold rounded-lg hover:bg-primary/10 transition-colors text-sm text-center flex items-center justify-center"
                                >
                                    View Stats
                                </Link>
                                <button
                                    onClick={() => {
                                        setSelectedDevice(device);
                                        setIsQRModalOpen(true);
                                    }}
                                    className="w-10 h-10 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-black transition-colors flex items-center justify-center"
                                    title="View QR Code"
                                >
                                    <span className="material-icons-round text-xl">qr_code_2</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Device Card */}
                    <div
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[280px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                            <span className="material-icons-round text-primary text-3xl">add</span>
                        </div>
                        <h3 className="font-bold text-text-main mb-2">Add New Device</h3>
                        <p className="text-sm text-text-secondary text-center">Register a new NFC tag to start capturing visitors</p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddDeviceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddSubmit}
                isLoading={addDeviceMutation.isPending}
            />

            {selectedDevice && (
                <EditDeviceModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedDevice(null);
                    }}
                    device={selectedDevice}
                    onSubmit={handleUpdateSubmit}
                    onDelete={handleDeleteSubmit}
                    isLoading={updateDeviceMutation.isPending || deleteDeviceMutation.isPending}
                />
            )}

            <DeviceQRModal
                isOpen={isQRModalOpen}
                onClose={() => {
                    setIsQRModalOpen(false);
                    setSelectedDevice(null);
                }}
                device={selectedDevice}
            />
        </>
    );
}
