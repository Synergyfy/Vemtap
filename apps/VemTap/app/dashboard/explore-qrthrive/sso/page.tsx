'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Zap, AlertCircle } from 'lucide-react';
import { useQrThriveStore } from '@/store/useQrThriveStore';
import { useGenerateMagicLink } from '@/services/qr-thrive/hooks';

export default function SSOPage() {
  const router = useRouter();
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  const generateMagicLink = useGenerateMagicLink();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSSO = async () => {
      if (!isProvisioned || !qrThriveUserId) {
        setStatus('error');
        setError('Your QRThrive account is not set up yet. Please try again later or contact support.');
        return;
      }

      try {
        setStatus('loading');
        const result = await generateMagicLink.mutateAsync();
        
        setStatus('redirecting');
        
        if (result.url) {
          window.location.href = result.url;
        } else {
          window.location.href = `https://qrthrive.com/dashboard?token=${result.token}`;
        }
      } catch (err: any) {
        console.error('SSO Error:', err);
        setStatus('error');
        setError(err?.message || 'Failed to generate login link. Please try again.');
      }
    };

    if (qrThriveUserId) {
      performSSO();
    } else {
      setStatus('error');
      setError('Your QRThrive account is not set up. Please return to the dashboard and try again.');
    }
  }, [qrThriveUserId, isProvisioned]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
          <Zap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connecting to QRThrive</h2>
        <p className="text-slate-400 mb-8">Generating your secure login link...</p>
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (status === 'redirecting') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6">
          <Zap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Redirecting...</h2>
        <p className="text-slate-400 mb-8">Taking you to QRThrive Dashboard</p>
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to Connect</h2>
      <p className="text-slate-400 max-w-md text-center mb-8">{error}</p>
      <div className="flex gap-4">
        <button 
          onClick={() => router.back()}
          className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
        >
          Go Back
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}