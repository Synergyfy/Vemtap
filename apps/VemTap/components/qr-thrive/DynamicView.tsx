import React from 'react';
import { 
  Globe, 
  Mail, 
  MessageSquare, 
  Phone, 
  User, 
  Share2,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Type,
  ClipboardList,
  CheckCircle2,
  Link2,
  Building2,
  Ticket,
  MapPin,
  Clock
} from 'lucide-react';
import WhatsAppChatPreview from './WhatsAppChatPreview';
import InstagramProfilePreview from './InstagramProfilePreview';
import FacebookProfilePreview from './FacebookProfilePreview';
import PDFProfilePreview from './PDFProfilePreview';
import VideoProfilePreview from './VideoProfilePreview';
import PhotoProfilePreview from './PhotoProfilePreview';
import SocialsProfilePreview from './SocialsProfilePreview';
import MenuPreview from './MenuPreview';
import AudioProfilePreview from './AudioProfilePreview';
import WebsiteProfilePreview from './WebsiteProfilePreview';
import WifiProfilePreview from './WifiProfilePreview';
import AppStorePreview from './AppStorePreview';
import BookingProfilePreview from './BookingProfilePreview';
import type { QRData } from '../types/qr';
import { useParams, useRouter } from 'next/navigation';
import { useSubmitForm } from '../hooks/useForms';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DEMO_DATA } from '../constants/demoData';
import { qrThriveApi } from '@/services/qr-thrive/api';

const getSocialConfig = (platform: string) => {
  switch (platform) {
    case 'instagram': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>, 
      color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' 
    };
    case 'facebook': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, 
      color: 'bg-[#1877F2]' 
    };
    case 'twitter': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, 
      color: 'bg-black' 
    };
    case 'linkedin': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.37 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.729C24 .774 23.204 0 22.225 0z"/></svg>, 
      color: 'bg-[#0A66C2]' 
    };
    case 'youtube': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, 
      color: 'bg-[#FF0000]' 
    };
    case 'tiktok': return { 
      icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96s3.35-1.92 5.27-1.74c1.1.07 2.13.44 3.06 1.06V.02z"/></svg>, 
      color: 'bg-black' 
    };
    default: return { icon: Share2, color: 'bg-gray-600' };
  }
};


function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
const ensureAbsoluteUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }
  return `https://${url}`;
};

interface DynamicViewProps {
  data: QRData;
  isWizardPreview?: boolean;
  embedded?: boolean;
  shortId?: string;
  linkedQRCode?: any;
}

const LinkedQRCard = ({ qr }: { qr: any }) => {
  const router = useRouter();
  if (!qr) return null;

  return (
    <div className="px-6 mt-8">
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-all"
        onClick={() => router.push(`/s/${qr.shortId}`)}
      >
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">
          Discover More
        </p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {qr.name || qr.type}
            </p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              {qr.type} QR
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
        </div>
      </div>
    </div>
  );
};

