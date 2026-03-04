'use client';

import React from 'react';
import { X, Nfc, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface AddDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: DeviceFormData) => void;
    isLoading?: boolean;
}

export interface DeviceFormData {
    name: string;
    type: 'Card' | 'Sticker' | 'Fob';
    code: string;
    location: string;
}

import Modal from '@/components/ui/Modal';

export default function AddDeviceModal({ isOpen, onClose, onSubmit, isLoading }: AddDeviceModalProps) {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<DeviceFormData>({
        defaultValues: {
            type: 'Card'
        }
    });

    const handleFormSubmit = (data: DeviceFormData) => {
        onSubmit(data);
        reset();
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Link New Device"
            description="Hardware Registration & Activation"
            size="sm"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">
                            Tag Name
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
                            Registration Code
                        </label>
                        <input
                            {...register('code', { required: 'Code is required' })}
                            type="text"
                            placeholder="NFC-000-00"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all uppercase font-display"
                        />
                        {errors.code && (
                            <p className="text-red-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{errors.code.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 ml-1">
                                Type
                            </label>
                            <select
                                {...register('type', { required: 'Type is required' })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white focus:border-primary/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="Card">PVC Card</option>
                                <option value="Sticker">Sticker</option>
                                <option value="Fob">Key Fob</option>
                            </select>
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
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50 flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                        <span className="text-[12px] font-bold text-amber-700">!</span>
                    </div>
                    <p className="text-[10px] text-amber-900 leading-relaxed font-semibold">
                        Ensure your physical tag is nearby. The code is usually found on the back of the device.
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 size={18} className="animate-spin text-white" />
                        ) : (
                            <>Confirm & Link Hardware</>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
}

