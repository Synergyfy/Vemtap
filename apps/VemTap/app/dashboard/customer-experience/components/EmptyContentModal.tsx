import React from 'react';
import Modal from '@/components/ui/Modal';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, LucideIcon } from 'lucide-react';

interface EmptyContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
    icon?: LucideIcon;
}

export const EmptyContentModal: React.FC<EmptyContentModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    actionLabel,
    actionHref,
    icon: Icon = AlertCircle
}) => {
    const router = useRouter();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="p-6 flex flex-col items-center text-center">
                <div className="size-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-6 shadow-sm border border-amber-100">
                    <Icon size={32} />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                    {title}
                </h3>
                
                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[280px] mb-8">
                    {description}
                </p>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={() => router.push(actionHref)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                    >
                        {actionLabel}
                        <ArrowRight size={16} />
                    </button>
                    
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all cursor-pointer"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </Modal>
    );
};
