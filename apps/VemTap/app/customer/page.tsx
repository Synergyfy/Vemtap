'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/customer/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
            <div className="flex flex-col items-center gap-4">
                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Redirecting to Dashboard...</p>
            </div>
        </div>
    );
}
