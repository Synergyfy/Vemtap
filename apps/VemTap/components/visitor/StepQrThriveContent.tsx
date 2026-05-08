import React from 'react';
import { motion } from 'framer-motion';
import { 
    ChevronLeft
} from 'lucide-react';
import { presets } from './presets';
import DynamicView from '@/components/qr-thrive/DynamicView';

interface StepQrThriveContentProps {
    qrCode: any;
    onBack: () => void;
}

export const StepQrThriveContent: React.FC<StepQrThriveContentProps> = ({
    qrCode,
    onBack
}) => {
    if (!qrCode || !qrCode.data) {
        return (
            <div className={presets.card}>
                <div className="text-center py-20 px-6">
                    <p className="text-base font-bold text-slate-900">Oops! Content not found.</p>
                    <button onClick={onBack} className="mt-4 text-xs font-black text-primary uppercase underline underline-offset-4">Go back</button>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-full max-w-lg mx-auto relative h-full flex flex-col"
        >
            <div className="absolute top-4 left-4 z-50">
                <button
                    onClick={onBack}
                    className="size-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition-all group"
                >
                    <ChevronLeft className="size-5 text-slate-900 group-hover:text-primary transition-colors" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar rounded-[2.5rem] bg-white shadow-2xl overflow-hidden p-6">
                <DynamicView data={qrCode.data} embedded={true} shortId={qrCode.shortId} />
            </div>
        </motion.div>
    );
};
