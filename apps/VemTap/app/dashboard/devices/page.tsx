'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Loader2 } from 'lucide-react';

export default function DevicesPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/business-link');
    }, [router]);

    return (
        <div className="p-8 min-h-[60vh] flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-primary mb-4" size={40} />
            <p className="text-text-secondary font-medium">Redirecting to Business Link...</p>
            <p className="text-sm text-text-secondary mt-2">All device management is now in the Business Link Hub</p>
        </div>
    );
}

