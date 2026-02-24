'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone } from 'lucide-react';

export default function DevicesPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/nfc-manager');
    }, [router]);

    return (
        <div className="p-8 min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-text-secondary font-medium">Redirecting to NFC Manager...</p>
            <p className="text-sm text-text-secondary mt-2">All device management is now in the NFC Asset Hub</p>
        </div>
    );
}
