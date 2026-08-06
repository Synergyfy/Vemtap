import React from 'react';
import Modal from '@/components/ui/Modal';
import { AlertTriangle, Users, BarChart3, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerIdentificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function CustomerIdentificationModal({
    isOpen,
    onClose,
    onConfirm
}: CustomerIdentificationModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            showClose={true}
        >
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="size-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                        <AlertTriangle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">
                            Disable Customer Identification?
                        </h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                            Turning this off removes the requirement for customers to identify themselves when they tap your QR.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Important Implications:</p>
                    
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:border-amber-200">
                        <div className="size-8 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                            <Users size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Zero Customer Data</p>
                            <p className="text-[10px] text-gray-500 font-bold leading-normal">
                                You will no longer capture names, phone numbers, or emails of your walk-in customers.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:border-amber-200">
                        <div className="size-8 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                            <BarChart3 size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Broken Analytics</p>
                            <p className="text-[10px] text-gray-500 font-bold leading-normal">
                                It becomes impossible to track returning customers, visit frequency, or individual lifetime value.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:border-amber-200">
                        <div className="size-8 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Marketing Dead-end</p>
                            <p className="text-[10px] text-gray-500 font-bold leading-normal">
                                You won't be able to send marketing messages, loyalty rewards, or retarget these visitors.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
                    <p className="text-[10px] text-amber-700 font-bold leading-relaxed text-center italic">
                        "Identification is the bridge between a stranger and a loyal customer. Without it, your business is tapping in the dark."
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button 
                        onClick={onClose}
                        className="h-14 rounded-2xl bg-gray-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                    >
                        Keep Identification Active
                    </Button>
                    <button 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="h-12 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                    >
                        Yes, Disable & Lose Insights
                    </button>
                </div>
            </div>
        </Modal>
    );
}
