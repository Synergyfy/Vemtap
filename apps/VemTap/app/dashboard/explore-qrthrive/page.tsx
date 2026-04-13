'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { motion } from 'framer-motion';
import { 
    Zap, 
    QrCode, 
    Users, 
    BarChart3, 
    Smartphone, 
    Target, 
    ArrowRight, 
    CheckCircle2,
    ShieldCheck,
    Globe,
    FileText,
    Mail,
    Wifi,
    Palette,
    Frame,
    Image as ImageIcon,
    ChevronRight,
    ChevronLeft,
    Video,
    User,
    SmartphoneNfc,
    Music,
    Building2,
    UtensilsCrossed,
    Link2,
    Ticket,
    Phone,
    Calendar,
    LayoutGrid,
    type LucideIcon,
    ExternalLink
} from 'lucide-react';
import WhatsAppChatPreview from '@/components/WhatsAppChatPreview';
import InstagramProfilePreview from '@/components/InstagramProfilePreview';
import FacebookProfilePreview from '@/components/FacebookProfilePreview';
import PDFProfilePreview from '@/components/PDFProfilePreview';
import VideoProfilePreview from '@/components/VideoProfilePreview';
import PhotoProfilePreview from '@/components/PhotoProfilePreview';
import SocialsProfilePreview from '@/components/SocialsProfilePreview';
import MenuPreview from '@/components/MenuPreview';
import AudioProfilePreview from '@/components/AudioProfilePreview';
import WebsiteProfilePreview from '@/components/WebsiteProfilePreview';
import WifiProfilePreview from '@/components/WifiProfilePreview';
import AppStorePreview from '@/components/AppStorePreview';
import BookingProfilePreview from '@/components/BookingProfilePreview';
// import UserProfilePreview from '@/components/VCardProfilePreview'; // REMOVED

const DynamicView = ({ data, isWizardPreview }: { data: any; isWizardPreview?: boolean }) => {
    const getPreviewForType = (type: string) => {
        switch (type) {
            case 'url':
                return <WebsiteProfilePreview url={data.url} />;
            case 'vcard':
                return (
                    <div className="space-y-6 text-center p-8">
                        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                            <User className="w-10 h-10" />
                        </div>
                        <h1 className="text-xl font-normal text-gray-900 mb-2">{data.vcard?.firstName || 'John'} {data.vcard?.lastName || 'Doe'}</h1>
                        <p className="text-gray-400 text-[10px] font-normal uppercase tracking-widest">Digital Contact Card</p>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">{data.vcard?.email || 'email@example.com'}</p>
                            <p className="text-sm text-gray-500">{data.vcard?.mobile || '+1 (555) 123-4567'}</p>
                        </div>
                    </div>
                );
            case 'wifi':
                return <WifiProfilePreview ssid={data.wifi?.ssid} password={data.wifi?.password} />;
            case 'email':
                return <div className="p-8 text-center text-gray-500">Email Preview ({data.email?.address})</div>;
            case 'phone':
                return <div className="p-8 text-center text-gray-500">Call Preview ({data.phone?.number})</div>;
            case 'text':
                return <div className="p-8 text-center text-gray-500">Text Preview ({data.text})</div>;
            case 'facebook':
                return <FacebookProfilePreview />;
            case 'instagram':
                return <InstagramProfilePreview username={data.social?.username || ''} />;
            case 'whatsapp':
                return <WhatsAppChatPreview number={data.whatsapp?.phoneNumber || ''} message={data.whatsapp?.message || ''} />;
            case 'pdf':
                return <PDFProfilePreview onView={() => {}} />;
            case 'video':
                return <VideoProfilePreview onPlay={() => {}} />;
            case 'image':
                return <PhotoProfilePreview />;
            case 'mp3':
                return <AudioProfilePreview />;
            case 'app':
                return <AppStorePreview />;
            case 'booking':
                return <BookingProfilePreview />;
            default:
                return (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-6">
                        <div className="w-32 h-32 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 relative">
                            <div className="absolute inset-4 border-4 border-gray-200 rounded-md"></div>
                            <LayoutGrid className="w-8 h-8 text-gray-200" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-gray-900">Select a QR Type</h3>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Preview will appear here</p>
                        </div>
                    </div>
                );
        }
    };
    return (
        <div className="min-h-full animate-in fade-in slide-in-from-bottom-5 duration-700 flex flex-col relative w-full h-full">
            {getPreviewForType(data.type)}
        </div>
    );
};
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type QRType = 'url' | 'pdf' | 'links' | 'vcard' | 'business' | 'video' | 'image' | 'facebook' | 'instagram' | 'socials' | 'whatsapp' | 'mp3' | 'menu' | 'app' | 'coupon' | 'booking' | 'wifi' | 'email' | 'text' | 'phone' | 'sms';

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
    { id: 'business', icon: Building2, title: 'Business', description: 'Share information about your business', category: 'dynamic' },
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

