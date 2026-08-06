'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { LifeBuoy, MessageCircle, BookOpen, Mail, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';

export default function HelpSupportPage() {
  const router = useRouter();
  const setIsOpen = useChatStore((state) => state.setIsOpen);
  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with a support agent in real-time',
      action: 'Start Chat',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      hoverColor: 'hover:border-blue-300',
      onClick: () => setIsOpen(true),
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message and we will respond within 24 hours',
      action: 'Send Email',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      hoverColor: 'hover:border-purple-300',
      onClick: () => window.open('mailto:support@vemtap.com'),
    },
    {
      icon: BookOpen,
      title: 'Knowledge Base',
      description: 'Browse FAQs, guides, and video tutorials',
      action: 'Browse Articles',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      hoverColor: 'hover:border-emerald-300',
      onClick: () => router.push('/tutorial/bussiness'),
    },
  ];

  const faqItems = [
    { q: 'How do I add a new product to the POS?', a: 'Go to POS > Products > Add Product. Follow the step-by-step wizard to enter product details, pricing, and stock information.' },
    { q: 'How do I process a refund?', a: 'Go to POS > Sales History, find the transaction, open the receipt, and tap the "Refund Sale" button.' },
    { q: 'How do I close the register at the end of the day?', a: 'Go to POS > Register Management. Count the physical cash in the drawer and enter the amount. The system will calculate any variance.' },
    { q: 'How do I receive stock from a supplier?', a: 'Go to Inventory > Receive Stock. Search for the products, enter the quantities received, and tap "Receive Stock".' },
    { q: 'Can I use VemTap POS offline?', a: 'Currently VemTap POS requires an internet connection. Offline mode is planned for a future update.' },
  ];

  return (
    <div className="max-w-5xl mx-auto flex flex-col pt-4 px-4 md:px-0 pb-24 space-y-8">
      <POSPageHeader
        title="Help & Support"
        subtitle="Get help with your VemTap POS"
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#066CF4] to-blue-700 rounded-[32px] p-8 md:p-12 text-white relative overflow-hidden shadow-xl shadow-blue-500/20">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <LifeBuoy size={160} />
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-black mb-3">Need help?</h2>
          <p className="text-sm font-bold text-blue-200 leading-relaxed">
            Our team is available 7 days a week. Browse the FAQ below, or reach out through any of our support channels.
          </p>
        </div>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {supportOptions.map((opt, i) => (
          <button
            key={i}
            onClick={opt.onClick}
            className={cn(
              "bg-white border rounded-[24px] p-6 text-left transition-all group",
              opt.color,
              opt.hoverColor
            )}
          >
            <div className={cn("size-12 rounded-[16px] flex items-center justify-center mb-4 border", opt.color)}>
              <opt.icon size={22} />
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">{opt.title}</h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed mb-6">{opt.description}</p>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#066CF4] flex items-center gap-1 group-hover:gap-2 transition-all">
              {opt.action} <ChevronRight size={12} />
            </span>
          </button>
        ))}
      </div>

      {/* FAQ */}
      <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-900">Frequently Asked Questions</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Quick answers to common questions</p>
        </div>
        <div className="divide-y divide-gray-100">
          {faqItems.map((faq, i) => (
            <details key={i} className="group">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50/50 transition-colors list-none">
                <span className="text-sm font-black text-gray-900 pr-4">{faq.q}</span>
                <ChevronRight size={16} className="text-gray-400 group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <div className="px-6 pb-6 -mt-2">
                <p className="text-xs font-bold text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
