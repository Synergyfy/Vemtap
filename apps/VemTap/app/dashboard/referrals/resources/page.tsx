'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function ReferralResourcesPage() {
  const resources = [
    { title: 'VemTap Merchant Pitch Deck', type: 'PDF Document', size: '2.4 MB', desc: 'Comprehensive presentation highlighting key benefits and ROI.' },
    { title: 'Social Media Banners & Graphics', type: 'ZIP Archive', size: '15.8 MB', desc: 'Ready-to-use high resolution visual banners for promotion.' },
    { title: 'Referral Script & Email Templates', type: 'DOCX Document', size: '512 KB', desc: 'Proven messaging templates for reaching potential businesses.' },
  ];

  const handleDownload = (title: string) => {
    toast.success(`Downloading ${title}...`);
  };

  return (
    <div className="pb-32 md:pb-20 max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <Link href="/dashboard/referrals" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-[#066CF4] transition-colors">
        <ArrowLeft size={14} />
        Back to Referrals Dashboard
      </Link>

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Referral Resources & Assets</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Download marketing materials, guides, and templates to maximize your conversions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {resources.map((res, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="size-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h3 className="text-base md:text-lg font-bold text-gray-900">{res.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{res.desc}</p>
            </div>

            <div className="pt-2 border-t border-gray-50">
              <span className="text-[10px] font-semibold text-gray-400 uppercase block mb-3">{res.type} • {res.size}</span>
              <Button
                onClick={() => handleDownload(res.title)}
                variant="outline"
                className="w-full h-10 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Download size={14} />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
