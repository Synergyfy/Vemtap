import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    showBack?: boolean;
}

export default function PageHeader({ title, description, actions, showBack = false }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div className="mb-8 sticky top-16 md:top-0 z-30 bg-gray-50/90 md:bg-gray-50 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {showBack && (
                        <button 
                            onClick={() => router.back()} 
                            className="size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-all active:scale-95 shadow-sm shrink-0"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-none">{title}</h1>
                        {description && (
                            <p className="text-gray-500 font-medium text-sm mt-1">{description}</p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