const SYNERGY_POINTS = [
    {
        title: "Dynamic QR Intelligence",
        desc: "Convert physical traffic into digital leads with QRThrive's high-conversion dynamic codes.",
        icon: QrCode,
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        title: "Customer Data Mastery",
        desc: "Manage and nurture those leads into loyal customers using Vemtap's robust CRM tools.",
        icon: Users,
        color: "text-purple-600",
        bg: "bg-purple-50"
    },
    {
        title: "Full-Loop Analytics",
        desc: "Track everything from the first scan in QRThrive to the final conversion in Vemtap.",
        icon: BarChart3,
        color: "text-emerald-600",
        bg: "bg-emerald-50"
    }
];

const FEATURES = [
    { 
        name: "Instant Scan Tracking", 
        desc: "Know exactly who scans your codes and when they do it.",
        from: "QRThrive", 
        to: "Vemtap" 
    },
    { 
        name: "Dynamic Updates", 
        desc: "Change your website links anytime without re-printing your QR codes.",
        from: "QRThrive", 
        to: "Vemtap" 
    },
    { 
        name: "Auto-Lead Capture", 
        desc: "Automatically save customer info the moment they scan your asset.",
        from: "Vemtap", 
        to: "QRThrive" 
    },
    { 
        name: "Perfect Design Match", 
        desc: "A smooth, matching look from the first scan to the final signup.",
        from: "Both", 
        to: "Shared" 
    },
];

