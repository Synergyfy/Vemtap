'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import React, { Suspense } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { fetchDeviceByCode } from '@/lib/api/devices';

function ChatRedirectContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const code = params.code as string;
    const [status, setStatus] = useState<'checking' | 'redirecting' | 'error'>('checking');

    useEffect(() => {
        const handleRedirect = async () => {
            if (!code) return;

            // Prepare target chat URL
            const targetParams = new URLSearchParams();
            targetParams.append('businessId', code);
            const visitorId = searchParams.get('v');
            const visitorName = searchParams.get('n');
            if (visitorId) targetParams.append('v', visitorId);
            if (visitorName) targetParams.append('n', visitorName);
            targetParams.append('source', 'whatsapp');
            
            const chatUrl = `/customer/messaging/chat?${targetParams.toString()}`;

            // Check if user is a logged-in customer
            const isCustomer = isAuthenticated && user?.role?.toLowerCase() === 'customer';

            if (isCustomer) {
                // Already a customer - go straight to chat
                router.replace(chatUrl);
            } else {
                // Not logged in or not a customer - send to tap journey to register/identify
                try {
                    // 1. Try to fetch as a business first
                    let businessData: any = null;
                    let targetCode = code;

                    try {
                        businessData = await api.get(`/public/businesses/code/${code}`);
                    } catch (e) {
                        try {
                            const branchData = await api.get(`/public/branches/code/${code}`);
                            if (branchData) {
                                businessData = branchData.business;
                                // If it's a branch, we might need a device code for the tap journey, 
                                // but for now let's hope the journey handles business/branch codes or we can fallback.
                            }
                        } catch (e2) {
                            // Finally try device info
                            const deviceData = await fetchDeviceByCode(code);
                            if (deviceData) {
                                businessData = deviceData.business;
                            }
                        }
                    }

                    if (businessData) {
                        const slug = businessData.slug || businessData.uniqueCode || 'business';
                        // Redirect to the NFC tap journey with a redirect parameter
                        // Note: /[slug]/[code] might expect a DEVICE code. 
                        // If 'code' is a business code, the journey might need adjustment to handle it.
                        const tapUrl = `/${slug}/${code}?redirect=${encodeURIComponent(chatUrl)}&source=whatsapp-bridge`;
                        router.replace(tapUrl);
                    } else {
                        console.error('Could not resolve business/branch/device for code:', code);
                        setStatus('error');
                    }
                } catch (err) {
                    console.error('Failed to resolve business for chat redirect:', err);
                    setStatus('error');
                }
            }
        };

        handleRedirect();
    }, [code, isAuthenticated, user, searchParams, router]);

    if (status === 'error') {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="text-center p-8">
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Chat Link</h1>
                    <p className="text-slate-500 text-sm mb-6">We couldn't find the business associated with this chat code.</p>
                    <button onClick={() => router.push('/')} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="size-12 border-[3px] border-slate-200 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-500 animate-pulse">
                    {isAuthenticated ? 'Navigating to chat...' : 'Connecting to business...'}
                </p>
            </div>
        </div>
    );
}

export default function ChatRedirectPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-[3px] border-slate-200 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-semibold text-slate-500">Loading...</p>
                </div>
            </div>
        }>
            <ChatRedirectContent />
        </Suspense>
    );
}
