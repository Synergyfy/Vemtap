'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PrivacySettingsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/compliance?tab=privacy');
    }, [router]);

    return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <h2 className="text-xl font-display font-bold text-text-main">Redirecting to Privacy & Data Controls...</h2>
            <p className="text-text-secondary text-xs italic max-w-md">
                Privacy settings have been consolidated under{' '}
                <a href="/dashboard/compliance?tab=privacy" className="text-primary font-bold underline">
                    Legal & Compliance
                </a>.
            </p>
        </div>
    );
}