const DynamicView: React.FC<DynamicViewProps> = ({ data: initialData, isWizardPreview, embedded, shortId: propShortId, linkedQRCode }) => {
  const params = useParams<{ id: string }>();
  const shortId = propShortId || params?.id;

  // Merge with demo data if in wizard preview
  const data = React.useMemo(() => {
    if (!isWizardPreview) return initialData;
    
    const hasContent = () => {
      const t = initialData.type;
      if (t === 'url') return !!initialData.url;
      if (t === 'text') return !!initialData.text;
      if (t === 'wifi') return !!initialData.wifi?.ssid;
      if (t === 'email') return !!initialData.email?.address;
      if (t === 'phone') return !!initialData.phone?.number;
      if (t === 'sms') return !!initialData.sms?.number;
      if (t === 'whatsapp') return !!(initialData.whatsapp?.phoneNumber || initialData.whatsapp?.number);
      if (t === 'links') return !!(initialData.linksInfo || initialData.linksList?.length);
      
      const typeData = (initialData as any)[t];
      return !!typeData && Object.values(typeData).some(v => {
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object' && v !== null) return Object.values(v).some(vv => !!vv);
        return !!v;
      });
    };

    if (hasContent()) {
      // Even if there is content, we merge with demo data to fill gaps, 
      // but USER data MUST come last to overwrite demo data.
      const demo = DEMO_DATA[initialData.type] || {};
      return {
        ...demo,
        ...initialData,
        // Deep merge for specific info objects if they exist
        linksInfo: { ...(demo as any).linksInfo, ...initialData.linksInfo },
        linksList: initialData.linksList?.length ? initialData.linksList : (demo as any).linksList,
        vcard: { ...(demo as any).vcard, ...initialData.vcard },
        business: { ...(demo as any).business, ...initialData.business },
        menu: { ...(demo as any).menu, ...initialData.menu },
        coupon: { ...(demo as any).coupon, ...initialData.coupon },
        booking: { 
          ...(demo as any).booking,
          ...initialData.booking,
          imageUrl: initialData.booking?.imageUrl || (demo as any).booking?.imageUrl,
          profileImageUrl: initialData.booking?.profileImageUrl || (demo as any).booking?.profileImageUrl,
          destinationMode: initialData.booking?.destinationMode || (demo as any).booking?.destinationMode || 'url',
          qrLinkId: initialData.booking?.qrLinkId || (demo as any).booking?.qrLinkId,
          customFormEnabled: initialData.booking?.customFormEnabled ?? (demo as any).booking?.customFormEnabled,
          customFormFields: initialData.booking?.customFormFields || (demo as any).booking?.customFormFields || [],
          whatsappEnabled: initialData.booking?.whatsappEnabled ?? (demo as any).booking?.whatsappEnabled,
          whatsappNumber: initialData.booking?.whatsappNumber || (demo as any).booking?.whatsappNumber
        }
      } as QRData;
    }
    
    return { ...initialData, ...(DEMO_DATA[initialData.type] || {}) } as QRData;
  }, [initialData, isWizardPreview]);

  const submitMutation = useSubmitForm(shortId || '');
  const [answers, setAnswers] = React.useState<Record<string, any>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});



  // If it's a simple URL, we can just redirect or show a card
  React.useEffect(() => {
    if (data.type === 'url' && data.url) {
       // Optional: Auto-redirect after 2 seconds
       // const timer = setTimeout(() => window.location.href = data.url!, 2000);
       // return () => clearTimeout(timer);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWizardPreview) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{7,15}$/;

    const fieldErrorsMap: Record<string, string> = {};
    
    data.form?.fields.forEach(f => {
      const value = answers[f.id];
      const isMissing = Array.isArray(value) ? value.length === 0 : (value === undefined || value === null || value === '');

      // Required check
      if (f.required && isMissing) {
        fieldErrorsMap[f.id] = `${f.label} is required`;
        return;
      }

      // Type-specific validation if value is present
      if (!isMissing) {
        if (f.type === 'email' && !emailRegex.test(String(value))) {
          fieldErrorsMap[f.id] = 'Please enter a valid email address';
        }
        if (f.type === 'phone' && !phoneRegex.test(String(value))) {
          fieldErrorsMap[f.id] = 'Please enter a valid phone number';
        }
        if (f.type === 'number' || f.type === 'range') {
          const num = Number(value);
          if (isNaN(num)) {
            fieldErrorsMap[f.id] = 'Must be a number';
          } else if (f.validation) {
            const v = f.validation as any;
            if (v.min !== undefined && num < v.min) {
              fieldErrorsMap[f.id] = `Must be at least ${v.min}`;
            }
            if (v.max !== undefined && num > v.max) {
              fieldErrorsMap[f.id] = `Must be at most ${v.max}`;
            }
          }
        }
      }
    });

    if (Object.keys(fieldErrorsMap).length > 0) {
      setFieldErrors(fieldErrorsMap);
      return;
    }
    setFieldErrors({});

    try {
      await submitMutation.mutateAsync(answers);
      setSubmitted(true);
    } catch (e) {}
  };

  const renderContent = () => {
    switch (data.type) {
      case 'url':
        return (
          <div className="w-full h-full rounded-none overflow-hidden">
             <WebsiteProfilePreview 
                url={data.url} 
                title={data.urlPreview?.title}
                description={data.urlPreview?.description}
                themeColor={data.urlPreview?.themeColor}
             />
          </div>
        );

      case 'socials': {
        const { name, bio, images, ...socialLinks } = data.socials || {};
        const absoluteSocials = Object.fromEntries(
          Object.entries(socialLinks).map(([platform, url]) => [platform, ensureAbsoluteUrl(url as string)])
        );
        return (
          <div className="w-full h-full rounded-none overflow-hidden">
            <SocialsProfilePreview 
              name={name}
              bio={bio}
              images={images?.map(i => i.url)}
              socials={absoluteSocials as any}
            />
          </div>
        );
      }

      case 'image':
        return (
          <div className="w-full h-full rounded-none overflow-hidden">
             <PhotoProfilePreview 
                galleryTitle={data.imageGalleryInfo?.title}
                description={data.imageGalleryInfo?.description}
                buttonText={data.imageGalleryInfo?.buttonText}
                themeColor={data.imageGalleryInfo?.themeColor}
                images={(data.images || []).map(img => ({ url: img.url }))}
             />
          </div>
        );
       case 'wifi':
        return (
          <div className="w-full h-full rounded-none overflow-hidden">
             <WifiProfilePreview 
                ssid={data.wifi?.ssid} 
                password={data.wifi?.password}
                encryption={data.wifi?.encryption}
             />
          </div>
        );

      case 'vcard':
        return (
          <div className="flex-1 flex flex-col relative bg-white">
             {/* Banner with Content Inside */}
             <div 
               className="h-60 rounded-b-[48px] relative overflow-hidden flex flex-col items-center justify-start text-center px-6 pt-10"
               style={{ backgroundColor: data.vcard?.themeColor || '#2563eb' }}
             >
                {data.vcard?.banner && (
                   <img src={data.vcard.banner} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Banner" />
                )}
                <div className="relative z-10 flex flex-col items-center">
                   {/* Logo / Profile */}
                   <div className="w-20 h-20 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center mb-4">
                      {data.vcard?.avatar ? (
                         <img src={data.vcard.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         <User className="w-10 h-10 text-blue-600" />
                      )}
                   </div>

                   <h1 className="text-xl font-medium text-white tracking-tight mb-1 drop-shadow-md">
                      {data.vcard?.firstName} {data.vcard?.lastName}
                   </h1>
                   <p className="text-[10px] font-normal text-white/90 uppercase tracking-[0.2em] drop-shadow-md">
                      Digital Contact Card
                   </p>
                </div>
             </div>

             <div className="relative z-20 flex flex-col px-6">
                {/* Overlapping Icons */}
                <div className="flex items-center justify-center gap-4 -mt-10 mb-8">
                    {data.vcard?.mobile && (
                       <a 
                         href={`tel:${data.vcard.mobile}`} 
                         className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-50"
                         style={{ color: (data.vcard as any)?.accentColor || '#2563eb' }}
                       >
                          <Phone className="w-6 h-6" />
                       </a>
                    )}
                    {data.vcard?.email && (
                       <a 
                         href={`mailto:${data.vcard.email}`} 
                         className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-50"
                         style={{ color: (data.vcard as any)?.accentColor || '#2563eb' }}
                       >
                          <Mail className="w-6 h-6" />
                       </a>
                    )}
                    {data.vcard?.website && (
                       <a 
                         href={ensureAbsoluteUrl(data.vcard.website)} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-50"
                         style={{ color: (data.vcard as any)?.accentColor || '#2563eb' }}
                       >
                          <Globe className="w-6 h-6" />
                       </a>
                    )}
                </div>

                <div className="space-y-2 mb-8">
                  {[
                    { icon: Phone, label: 'Mobile', value: data.vcard?.mobile, href: `tel:${data.vcard?.mobile}` },
                    { icon: Mail, label: 'Email', value: data.vcard?.email, href: `mailto:${data.vcard?.email}` },
                    { icon: Globe, label: 'Website', value: data.vcard?.website, href: ensureAbsoluteUrl(data.vcard?.website) },
                    { icon: Building2, label: 'Company', value: data.vcard?.company },
                    { icon: User, label: 'Profession', value: data.vcard?.jobTitle },
                    { icon: MapPin, label: 'Address', value: data.vcard?.address, href: `https://maps.google.com/?q=${encodeURIComponent(data.vcard?.address || '')}` },
                  ].map((item) => item.value ? (
                    <a 
                      key={item.label} 
                      href={item.href} 
                      target={item.href?.startsWith('http') ? "_blank" : undefined}
                      className={cn(
                        "flex items-center gap-3 p-4 bg-white border border-gray-50 rounded-2xl transition-all shadow-sm group",
                        !item.href && "pointer-events-none"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-normal text-gray-400 uppercase tracking-wider leading-none mb-1">{item.label}</p>
                        <p className="text-xs font-normal text-gray-900 break-all leading-tight">{item.value}</p>
                      </div>
                    </a>
                  ) : null)}

                  {data.vcard?.note && (
                    <div className="p-5 bg-slate-50 border border-slate-100 rounded-[28px] mt-4">
                       <p className="text-[9px] font-normal text-slate-400 uppercase tracking-widest mb-2">Summary</p>
                       <p className="text-xs font-normal text-slate-600 leading-relaxed italic">"{data.vcard.note}"</p>
                    </div>
                  )}

                  {data.vcard?.socials && Object.values(data.vcard.socials).some(v => !!v) && (
                    <div className="mt-6 pt-6 border-t border-gray-50">
                       <p className="text-[10px] font-normal text-gray-400 uppercase tracking-[0.2em] text-center mb-4">Connect with me</p>
                       <div className="flex flex-wrap justify-center gap-3">
                          {Object.entries(data.vcard.socials).map(([platform, url]) => {
                             if (!url) return null;
                             const s = getSocialConfig(platform);
                             return (
                                <a key={platform} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" 
                                   className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95", s.color)}>
                                   <s.icon className="w-5 h-5" />
                                </a>
                             );
                          })}
                       </div>
                    </div>
                  )}
                </div>
                
                <button 
                  className="w-full py-4 text-white rounded-2xl font-normal text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-gray-200"
                  style={{ backgroundColor: (data.vcard as any)?.accentColor || '#111827' }}
                >
                   Save Contact
                   <Smartphone className="w-4 h-4" />
                </button>
                <div className="h-8"></div>
             </div>
          </div>
        );

       case 'text':
        return (
          <div className="space-y-6 p-8 sm:p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-100">
                <Type className="w-10 h-10" />
              </div>
              <h1 className="text-xl font-normal text-gray-900 mb-2">Message Content</h1>
              <p className="text-gray-400 text-[10px] font-normal uppercase tracking-widest">Encoded Plain Text</p>
            </div>
            <div className="bg-gray-50/80 backdrop-blur-sm p-8 rounded-[40px] border border-gray-100 shadow-inner">
               <p className="text-gray-700 font-normal leading-relaxed whitespace-pre-wrap text-lg italic text-center">"{data.text}"</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(data.text || '');
                alert('Copied to clipboard!');
              }}
              className="w-full py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-3xl font-normal hover:bg-gray-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Copy Text
            </button>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="w-full h-full rounded-none overflow-hidden">
            <WhatsAppChatPreview 
               number={data.whatsapp?.phoneNumber || ''} 
               message={data.whatsapp?.message || ''} 
            />
          </div>
        );

      case 'email':
        return (
          <div className="space-y-8 p-8 sm:p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                <Mail className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-normal text-gray-900 mb-2">Send an Email</h1>
              <p className="text-gray-400 text-[10px] font-normal uppercase tracking-widest">{data.email?.address}</p>
            </div>
            <div className="space-y-4">
               {data.email?.subject && (
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[10px] font-normal text-gray-400 uppercase mb-1">Subject</p>
                     <p className="text-gray-900 font-normal">{data.email?.subject}</p>
                  </div>
               )}
               {data.email?.body && (
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[10px] font-normal text-gray-400 uppercase mb-1">Message</p>
                     <p className="text-gray-700 font-normal whitespace-pre-wrap">{data.email?.body}</p>
                  </div>
               )}
            </div>
            <a 
              href={`mailto:${data.email?.address}?subject=${encodeURIComponent(data.email?.subject || '')}&body=${encodeURIComponent(data.email?.body || '')}`}
              className="w-full py-5 bg-blue-600 text-white rounded-3xl font-normal shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
            >
              Open Email App
              <Mail className="w-5 h-5" />
            </a>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-8 text-center p-8 sm:p-12">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-50">
               <Phone className="w-12 h-12" />
            </div>
            <div>
               <h1 className="text-lg font-normal text-gray-900 mb-2">Call Now</h1>
               <p className="text-2xl font-normal text-blue-600 tracking-tight">{data.phone?.number}</p>
            </div>
            <a 
              href={`tel:${data.phone?.number}`}
              className="w-full py-5 bg-blue-600 text-white rounded-[40px] font-normal text-xl shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Start Call
              <Phone className="w-6 h-6 fill-current" />
            </a>
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-8 p-8 sm:p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-normal text-gray-900 mb-2">Send SMS</h1>
              <p className="text-gray-400 text-sm font-semibold">{data.sms?.number}</p>
            </div>
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 italic text-indigo-900 font-normal leading-relaxed">
               "{data.sms?.message}"
            </div>
            <a 
              href={`sms:${data.sms?.number}?body=${encodeURIComponent(data.sms?.message || '')}`}
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-normal shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
            >
              Draft SMS
              <MessageSquare className="w-5 h-5" />
            </a>
          </div>
        );

       case 'instagram':
         return (
           <div className="w-full h-full rounded-none overflow-hidden">
              <InstagramProfilePreview username={data.social?.username || 'Vemtapng'} />
           </div>
         );

       case 'facebook':
         return (
           <div className="w-full h-full rounded-none overflow-hidden">
              <FacebookProfilePreview 
                name={data.facebook?.name} 
                bio={data.facebook?.bio} 
                logo={data.facebook?.logo} 
                banner={data.facebook?.banner} 
              />
           </div>
         );      case 'links':
         return (
           <div className="flex-1 flex flex-col relative bg-white">
              {/* Banner with Content Inside */}
              <div 
                className="h-60 rounded-b-[48px] relative overflow-hidden flex flex-col items-center justify-start text-center px-6 pt-10"
                style={{ backgroundColor: data.linksInfo?.themeColor || '#2563eb' }}
              >
                 {data.linksInfo?.banner && (
                    <img src={data.linksInfo.banner} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Banner" />
                 )}
                 <div className="relative z-10 flex flex-col items-center">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center mb-4">
                       {data.linksInfo?.avatar ? (
                          <img src={data.linksInfo.avatar} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                          <User className="w-10 h-10 text-blue-600" />
                       )}
                    </div>

                    <h1 className="text-xl font-medium text-white tracking-tight mb-1 drop-shadow-md">
                       {data.linksInfo?.title || 'Your Title'}
                    </h1>
                    {data.linksInfo?.description && (
                       <p className="text-[10px] text-white/90 font-normal leading-relaxed drop-shadow-md max-w-xs px-4">
                          {data.linksInfo.description}
                       </p>
                    )}
                 </div>
              </div>
              
              <div className="relative z-20 flex flex-col px-6">
                 {/* Overlapping Icons */}
                 <div className="flex items-center justify-center gap-4 -mt-10 mb-8">
                    {data.linksInfo?.phone && (
                       <a 
                         href={`tel:${data.linksInfo.phone}`} 
                         className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-50"
                         style={{ color: data.linksInfo.themeColor || '#2563eb' }}
                       >
                          <Phone className="w-6 h-6" />
                       </a>
                    )}
                    {data.linksInfo?.email && (
                       <a 
                         href={`mailto:${data.linksInfo.email}`} 
                         className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-50"
                         style={{ color: data.linksInfo.themeColor || '#2563eb' }}
                       >
                          <Mail className="w-6 h-6" />
                       </a>
                    )}
                    {data.linksInfo?.website && (
                       <a 
                         href={ensureAbsoluteUrl(data.linksInfo.website)} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-50"
                         style={{ color: data.linksInfo.themeColor || '#2563eb' }}
                       >
                          <Globe className="w-6 h-6" />
                       </a>
                    )}
                 </div>

                 <div className="w-full space-y-2 mb-8">
                    {data.linksList?.map((link: any, idx: number) => (
                       <a 
                         key={idx}
                         href={ensureAbsoluteUrl(link.url) || '#'}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-4 p-4 bg-white border border-gray-50 rounded-2xl hover:scale-[1.01] active:scale-95 transition-all shadow-sm group"
                         style={{ 
                            backgroundColor: (data.linksInfo?.linkBgColor || '#FFFFFF') + 'FA',
                            color: data.linksInfo?.linkTextColor || '#1E293B'
                         }}
                       >
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-black/5 group-hover:bg-blue-50 transition-colors">
                             {link.icon ? (
                               <img src={link.icon} alt={link.title} className="w-full h-full object-cover" />
                             ) : (
                                <Link2 className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                             )}
                          </div>
                          <div className="min-w-0 flex-1">
                             <p className="text-[9px] font-normal text-gray-400 uppercase tracking-wider leading-none mb-1 opacity-60">Source Link</p>
                             <p className="font-normal text-xs tracking-tight break-all leading-tight">
                                {link.title || 'Link Title'}
                             </p>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                             <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-600 transition-colors" />
                          </div>
                       </a>
                    ))}
                 </div>
                 <div className="h-8"></div>
              </div>
           </div>
         );

      case 'pdf':
        return (
          <div className="w-full h-full rounded-none overflow-hidden">
             <PDFProfilePreview 
               companyName={data.pdf?.companyName}
               title={data.pdf?.title}
               description={data.pdf?.description}
               previewImage={data.pdf?.previewImage}
               themeColor={data.pdf?.themeColor}
               textColor={data.pdf?.textColor}
               buttonColor={data.pdf?.buttonColor}
               buttonTextColor={data.pdf?.buttonTextColor}
               onView={() => {}}
             />
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full rounded-none overflow-hidden">
             <PhotoProfilePreview 
                companyName="Vemtap"
                galleryTitle={data.imageGalleryInfo?.title}
                description={data.imageGalleryInfo?.description}
                buttonText={data.imageGalleryInfo?.buttonText}
                themeColor={data.imageGalleryInfo?.themeColor}
                images={(data.images || []).map(img => ({ url: img.url }))}
             />
          </div>
        );

      case 'video':
        return (
          <div className="w-full h-full rounded-none overflow-hidden">
             <VideoProfilePreview 
                companyName={data.video?.companyName}
                title={data.video?.title}
                description={data.video?.description}
                footerText={data.video?.footerText}
                videoUrl={data.video?.url}
                themeColor={data.video?.themeColor}
                textColor={data.video?.textColor}
                buttonColor={data.video?.buttonColor}
                buttonTextColor={data.video?.buttonTextColor}
                onPlay={() => {}}
             />
          </div>
        );

      case 'mp3':
         return (
           <div className="w-full h-full rounded-none overflow-hidden">
             <AudioProfilePreview 
                companyName={data.mp3?.companyName}
                title={data.mp3?.title}
                description={data.mp3?.description}
                name={data.mp3?.name}
                artist={data.mp3?.artist as any || 'Podcast Guest'}
                audioUrl={data.mp3?.url}
                themeColor={data.mp3?.themeColor}
                textColor={data.mp3?.textColor}
                buttonColor={data.mp3?.buttonColor}
                buttonTextColor={data.mp3?.buttonTextColor}
                buttonText={data.mp3?.buttonText}
             />
           </div>
         );

      case 'app':
         return (
           <div className="w-full h-full rounded-none overflow-hidden">
             <AppStorePreview 
                title={data.app?.title}
                description={data.app?.description}
                icon={data.app?.icon}
                iosUrl={data.app?.ios}
                androidUrl={data.app?.android}
                themeColor={data.app?.themeColor}
             />
           </div>
         );

      case 'form':
        if (submitted) {
          return (
            <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-100">
                 <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                 <h1 className="text-lg font-normal text-gray-900 mb-4">Thank You!</h1>
                 <p className="text-gray-500 font-normal px-4">Your response has been successfully submitted and saved.</p>
              </div>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-blue-600 font-normal text-xs uppercase tracking-widest hover:underline"
              >
                 Submit Another Response
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 sm:p-12">
             <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                   <ClipboardList className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-normal text-gray-900 mb-2">{data.form?.title || 'Form'}</h1>
                {data.form?.description && (
                  <p className="text-gray-500 text-sm font-normal leading-relaxed">{data.form.description}</p>
                )}
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                {data.form?.fields.sort((a, b) => a.order - b.order).map((field) => (
                  <div key={field.id} className="space-y-2">
                     <label className="text-xs font-normal text-gray-400 uppercase tracking-widest pl-1 block">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                     </label>
                     
                     {field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number' ? (
                        <input 
                          type={field.type}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={answers[field.id] || ''}
                          onChange={(e) => {
                            setAnswers({ ...answers, [field.id]: e.target.value });
                            if (fieldErrors[field.id]) {
                              const newErrors = { ...fieldErrors };
                              delete newErrors[field.id];
                              setFieldErrors(newErrors);
                            }
                          }}
                          className={cn(
                            "w-full px-6 py-4 bg-gray-50 border-2 focus:border-blue-600 focus:bg-white rounded-2xl outline-none text-gray-900 font-normal transition-all shadow-inner",
                            fieldErrors[field.id] ? "border-red-500 bg-red-50/10" : "border-transparent"
                          )}
                        />
                     ) : field.type === 'range' ? (
                        <div className="space-y-4 pt-2">
                           <input 
                             type="range"
                             min={field.validation?.min || 0}
                             max={field.validation?.max || 10}
                             step={field.validation?.step || 1}
                             value={answers[field.id] || field.validation?.min || 0}
                             onChange={(e) => {
                               setAnswers({ ...answers, [field.id]: parseInt(e.target.value) });
                               if (fieldErrors[field.id]) {
                                 const newErrors = { ...fieldErrors };
                                 delete newErrors[field.id];
                                 setFieldErrors(newErrors);
                               }
                             }}
                             className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                           />
                           <div className="flex justify-between text-[10px] font-normal text-gray-400 uppercase">
                              <span>Min: {field.validation?.min || 0}</span>
                              <span className="text-blue-600 text-sm">Value: {answers[field.id] || field.validation?.min || 0}</span>
                              <span>Max: {field.validation?.max || 10}</span>
                           </div>
                        </div>
                     ) : field.type === 'checkbox' ? (
                        <div className="space-y-3">
                           {field.options && field.options.length > 0 ? (
                             <div className="grid grid-cols-1 gap-3">
                                {field.options.map((opt) => {
                                   const isChecked = Array.isArray(answers[field.id]) && answers[field.id].includes(opt.value);
                                   return (
                                     <label key={opt.value} className={cn(
                                       "flex items-center gap-3 p-4 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border-2",
                                       isChecked ? "bg-blue-50/50 border-blue-600/20" : "bg-gray-50 border-transparent"
                                     )}>
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                             const current = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                                             const next = e.target.checked 
                                               ? [...current, opt.value]
                                               : current.filter((v: string) => v !== opt.value);
                                             setAnswers({ ...answers, [field.id]: next });
                                             if (fieldErrors[field.id]) {
                                               const newErrors = { ...fieldErrors };
                                               delete newErrors[field.id];
                                               setFieldErrors(newErrors);
                                             }
                                          }}
                                          className="w-5 h-5 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-blue-600"
                                        />
                                        <span className={cn("text-sm font-normal transition-colors", isChecked ? "text-blue-900" : "text-gray-700")}>
                                          {opt.label}
                                        </span>
                                     </label>
                                   );
                                })}
                             </div>
                           ) : (
                             <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors border border-transparent">
                                <input 
                                  type="checkbox"
                                  checked={!!answers[field.id]}
                                  onChange={(e) => {
                                    setAnswers({ ...answers, [field.id]: e.target.checked });
                                    if (fieldErrors[field.id]) {
                                      const newErrors = { ...fieldErrors };
                                      delete newErrors[field.id];
                                      setFieldErrors(newErrors);
                                    }
                                  }}
                                  className="w-5 h-5 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className="text-sm font-normal text-gray-700">{field.placeholder || 'Check this option'}</span>
                             </label>
                           )}
                        </div>
                     ) : field.type === 'select' ? (
                        <div className="relative">
                          <select 
                            required={field.required}
                            value={answers[field.id] || ''}
                            onChange={(e) => {
                              setAnswers({ ...answers, [field.id]: e.target.value });
                              if (fieldErrors[field.id]) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors[field.id];
                                setFieldErrors(newErrors);
                              }
                            }}
                            className={cn(
                              "w-full px-6 py-4 bg-gray-50 border-2 focus:border-blue-600 focus:bg-white rounded-2xl outline-none text-gray-900 font-normal transition-all shadow-inner appearance-none",
                              fieldErrors[field.id] ? "border-red-500 bg-red-50/10" : "border-transparent"
                            )}
                          >
                             <option value="" disabled>{field.placeholder || 'Select an option...'}</option>
                             {field.options?.map((opt) => (
                               <option key={opt.value} value={opt.value}>{opt.label}</option>
                             ))}
                          </select>
                          <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none rotate-90" />
                        </div>
                     ) : field.type === 'radio' ? (
                        <div className="space-y-3">
                           {field.options?.map((opt) => (
                             <label key={opt.value} className={cn(
                               "flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2",
                               answers[field.id] === opt.value ? "bg-blue-50 border-blue-600" : "bg-gray-50 border-transparent hover:bg-gray-100"
                             )}>
                                <input 
                                  type="radio"
                                  name={field.id}
                                  checked={answers[field.id] === opt.value}
                                  onChange={() => {
                                    setAnswers({ ...answers, [field.id]: opt.value });
                                    if (fieldErrors[field.id]) {
                                      const newErrors = { ...fieldErrors };
                                      delete newErrors[field.id];
                                      setFieldErrors(newErrors);
                                    }
                                  }}
                                  className="w-5 h-5 border-2 border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className={cn(
                                  "text-sm font-normal",
                                  answers[field.id] === opt.value ? "text-blue-900" : "text-gray-700"
                                )}>{opt.label}</span>
                             </label>
                           ))}
                        </div>
                     ) : null}
                     {field.helpText && <p className="text-[10px] font-normal text-gray-400 pl-1">{field.helpText}</p>}
                     {fieldErrors[field.id] && (
                        <p className="text-[11px] font-normal text-red-500 pl-1 animate-in slide-in-from-top-1 duration-200">
                          {fieldErrors[field.id]}
                        </p>
                      )}
                  </div>
                ))}

                <button 
                  type="submit"
                  disabled={submitMutation.isPending || isWizardPreview}
                  className="w-full py-5 bg-blue-600 text-white rounded-[32px] font-normal text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                   {submitMutation.isPending ? 'Submitting...' : 'Submit Response'}
                   {!submitMutation.isPending && <ChevronRight className="w-6 h-6" />}
                </button>
             </form>
          </div>
        );
      case 'business':
        return (
          <div className="flex-1 flex flex-col relative bg-white">
             {/* Banner with Content Inside */}
             <div 
               className="h-60 rounded-b-[48px] relative overflow-hidden flex flex-col items-center justify-start text-center px-6 pt-10"
               style={{ backgroundColor: data.business?.themeColor || '#1e293b' }}
             >
                {data.business?.banner && (
                   <img src={data.business.banner} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Banner" />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                   {/* Logo */}
                   <div className="w-20 h-20 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white flex items-center justify-center mb-4">
                      {data.business?.logo ? (
                         <img src={data.business.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                         <Building2 className="w-10 h-10 text-gray-300" />
                      )}
                   </div>

                   <h1 className="text-2xl font-medium text-white tracking-tight mb-1 drop-shadow-md">
                      {data.business?.companyName || 'Business Name'}
                   </h1>
                   {data.business?.headline && (
                      <p className="text-[13px] text-white/90 font-normal leading-relaxed drop-shadow-md max-w-xs">
                         {data.business.headline}
                      </p>
                   )}
                </div>
             </div>

             <div className="relative z-20 flex flex-col px-6">
                 {/* Contact Actions Row - Overlapping Banner */}
                 <div className="flex items-center justify-center gap-4 -mt-10 mb-8">
                    {data.business?.contact?.phone && (
                       <a 
                         href={`tel:${data.business.contact.phone}`} 
                         className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-50"
                         style={{ color: data.business.accentColor || '#2563eb' }}
                       >
                          <Phone className="w-6 h-6" />
                       </a>
                    )}
                    {data.business?.contact?.email && (
                       <a 
                         href={`mailto:${data.business.contact.email}`} 
                         className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-50"
                         style={{ color: data.business.accentColor || '#2563eb' }}
                       >
                          <Mail className="w-6 h-6" />
                       </a>
                    )}
                    {data.business?.contact?.website && (
                       <a 
                         href={ensureAbsoluteUrl(data.business.contact.website)} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-50"
                         style={{ color: data.business.accentColor || '#2563eb' }}
                       >
                          <Globe className="w-6 h-6" />
                       </a>
                    )}
                 </div>

                 <div className="space-y-6">
                    {data.business?.about && (
                       <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                          <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-2">About Us</p>
                          <p className="text-sm font-normal text-gray-700 leading-relaxed">
                             {data.business.about}
                          </p>
                       </div>
                    )}

                    {data.business?.contact?.address && (
                       <div className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-[28px] shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                             <MapPin className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                             <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest mb-1">Location</p>
                             <p className="text-sm font-normal text-gray-900 leading-tight">
                                {data.business.contact.address}
                             </p>
                          </div>
                       </div>
                    )}

                    {data.business?.openingHours && Object.values(data.business.openingHours).some((v) => !!v) && (
                       <div className="bg-white border border-gray-100 rounded-[28px] shadow-sm overflow-hidden">
                          <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                             <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-gray-400" />
                             </div>
                             <p className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">Opening Hours</p>
                          </div>
                          <div className="p-4 space-y-2.5">
                             {(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as Array<keyof NonNullable<typeof data.business.openingHours>>).map((day) => {
                                const hours = data.business!.openingHours![day];
                                if (!hours) return null;
                                
                                const formatHours = (h: any) => {
                                  if (typeof h === 'string') return h;
                                  if (h.isClosed) return 'Closed';
                                  if (h.from && h.to) return `${h.from} - ${h.to}`;
                                  return null;
                                };

                                const displayHours = formatHours(hours);
                                if (!displayHours) return null;

                                return (
                                   <div key={day} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                      <span className="text-xs font-normal text-gray-400 capitalize">{day}</span>
                                      <span className="text-xs font-normal text-gray-900">{displayHours}</span>
                                   </div>
                                );
                             })}
                          </div>
                       </div>
                    )}
                 </div>
                 <div className="h-8"></div>
             </div>
          </div>
        );

      case 'menu':
        return (
          <MenuPreview 
            data={data.menu} 
            onSubmit={async (orderData) => {
              if (isWizardPreview) return;
              await submitMutation.mutateAsync(orderData);
            }}
            isSubmitting={submitMutation.isPending}
          />
        );

      case 'coupon':
        return (
          <div className="space-y-8 p-8 sm:p-12">
             <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-200">
                   <Ticket className="w-12 h-12" />
                </div>
                <h1 className="text-lg font-normal text-gray-900 mb-2">
                   {data.coupon?.title || 'Special Offer!'}
                </h1>
                {data.coupon?.companyName && (
                   <p className="text-gray-500 text-sm font-normal uppercase tracking-widest">{data.coupon.companyName}</p>
                )}
             </div>

             <div className="bg-white p-1 rounded-[40px] border-2 border-dashed border-orange-200 shadow-xl shadow-orange-100">
                <div className="bg-orange-50 rounded-[36px] p-8 text-center space-y-6">
                   {data.coupon?.discount && (
                      <div className="inline-block px-6 py-2 bg-orange-100 text-orange-600 rounded-full font-normal text-xl tracking-tight">
                         {data.coupon.discount}
                      </div>
                   )}
                   
                   {data.coupon?.description && (
                      <p className="text-sm font-normal text-orange-900 leading-relaxed">
                         {data.coupon.description}
                      </p>
                   )}

                   {data.coupon?.promoCode && (
                      <div className="pt-4 space-y-2">
                         <p className="text-[10px] font-normal text-orange-400 uppercase tracking-widest">Your Promo Code</p>
                         <div className="font-mono text-2xl font-normal text-gray-900 tracking-wider bg-white py-4 px-6 rounded-2xl border-2 border-gray-100 inline-block shadow-sm">
                            {data.coupon.promoCode}
                         </div>
                      </div>
                   )}
                </div>
             </div>

             {data.coupon?.validUntil && (
                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-normal uppercase tracking-widest">
                   <Clock className="w-4 h-4" />
                   Valid until {new Date(data.coupon.validUntil).toLocaleDateString()}
                </div>
             )}

             <button 
               onClick={() => {
                 if (data.coupon?.promoCode) {
                   navigator.clipboard.writeText(data.coupon.promoCode);
                   alert('Promo code copied!');
                 }
               }}
               className="w-full py-5 bg-gray-900 text-white rounded-[32px] font-normal text-lg shadow-2xl shadow-gray-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
             >
               Copy Code
             </button>
          </div>
        );
      case 'app':
        return <AppStorePreview {...data.app} />;
      case 'booking':
        return (
          <BookingProfilePreview 
            {...data.booking} 
            onSubmit={async (bookingData) => {
              if (isWizardPreview) return;
              await submitMutation.mutateAsync(bookingData);
            }}
            isSubmitting={submitMutation.isPending}
          />
        );
      default:
        return (
          <div className="text-center space-y-6 p-8 sm:p-12">
            <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-3xl flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-xl font-normal text-gray-900">Dynamic Content</h1>
              <p className="text-gray-500 mt-2">The content for this QR code is ready.</p>
            </div>
            <pre className="text-left text-xs bg-gray-50 p-4 rounded-xl overflow-auto border border-gray-100 max-h-48 font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (isWizardPreview || embedded) {
    if (data.type === 'whatsapp' || data.type === 'instagram' || data.type === 'facebook' || data.type === 'pdf' || data.type === 'video' || data.type === 'image' || data.type === 'mp3' || data.type === 'url' || data.type === 'wifi' || data.type === 'app' || data.type === 'booking') {
      return (
        <div className="w-full h-full">
           {renderContent()}
        </div>
      );
    }
    return (
      <div className="w-full h-full flex flex-col font-walsheim">
          {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 flex items-center justify-center font-walsheim">
      <div className="w-full max-w-[480px] bg-white rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-gray-50 relative overflow-hidden">


        {renderContent()}

        {!isWizardPreview && linkedQRCode && (
          <LinkedQRCard qr={linkedQRCode} />
        )}

        {/* Footer info */}
        <div className="mt-16 text-center px-8 sm:px-12 pb-12">
            <p className="text-[10px] font-normal text-gray-300 uppercase tracking-widest mb-4">Powered by QR Thrive Enterprise</p>
            <div className="flex justify-center gap-6 opacity-30">
               <Globe className="w-4 h-4" />
               <ShieldCheck className="w-4 h-4" />
               <Smartphone className="w-4 h-4" />
            </div>
        </div>

        {/* Background Decals */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50 -z-10" />
      </div>
    </div>
  );
};



export default DynamicView;
