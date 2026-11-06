import { redirect } from 'next/navigation';

// Legacy URL — the business landing page now lives at /business.
export default function BusinessLandingRedirect() {
    redirect('/business');
}