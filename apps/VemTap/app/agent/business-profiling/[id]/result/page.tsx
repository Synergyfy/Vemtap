'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBusinessProfile } from '@/services/business-profiling/hooks';
import { 
  Building2, MapPin, Calendar, User as UserIcon, 
  FileText, AlertTriangle, CheckCircle2, Crown, 
  QrCode, MessageSquare, Copy, Download, Share2, 
  Save, Edit2, Loader2, Info
} from 'lucide-react';
import { notify } from '@/lib/notify';

export default function ProfilingResultScreen() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: profile, isLoading, error } = useBusinessProfile(id);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg font-medium text-gray-600">Generating Insights...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Profile Not Found</h2>
        <p className="text-gray-500 mt-2">We couldn't load the profiling results.</p>
        <button onClick={() => router.push('/agent/business-profiling')} className="mt-6 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const { insights } = profile;

  // Fallback insights if backend did not generate them
  const safeInsights = {
    summary: insights?.summary || 'No summary available.',
    problems: insights?.problems || [],
    recommendations: insights?.recommendations || [],
    suggestedPackage: insights?.suggestedPackage || 'Starter',
    packageReason: insights?.packageReason || 'Based on the initial assessment of the business needs.',
    qrStrategy: insights?.qrStrategy || [],
    salesPitch: insights?.salesPitch || 'No pitch available.',
  };

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(safeInsights.salesPitch);
    notify.success('Sales pitch copied to clipboard!');
  };

  const handleShare = () => {
    const text = `Check out this Vemtap proposal for ${profile.businessName}!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 1. HEADER SECTION */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {profile.businessName}
            </h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium">{profile.businessType || 'Business'}</span>
              </div>
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col items-start md:items-end gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <UserIcon className="h-4 w-4" />
              <span>Profiled by: <span className="font-medium text-gray-700">{profile.createdBy?.firstName || 'Agent'}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Date: {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 2. BUSINESS SUMMARY */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Business Summary</h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                {safeInsights.summary}
              </p>
            </div>

            {/* 3. KEY PROBLEMS DETECTED */}
            <div className="rounded-2xl bg-red-50 border border-red-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-red-900">Key Problems Detected</h2>
              </div>
              <ul className="space-y-3">
                {safeInsights.problems.length > 0 ? (
                  safeInsights.problems.map((prob, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-red-800 text-sm md:text-base font-medium">{prob}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-red-700 text-sm">No major problems detected.</li>
                )}
              </ul>
            </div>

            {/* 4. RECOMMENDED SOLUTIONS */}
            <div className="rounded-2xl bg-green-50 border border-green-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-green-900">Recommended Solutions</h2>
              </div>
              <ul className="space-y-3">
                {safeInsights.recommendations.length > 0 ? (
                  safeInsights.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-green-800 text-sm md:text-base font-medium">{rec}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-green-700 text-sm">No specific recommendations.</li>
                )}
              </ul>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 5. VEMTAP PACKAGE RECOMMENDATION */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 shadow-lg text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Crown className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <Crown className="h-6 w-6 text-yellow-400" />
                <h2 className="text-lg font-bold">Suggested Package</h2>
              </div>
              <div className="relative z-10">
                <div className="inline-block bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 mb-4 border border-white/20">
                  <span className="text-3xl font-black tracking-tight">{safeInsights.suggestedPackage} Plan</span>
                </div>
                <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
                  {safeInsights.packageReason}
                </p>
              </div>
            </div>

            {/* 6. QR STRATEGY */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full bg-amber-100 p-2">
                  <QrCode className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">QR Deployment Strategy</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {safeInsights.qrStrategy.length > 0 ? (
                  safeInsights.qrStrategy.map((strat, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-xl">
                      <QrCode className="h-5 w-5 text-gray-400 shrink-0" />
                      <span className="text-gray-700 text-sm font-medium">{strat}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm">No QR strategy defined.</div>
                )}
              </div>
            </div>

            {/* 7. SALES PITCH */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Your Sales Pitch</h2>
                </div>
                <button onClick={handleCopyPitch} className="h-8 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors text-primary hover:bg-primary/5">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 relative">
                <div className="absolute -left-2 top-6 w-4 h-4 bg-gray-50 border-l border-t border-gray-200 rotate-[-45deg]"></div>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed italic font-medium">
                  "{safeInsights.salesPitch}"
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* 8. ACTION BUTTONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 md:sticky md:bottom-auto md:mt-8 md:bg-transparent md:border-none md:shadow-none md:p-0">
        <div className="mx-auto max-w-7xl md:px-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
            <button onClick={() => router.push(`/agent/business-profiling/${id}/edit`)} className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
            <button className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all">
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </button>
            <button onClick={handleShare} className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold border-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-all">
              <Share2 className="w-4 h-4 mr-2" />
              Share on WhatsApp
            </button>
            <button className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
