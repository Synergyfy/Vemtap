'use client';

import React from 'react';
import { 
  Globe, FileText, Link2, User, Building2, Video, Image as ImageIcon,
  Users, Phone, Music, UtensilsCrossed, SmartphoneNfc, Ticket, Calendar,
  Wifi, Mail, MessageSquare, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRType } from '@/services/qr-thrive/types';

const FacebookIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

interface QRTypeOption {
  id: QRType;
  icon: any;
  title: string;
  description: string;
  category: 'dynamic' | 'static';
}

const qrTypes: QRTypeOption[] = [
  { id: 'url', icon: Globe, title: 'Website', description: 'Link to any website URL', category: 'static' },
  { id: 'pdf', icon: FileText, title: 'PDF', description: 'Show a PDF', category: 'dynamic' },
  { id: 'links', icon: Link2, title: 'List of Links', description: 'Share multiple links', category: 'dynamic' },
  { id: 'vcard', icon: User, title: 'vCard', description: 'Share a digital business card', category: 'dynamic' },
  { id: 'business', icon: Building2, title: 'Business', description: 'Share business info', category: 'dynamic' },
  { id: 'video', icon: Video, title: 'Video', description: 'Show a video', category: 'dynamic' },
  { id: 'image', icon: ImageIcon, title: 'Images', description: 'Share multiple images', category: 'dynamic' },
  { id: 'facebook', icon: FacebookIcon, title: 'Facebook', description: 'Share your Facebook page', category: 'dynamic' },
  { id: 'instagram', icon: InstagramIcon, title: 'Instagram', description: 'Share your Instagram', category: 'dynamic' },
  { id: 'socials', icon: Users, title: 'Social Media', description: 'Share your social channels', category: 'dynamic' },
  { id: 'whatsapp', icon: Phone, title: 'WhatsApp', description: 'Get WhatsApp messages', category: 'dynamic' },
  { id: 'mp3', icon: Music, title: 'MP3', description: 'Share an audio file', category: 'dynamic' },
  { id: 'menu', icon: UtensilsCrossed, title: 'Menu', description: 'Create a restaurant menu', category: 'dynamic' },
  { id: 'app', icon: SmartphoneNfc, title: 'Apps', description: 'Redirect to an app store', category: 'dynamic' },
  { id: 'coupon', icon: Ticket, title: 'Coupon', description: 'Share a coupon', category: 'dynamic' },
  { id: 'booking', icon: Calendar, title: 'Booking', description: 'Enable online bookings', category: 'dynamic' },
  { id: 'wifi', icon: Wifi, title: 'WiFi', description: 'Connect to a Wi-Fi network', category: 'static' },
  { id: 'email', icon: Mail, title: 'Email', description: 'Send an email', category: 'static' },
];

interface QrTypeSelectorProps {
  selectedType: QRType | null;
  onSelect: (type: QRType) => void;
  onHover?: (type: QRType | null) => void;
}

export const QrTypeSelector: React.FC<QrTypeSelectorProps> = ({ selectedType, onSelect, onHover }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {qrTypes.map(type => (
        <button
          key={type.id}
          onMouseEnter={() => onHover?.(type.id)}
          onMouseLeave={() => onHover?.(null)}
          onClick={() => onSelect(type.id)}
          className={cn(
            "flex flex-col items-center text-center p-6 rounded-[2rem] border-2 transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden",
            selectedType === type.id 
              ? "border-blue-600 bg-blue-50/10 ring-4 ring-blue-50/30" 
              : "border-white bg-white hover:border-slate-100 shadow-sm shadow-slate-200/50"
          )}
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all mb-4 border-2",
            selectedType === type.id 
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" 
              : "bg-white text-slate-400 border-slate-100 group-hover:border-blue-100 group-hover:text-blue-600"
          )}>
            <type.icon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">{type.title}</h3>
            <p className="text-xs font-medium text-slate-400 leading-tight px-2">{type.description}</p>
          </div>
          {type.category === 'dynamic' && (
            <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
};

export default QrTypeSelector;