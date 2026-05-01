'use client';

import React from 'react';
import { QRType } from '@/services/qr-thrive/types';
import { Globe, User, Wifi, Mail, MessageSquare, Phone, Type, Video, FileText, Image as ImageIcon, Link2, Building2, UtensilsCrossed, SmartphoneNfc, Ticket, Calendar, ShieldAlert } from 'lucide-react';

interface ContentFormProps {
  type: QRType;
  data: any;
  onChange: (data: any) => void;
  isLocked?: boolean;
}

const TypeIcon: React.FC<{ type: QRType }> = ({ type }) => {
  const icons: Record<QRType, any> = {
    url: Globe, vcard: User, wifi: Wifi, email: Mail, whatsapp: MessageSquare,
    phone: Phone, text: Type, pdf: FileText, video: Video, image: ImageIcon,
    mp3: Type, socials: Link2, links: Link2, business: Building2, menu: UtensilsCrossed,
    app: SmartphoneNfc, coupon: Ticket, booking: Calendar, instagram: User,
    facebook: User, linkedin: User, twitter: User, youtube: User, tiktok: User,
    crypto: Phone, sms: MessageSquare, event: Calendar, form: FileText,
  };
  const Icon = icons[type] || Globe;
  return <Icon className="w-6 h-6" />;
};

export const ContentForm: React.FC<ContentFormProps> = ({ type, data, onChange, isLocked }) => {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const renderForm = () => {
    switch (type) {
      case 'url':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Website URL</h4>
                <p className="text-xs text-slate-400">Enter your website address</p>
              </div>
            </div>
            <div className="relative group">
              <input
                type="url"
                placeholder="https://example.com"
                className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all font-bold ${
                  isLocked 
                    ? "opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 pr-12" 
                    : "focus:border-blue-600 focus:bg-white"
                }`}
                value={data.url || ''}
                onChange={(e) => !isLocked && handleChange('url', e.target.value)}
                disabled={isLocked}
              />
              {isLocked && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <SmartphoneNfc className="text-amber-500 w-5 h-5" />
                </div>
              )}
            </div>
            {isLocked && (
              <p className="text-[10px] font-bold text-amber-600/70 ml-2 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert size={10} className="text-amber-500" />
                This link is tied to your hardware and cannot be changed.
              </p>
            )}
          </div>
        );

      case 'vcard':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Contact Details</h4>
                <p className="text-xs text-slate-400">Personal or business contact</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="First Name"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-sm font-bold"
                value={data.vcard?.firstName || ''}
                onChange={(e) => handleChange('vcard', { ...data.vcard, firstName: e.target.value })}
              />
              <input
                placeholder="Last Name"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-sm font-bold"
                value={data.vcard?.lastName || ''}
                onChange={(e) => handleChange('vcard', { ...data.vcard, lastName: e.target.value })}
              />
              <input
                placeholder="Email"
                type="email"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-sm font-bold"
                value={data.vcard?.email || ''}
                onChange={(e) => handleChange('vcard', { ...data.vcard, email: e.target.value })}
              />
              <input
                placeholder="Mobile"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-sm font-bold"
                value={data.vcard?.mobile || ''}
                onChange={(e) => handleChange('vcard', { ...data.vcard, mobile: e.target.value })}
              />
              <input
                placeholder="Company"
                className="w-full col-span-2 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-sm font-bold"
                value={data.vcard?.company || ''}
                onChange={(e) => handleChange('vcard', { ...data.vcard, company: e.target.value })}
              />
              <input
                placeholder="Job Title"
                className="w-full col-span-2 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white text-sm font-bold"
                value={data.vcard?.jobTitle || ''}
                onChange={(e) => handleChange('vcard', { ...data.vcard, jobTitle: e.target.value })}
              />
            </div>
          </div>
        );

      case 'wifi':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">WiFi Credentials</h4>
                <p className="text-xs text-slate-400">Connect to WiFi instantly</p>
              </div>
            </div>
            <input
              placeholder="Network Name (SSID)"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold"
              value={data.wifi?.ssid || ''}
              onChange={(e) => handleChange('wifi', { ...data.wifi, ssid: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold"
              value={data.wifi?.password || ''}
              onChange={(e) => handleChange('wifi', { ...data.wifi, password: e.target.value })}
            />
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Encryption Type</p>
              <div className="flex gap-3">
                {['WPA', 'WEP', 'nopass'].map(enc => (
                  <button
                    key={enc}
                    onClick={() => handleChange('wifi', { ...data.wifi, encryption: enc })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      data.wifi?.encryption === enc 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {enc === 'nopass' ? 'None' : enc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Email</h4>
                <p className="text-xs text-slate-400">Pre-fill email composition</p>
              </div>
            </div>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold"
              value={data.email?.address || ''}
              onChange={(e) => handleChange('email', { ...data.email, address: e.target.value })}
            />
            <input
              placeholder="Subject"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold"
              value={data.email?.subject || ''}
              onChange={(e) => handleChange('email', { ...data.email, subject: e.target.value })}
            />
            <textarea
              placeholder="Default message"
              rows={3}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold resize-none"
              value={data.email?.body || ''}
              onChange={(e) => handleChange('email', { ...data.email, body: e.target.value })}
            />
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">WhatsApp</h4>
                <p className="text-xs text-slate-400">Start a conversation instantly</p>
              </div>
            </div>
            <input
              placeholder="Phone Number (with country code)"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold"
              value={data.whatsapp?.phoneNumber || ''}
              onChange={(e) => handleChange('whatsapp', { ...data.whatsapp, phoneNumber: e.target.value })}
            />
            <textarea
              placeholder="Pre-filled message"
              rows={3}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold resize-none"
              value={data.whatsapp?.message || ''}
              onChange={(e) => handleChange('whatsapp', { ...data.whatsapp, message: e.target.value })}
            />
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Phone Number</h4>
                <p className="text-xs text-slate-400">Call with one scan</p>
              </div>
            </div>
            <input
              placeholder="Phone Number"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white font-bold"
              value={data.phone?.number || ''}
              onChange={(e) => handleChange('phone', { number: e.target.value })}
            />
          </div>
        );

      default:
        return (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center">
              <TypeIcon type={type} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{type.toUpperCase()} Configuration</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                This QR type configuration is available on the full QRThrive platform. 
                For now, you can create URL QR codes here.
              </p>
            </div>
            <div className="pt-4">
              <a 
                href="/dashboard/explore-qrthrive/sso" 
                target="_blank"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
              >
                Open Full Platform <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
      {renderForm()}
    </div>
  );
};

export default ContentForm;