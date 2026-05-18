import React from 'react';
import { redirect } from 'next/navigation';
import { fetchContextByUsername, fetchDeviceByCode } from '@/lib/api/devices';
import BusinessPublicPageClient from './BusinessPublicPageClient';

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BusinessPublicPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const sParams = await searchParams;
    const queryCode = sParams.code as string | undefined;

    let businessData: any = null;
    let isUsernameMode = false;

    // 1. Try treating slug as a username first (Server-side fetch)
    try {
        const usernameContext = await fetchContextByUsername(slug);
        if (usernameContext) {
            businessData = usernameContext;
            isUsernameMode = true;
        }
    } catch (err) {
        // Not a valid username or error, proceed to check device code
        console.log('Not a username context in server component, checking for device code');
    }

    // 2. Handle Auto-Redirect Logic for Single QR Code
    if (isUsernameMode && businessData) {
        const ublSequence = businessData.branch?.engagement?.ublSequence || [];
        
        // If exactly one item is configured and it's a QR code, redirect immediately
        if (ublSequence.length === 1 && ublSequence[0].startsWith('qr-')) {
            const shortId = ublSequence[0].replace('qr-', '');
            // We redirect to the /s/[id] proxy which handles the actual scan recording and final destination
            redirect(`/s/${shortId}`);
        }
    }

    // 3. Fallback to client-side for complex journeys or if not a username
    // If we have a device code in query, we can try to fetch it here too to avoid client-side loading
    if (!isUsernameMode && queryCode) {
        try {
            businessData = await fetchDeviceByCode(queryCode);
        } catch (err) {
            console.error('Failed to load business data by code server-side:', err);
        }
    }

    return (
        <BusinessPublicPageClient 
            slug={slug} 
            initialData={businessData} 
        />
    );
}