export default function ExploreQRThrivePage() {
    const [step, setStep] = useState<'type' | 'content' | 'design'>('type');
    const [hoveredType, setHoveredType] = useState<QRType | null>(null);
    const [selectedType, setSelectedType] = useState<QRType | null>(null);
    const [designTab, setDesignTab] = useState<'shape' | 'frame' | 'logo'>('shape');
    const [showExploreModal, setShowExploreModal] = useState(false);

    const handleTypeSelect = (type: QRType) => {
        setSelectedType(type);
        setStep('content');
    };

    const handleNext = () => {
        if (step === 'type' && selectedType) setStep('content');
        else if (step === 'content') setStep('design');
    };

    const handleBack = () => {
        if (step === 'content') setStep('type');
        else if (step === 'design') setStep('content');
    };

    const selectedTypeData = qrTypes.find(t => t.id === selectedType);

    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-16 pb-20">
            <PageHeader 
                title="Explore QRThrive" 
                description="The ultimate power-up for your physical-to-digital business ecosystem."
            />

            <section className="bg-white rounded-[40px] shadow-[0_30px_1000px_rgba(37,99,235,0.06)] border border-gray-100 flex flex-col lg:flex-row relative min-h-[600px] lg:min-h-[700px] overflow-visible">
                <div className="flex-1 min-w-0 p-5 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-1.5">
                            {(['type', 'content', 'design'] as const).map((s, idx) => (
                                <div key={s} className="flex items-center">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all",
                                        step === s ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
                                        (idx < ['type', 'content', 'design'].indexOf(step) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400")
                                    )}>
                                        {idx + 1}
                                    </div>
                                    {idx < 2 && (
                                        <div className={cn(
                                            "w-6 h-0.5 mx-1 rounded-full",
                                            idx < ['type', 'content', 'design'].indexOf(step) ? "bg-gray-900" : "bg-gray-100"
                                        )} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="h-4 w-px bg-gray-100 mx-2" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-none">
                                {step === 'type' && "Choose Type"}
                                {step === 'content' && "Add Content"}
                                {step === 'design' && "Design QR"}
                            </h2>
                        </div>
                    </div>

                    <div className="flex-1">
                        {step === 'type' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {qrTypes.map(type => (
                                        <button
                                            key={type.id}
                                            onMouseEnter={() => setHoveredType(type.id)}
                                            onMouseLeave={() => setHoveredType(null)}
                                            onClick={() => {
                                                setSelectedType(type.id);
                                                setHoveredType(null);
                                                handleNext();
                                            }}
                                            className={cn(
                                                "flex flex-col items-center text-center p-4 rounded-[24px] border-2 transition-all hover:scale-[1.02] active:scale-[0.98] group relative",
                                                selectedType === type.id 
                                                    ? "border-blue-600 bg-blue-50/10 shadow-sm" 
                                                    : "border-gray-50 bg-gray-50/50 hover:border-blue-100"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-2",
                                                selectedType === type.id 
                                                    ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                                                    : "bg-white text-gray-400 group-hover:text-blue-600"
                                            )}>
                                                <type.icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-gray-900 text-[11px] tracking-tight mb-1">{type.title}</span>
                                            <span className="text-[9px] text-gray-500 leading-tight px-1">{type.description}</span>
                                            {type.category === 'dynamic' && (
                                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 'content' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-[32px] p-8 border border-blue-100">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                                            {selectedTypeData && <selectedTypeData.icon className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{selectedTypeData?.title}</h3>
                                            <p className="text-sm text-gray-500">{selectedTypeData?.description}</p>
                                        </div>
                                        {selectedTypeData?.category === 'dynamic' && (
                                            <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full">
                                                Dynamic
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white">
                                        <div className="space-y-4">
                                            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                                            <div className="h-12 bg-gray-100 rounded-xl animate-pulse w-3/4" />
                                            <div className="h-12 bg-gray-100 rounded-xl animate-pulse w-1/2" />
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                        <div className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-amber-900">Explore Mode</p>
                                                <p className="text-xs text-amber-700 mt-1">This is a preview of the QRThrive interface. To create your QR code, visit QRThrive.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'design' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                <div className="flex bg-gray-100 p-1 rounded-2xl">
                                    {(['shape', 'frame', 'logo'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setDesignTab(tab)}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                designTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                            )}
                                        >
                                            {tab === 'shape' && <Palette className="w-4 h-4" />}
                                            {tab === 'frame' && <Frame className="w-4 h-4" />}
                                            {tab === 'logo' && <ImageIcon className="w-4 h-4" />}
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-50">
                                    {designTab === 'shape' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">Dot Style</h4>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {['square', 'dots', 'rounded', 'classy'].map(style => (
                                                            <div key={style} className="aspect-square bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-center">
                                                                <div className={cn(
                                                                    "w-6 h-6 bg-gray-900",
                                                                    style === 'dots' && "rounded-full",
                                                                    style === 'rounded' && "rounded-md",
                                                                    style === 'classy' && "rounded-sm"
                                                                )} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">Corner Style</h4>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {['square', 'dot', 'extra-rounded'].map(style => (
                                                            <div key={style} className="aspect-square bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-center">
                                                                <div className={cn(
                                                                    "w-6 h-6 bg-gray-900",
                                                                    style === 'dot' && "rounded-full",
                                                                    style === 'extra-rounded' && "rounded-2xl",
                                                                    style === 'square' && "rounded-none"
                                                                )} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">Colors</h4>
                                                    <div className="grid grid-cols-6 gap-2">
                                                        {['#000000', '#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706'].map(color => (
                                                            <div key={color} className="aspect-square rounded-xl border-2 border-gray-100 cursor-pointer hover:scale-110 transition-transform"
                                                                style={{ backgroundColor: color }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {designTab === 'frame' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {['none', 'banner-bottom', 'banner-top', 'tooltip'].map(frame => (
                                                <div key={frame} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-center">
                                                    <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center">
                                                        <QrCode className="w-12 h-12 text-gray-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {designTab === 'logo' && (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">Upload your logo to brand your QR code</p>
                                            <div className="mt-4 inline-flex px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">
                                                Choose Image
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-8 border-t border-gray-50 flex items-center justify-between sticky bottom-0 bg-white/80 backdrop-blur-md pb-6 lg:static lg:bg-transparent lg:pb-0 z-40">
                        <button
                            onClick={handleBack}
                            disabled={step === 'type'}
                            className={cn(
                                "px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                                step === 'type' ? "opacity-0 pointer-events-none" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        
                        {step === 'design' ? (
                            <a
                                href="https://qr-thrive.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-10 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 active:scale-95"
                            >
                                Create on QRThrive
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="px-10 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 active:scale-95"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-[440px] bg-[#F8FAFC] relative shrink-0 transition-all duration-500 overflow-hidden self-stretch hidden lg:block">
                    <div className="lg:sticky lg:top-28 w-full p-6 sm:p-10 lg:p-12 flex flex-col items-center">
                        {step === 'design' ? (
                            <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
                                <div className="flex items-center justify-center gap-3 mb-8">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-200">3</div>
                                    <h2 className="text-xl font-bold text-gray-900">Preview & Download</h2>
                                </div>

                                <div className="w-full max-w-[280px] mb-10 transform group transition-all duration-500 hover:scale-[1.02]">
                                    <div className="bg-white p-6 rounded-[40px] shadow-2xl shadow-blue-100/50 border border-white aspect-square flex items-center justify-center relative">
                                        <div className="absolute inset-6 border-4 border-dashed border-gray-100 rounded-3xl" />
                                        <QrCode className="w-32 h-32 text-gray-300" strokeWidth={1.5} />
                                    </div>
                                </div>

                                <div className="w-full space-y-4 max-w-[280px]">
                                    <a
                                        href="https://qr-thrive.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                                    >
                                        <Zap className="w-4 h-4" />
                                        Generate on QRThrive
                                    </a>
                                    <div className="flex items-center justify-center gap-2 py-3 bg-white rounded-xl border border-gray-200 text-gray-600 text-xs font-bold">
                                        <span className="text-emerald-500">●</span>
                                        Preview Only - Visit QRThrive to Create
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative group animate-in fade-in slide-in-from-right-8 duration-700 w-full flex flex-col items-center">
                                <div className="relative w-[280px] h-[575px] sm:w-[300px] sm:h-[615px] bg-gray-900 rounded-[50px] p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] border-[1px] border-gray-800 overflow-hidden shrink-0 scale-90 sm:scale-100 origin-top">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-xl z-40 border-x border-b border-gray-800" />
                                    
                                    <div className="relative w-full h-full rounded-[40px] overflow-hidden flex flex-col bg-white">
                                        <div className="h-8 px-6 flex items-center justify-between text-[9px] font-bold text-gray-900 pt-2 shrink-0">
                                            <span>9:41</span>
                                            <div className="flex gap-1 items-center">
                                                <Wifi className="w-2.5 h-2.5" />
                                                <div className="w-4 h-2 border border-gray-900 rounded-[2px] p-[0.5px]">
                                                    <div className="w-full h-full bg-gray-900 rounded-[0.5px]" />
                                                </div>
                                            </div>
                                        </div>

                        <div className="flex-1 overflow-y-auto hidden-scrollbar flex flex-col relative">
                            {(step === 'type' ? (hoveredType || selectedType) : selectedType) ? (
                                <div key={step === 'type' ? (hoveredType || selectedType) : selectedType} className="min-h-full animate-in fade-in slide-in-from-bottom-5 duration-700 flex flex-col">
                                    <DynamicView 
                                        data={step === 'type' && hoveredType ? { type: hoveredType } as any : 
                                            {
                                                type: selectedType,
                                                url: selectedType === 'url' ? 'https://qr-thrive.com' : undefined,
                                                text: selectedType === 'text' ? 'Explore QRThrive capabilities' : undefined,
                                                wifi: selectedType === 'wifi' ? { ssid: 'QRThrive-Network', password: 'secure123', encryption: 'WPA' } : undefined,
                                                email: selectedType === 'email' ? { 
                                                    address: 'info@qr-thrive.com', 
                                                    subject: 'QR Inquiry', 
                                                    body: 'Hello, I scanned your QR code!' 
                                                } : undefined,
                                                phone: selectedType === 'phone' ? { number: '+1 (555) 123-4567' } : undefined,
                                                sms: selectedType === 'sms' ? { 
                                                    number: '+1 (555) 123-4567', 
                                                    message: 'Hello from QRThrive!' 
                                                } : undefined,
                                            } 
                                        } 
                                        isWizardPreview={true} 
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-6">
                                    <div className="w-32 h-32 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100 relative">
                                        <div className="absolute inset-4 border-4 border-gray-200 rounded-md"></div>
                                        <LayoutGrid className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-gray-900">Select a QR Type</h3>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Preview will appear here</p>
                                    </div>
                                </div>
                            )}
                        </div>
                                        <div className="h-1 w-20 bg-gray-900 rounded-full mx-auto mb-2 shrink-0" />
                                    </div>
                                </div>
                                
                                <div className="absolute -bottom-6 -right-6 lg:right-4 bg-white p-4 rounded-3xl shadow-xl border border-gray-50 flex items-center gap-3 animate-bounce">
                                    <div className="w-8 h-8 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                                        <Zap className="w-4 h-4 fill-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-900 uppercase leading-none">Explore Mode</p>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Preview only</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {SYNERGY_POINTS.map((point, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                    >
                        <div className={cn("size-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", point.bg, point.color)}>
                            <point.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{point.title}</h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{point.desc}</p>
                    </motion.div>
                ))}
            </section>

            <section className="bg-slate-50 rounded-[3rem] p-8 lg:p-16 border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-none">
                                How they work <br /> 
                                <span className="text-blue-600 italic">hand-in-hand.</span>
                            </h3>
                            <p className="text-lg text-gray-500 font-medium">
                                Think of QRThrive as your **Frontline Scout** and Vemtap as your **Command Center**.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex-shrink-0 size-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Lead Capture (QRThrive)</h4>
                                    <p className="text-xs text-gray-500 font-medium">Generate branded QR codes that link directly to your Vemtap capture pages.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex-shrink-0 size-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Data Retention (Vemtap)</h4>
                                    <p className="text-xs text-gray-500 font-medium">Once scanned, Vemtap takes over to manage profiles, loyalty, and communication.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex-shrink-0 size-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Universal Reach</h4>
                                    <p className="text-xs text-gray-500 font-medium">Deploy QR codes globally and track performance centrally in real-time.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[100px] -z-10" />
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-8">
                            <h4 className="text-center font-black text-gray-900 uppercase tracking-widest text-xs">Feature Synergy Matrix</h4>
                            <div className="space-y-4">
                                {FEATURES.map((feature, i) => (
                                    <div key={i} className="group p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-xl hover:border-blue-100 border border-transparent transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="size-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                                    <CheckCircle2 size={14} />
                                                </div>
                                                <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{feature.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded">{feature.from}</span>
                                                <ArrowRight size={10} className="text-slate-300" />
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[8px] font-black uppercase rounded">{feature.to}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium pl-9 italic group-hover:text-gray-900 transition-colors">
                                            {feature.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative group overflow-hidden rounded-[3rem] bg-slate-900 min-h-[500px] flex items-center">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />

                <div className="relative z-10 p-8 lg:p-20 max-w-2xl space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-widest"
                    >
                        <Zap size={14} className="fill-blue-400" />
                        Next-Gen Integration
                    </motion.div>
                    
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-none"
                    >
                        Bridging Physical <br />
                        <span className="text-blue-400">to Digital.</span>
                    </motion.h2>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-300 font-medium leading-relaxed"
                    >
                        Vemtap handles your data, QRThrive drives your traffic. Together, they create a closed-loop system that transforms every scan into a measurable business outcome.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <a 
                            href="https://qr-thrive.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
                        >
                            Visit QRThrive Platform
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </motion.div>
                </div>
            </section>

            <section className="bg-blue-600 text-white p-12 lg:p-20 rounded-[4rem] text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-32 -translate-y-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/40 rounded-full -translate-x-32 translate-y-32 blur-3xl" />
                
                <h3 className="text-4xl lg:text-5xl font-black tracking-tight relative z-10">Start Your Full-Circle Growth.</h3>
                <p className="text-xl text-blue-100 font-medium max-w-2xl mx-auto relative z-10">
                    Ready to take your business to the next level? Head over to QRThrive and start generating dynamic assets today.
                </p>
                <div className="pt-4 relative z-10">
                    <a 
                        href="https://qr-thrive.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-4 px-12 py-6 bg-white text-blue-600 rounded-[2rem] font-black uppercase tracking-widest text-lg hover:scale-105 transition-all shadow-2xl active:scale-95"
                    >
                        Launch QRThrive
                        <ArrowRight size={24} />
                    </a>
                </div>
            </section>
        </div>
    );
}