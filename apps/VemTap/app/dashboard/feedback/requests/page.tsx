'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, MessageSquare, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function FeedbackRequestsPage() {
  const [recipient, setRecipient] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [message, setMessage] = useState('Hi! Thank you for visiting us. Please take 30 seconds to rate your experience: https://vemtap.com/feedback');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) {
      toast.error('Please enter a valid phone number or contact');
      return;
    }
    toast.success(`Review request dispatched via ${channel.toUpperCase()} to ${recipient}!`);
    setRecipient('');
  };

  return (
    <div className="pb-32 md:pb-20 max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <Link href="/dashboard/feedback" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#066CF4] transition-colors">
        <ArrowLeft size={14} />
        Back to Feedback Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">Send Review Request</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Request reviews directly from recent customers via WhatsApp or SMS.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Delivery Channel</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                  channel === 'whatsapp' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                }`}
              >
                <MessageSquare size={18} />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                  channel === 'sms' ? 'border-[#066CF4] bg-blue-50/50 text-[#066CF4]' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                }`}
              >
                <Smartphone size={18} />
                SMS
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Customer Phone Number</label>
            <input
              type="tel"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="+234 801 234 5678"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#066CF4]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Request Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#066CF4]"
            />
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl bg-[#066CF4] text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-700 flex items-center justify-center gap-2">
            <Send size={16} />
            Dispatch Request
          </Button>
        </form>
      </div>
    </div>
  );
}
