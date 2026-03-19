'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToProfileSocials() {
    useEffect(() => {
        redirect('/dashboard/settings/profile?tab=socials');
    }, []);
    return null;
}
