'use client';

import React, { useEffect } from 'react';
import { X, Nfc, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Device } from '@/services/devices/types';

interface EditDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: string, updates: Partial<Device>) => void;
    onDelete: (id: string) => void;
    device: Device | null;
    isLoading?: boolean;
}

interface EditDeviceFormData {
    name: string;
    location: string;
    status: 'active' | 'inactive';
}

import Modal from '@/components/ui/Modal';

export default function EditDeviceModal({
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    device,
    isLoading
}: EditDeviceModalProps) {
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<EditDeviceFormData>();
    const currentStatus = watch('status');

    useEffect(() => {
        if (device) {
            reset({
                name: device.name,
                location: device.location,
                status: device.status
            });
        }
    }, [device, reset]);

    const handleFormSubmit = (data: EditDeviceFormData) => {
        if (device) {
            onSubmit(device.id, data);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen && !!device}
            onClose={handleClose}
            title="Configure Device"
            description={device?.code || 'Hardware Settings'}
            size="sm"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">
                            Display Name
                        </label>
                        <input
                            {...register('name', { required: 'Name is required' })}
                            type="text"
                            placeholder="e.g. Front Door"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all font-display"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">
                            Placement
                        </label>
                        <input
                            {...register('location', { required: 'Location is required' })}
                            type="text"
                            placeholder="Main Hall"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all"
                        />
                        {errors.location && (
                            <p className="text-red-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{errors.location.message}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 ml-1">
                        Current Status
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={`
                            flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all
                            ${currentStatus === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50/50 text-slate-400'}
                        `}>
                            <input {...register('status')} type="radio" value="active" className="hidden" />
                            <span className={`w-2 h-2 rounded-full ${currentStatus === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            <span className="text-xs font-bold uppercase tracking-widest">Online</span>
                        </label>
                        <label className={`
                            flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all
                            ${currentStatus === 'inactive' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-100 bg-slate-50/50 text-slate-400'}
                        `}>
                            <input {...register('status')} type="radio" value="inactive" className="hidden" />
                            <span className={`w-2 h-2 rounded-full ${currentStatus === 'inactive' ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
                            <span className="text-xs font-bold uppercase tracking-widest">Offline</span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Battery</p>
                        <div className="flex items-center gap-2">
                            <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${device && device.batteryLevel < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${device?.batteryLevel || 0}%` }}
                                ></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-900 tabular-nums">{device?.batteryLevel}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Active</p>
                        <p className="text-[10px] font-bold text-slate-900">{device?.lastActive}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>Save Configuration</>
                        )}
                    </button>

                    <div className="flex items-center justify-between gap-4 px-1 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (device) onDelete(device.id);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <Trash2 size={12} />
                            Remove Tag
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
