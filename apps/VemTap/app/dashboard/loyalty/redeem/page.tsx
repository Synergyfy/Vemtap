"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedeemRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard/loyalty/redemptions');
    }, [router]);

    return (
        <div className="flex items-center justify-center p-24">
            <div className="animate-pulse text-gray-400 font-bold tracking-widest uppercase text-xs">
                Redirecting to Redemptions...
            </div>
        </div>
    );
}