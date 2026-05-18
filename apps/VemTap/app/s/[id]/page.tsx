'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DynamicView from '@/components/qr-thrive/DynamicView';
import { qrThriveApi } from '@/services/qr-thrive/api';


export default function QRShortLinkPage() {
  const params = useParams();
  const router = useRouter();
  const shortId = params.id as string;

  const [qrCode, setQrCode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const data = qrCode?.data;
  const qrType = qrCode?.type;

  useEffect(() => {
    if (!shortId) return;

    const fetchData = async () => {
      // 1. Check localStorage for fast preview (used by wizard preview)
      const stored = localStorage.getItem(`qr_data_${shortId}`);
      if (stored) {
        try {
          setQrCode({ data: JSON.parse(stored) });
          setLoading(false);
          return;
        } catch (e) {
          // Invalid stored data, continue to fetch
        }
      }

      // 2. Record scan & fetch from VemTap Proxy API
      try {
        // Hit the scan endpoint on our backend to record the scan
        const scanUrl = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/qr-thrive/scan/${shortId}`;
        
        try {
          await fetch(scanUrl, { redirect: 'manual' });
        } catch {
          // Scan recording failed silently — non-blocking
        }

        // Fetch public QR code data via proxy
        const fullQr = await qrThriveApi.getPublicQRCode(shortId);
        if (fullQr) {
          setQrCode(fullQr);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error('Failed to fetch QR data:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shortId]);

  // Handle direct redirect types as soon as data is available
  useEffect(() => {
    if (!data) return;

    const directRedirectTypes = ['url', 'whatsapp', 'email', 'phone', 'sms'];
    const vemtapDomains = ['vemtap.com', 'localhost:3000', 'vemtap.vercel.app'];

    if (directRedirectTypes.includes(qrType)) {
      let targetUrl = '';

      switch (qrType) {
        case 'url':
          targetUrl = data.url || '';
          break;
        case 'whatsapp': {
          const phoneNumber = data.whatsapp?.phoneNumber
            ? (data.whatsapp?.countryCode || '').replace(/\D/g, '') +
              data.whatsapp.phoneNumber.replace(/\D/g, '').replace(/^0+/, '')
            : (data.whatsapp?.number || '').replace(/\D/g, '');
          targetUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(data.whatsapp?.message || '')}`;
          break;
        }
        case 'email':
          targetUrl = `mailto:${data.email?.address}?subject=${encodeURIComponent(data.email?.subject || '')}&body=${encodeURIComponent(data.email?.body || '')}`;
          break;
        case 'phone':
          targetUrl = `tel:${data.phone?.number}`;
          break;
        case 'sms':
          targetUrl = `sms:${data.sms?.number}?body=${encodeURIComponent(data.sms?.message || '')}`;
          break;
      }

      if (targetUrl) {
        if (qrType === 'url') {
          // Check if URL is a VemTap relative path (starts with / but not /s/ to avoid loop)
          const isVemTapPath = /^\/(?![s/])[a-zA-Z0-9_-]+/.test(targetUrl);
          if (isVemTapPath) {
            window.location.replace(window.location.origin + targetUrl);
            return;
          }
          if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
          }

          // Prevent loop by transforming /s/[shortId] to /b/[shortId]
          const scanPattern = new RegExp(`\\/s\\/${shortId}$`, 'i');
          if (scanPattern.test(targetUrl)) {
            targetUrl = targetUrl.replace(/\/s\//i, '/b/');
          }

          const isVemTapUrl = vemtapDomains.some(domain => targetUrl.includes(domain));
          if (isVemTapUrl) {
            window.location.replace(targetUrl);
            return;
          }
        }
        window.location.replace(targetUrl);
      }
    }
    }, [data, qrType]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-red-100/50">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">QR Code Not Found</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              This QR code may have been deleted, expired, or the link is invalid.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
            {loading ? 'Loading QR Content...' : 'Redirecting you...'}
          </p>
        </div>
      </div>
    );
  }

  // Rich content types — render DynamicView
  const showLandingPageTypes = [
    'socials', 'text', 'vcard', 'crypto', 'event', 'instagram',
    'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok',
    'image', 'pdf', 'video', 'mp3', 'app', 'business', 'menu',
    'wifi', 'form', 'links', 'booking', 'coupon',
  ];

  if (showLandingPageTypes.includes(qrType)) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-lg mx-auto">
          <DynamicView data={data} linkedQRCode={qrCode?.linkedQRCode} />
        </div>
      </div>
    );
  }

  // Fallback: still redirecting (for url/whatsapp/etc that haven't redirected yet)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Redirecting you...</p>
      </div>
    </div>
  );
}
