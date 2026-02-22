'use client';

import React, { useState } from 'react';
import { useMessagingStore, Template, MessageChannel } from '@/lib/store/useMessagingStore';
import { messagingApi } from '@/lib/api/messaging';
import { Users, FileText, Send, CheckCircle, Smartphone, MessageSquare, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Image from 'next/image';
import { useMockDashboardStore } from '@/lib/store/mockDashboardStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

interface MessageBuilderProps {
    /** When set, skip channel selection and go straight to compose */
    defaultChannel?: MessageChannel;
}

// Device-style Preview Component
function PhonePreview({
    channel,
    content,
    businessName,
    businessLogo,
    onContentChange,
    isEditable = false
}: {
    channel: MessageChannel,
    content: string,
    businessName: string,
    businessLogo?: string,
    onContentChange?: (val: string) => void,
    isEditable?: boolean
}) {
    return (
        <div className="relative w-[280px] h-[560px] bg-slate-900 rounded-[3rem] border-10 border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-700 shrink-0">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-30" />

            {/* Screen Content */}
            <div className={`w-full h-full pt-10 flex flex-col relative ${channel === 'WhatsApp' ? 'bg-[#efe7de] bg-[url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")] bg-repeat' :
                channel === 'Email' ? 'bg-gray-100' : 'bg-white'
                }`}>
                {/* App Header */}
                {channel === 'WhatsApp' ? (
                    <div className="bg-[#075E54] p-3 text-white flex items-center gap-2 z-20">
                        <div className="size-7 rounded-full bg-white flex items-center justify-center overflow-hidden border border-white/10 relative shadow-sm">
                            <Image
                                src={businessLogo || "/assets/VEMTAP_PNG.png"}
                                alt="Logo"
                                fill
                                className="object-contain p-0.5 bg-white"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <p className="text-[10px] font-bold leading-none truncate">{businessName}</p>
                                <span className="material-icons text-[8px] text-[#25D366]">verified</span>
                            </div>
                            <p className="text-[8px] opacity-70 mt-0.5">online</p>
                        </div>
                    </div>
                ) : channel === 'SMS' ? (
                    <div className="p-3 border-b border-gray-100 flex flex-col items-center gap-1 z-20 bg-white/80 backdrop-blur-md">
                        <div className="size-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-200 relative shadow-sm">
                            <Image
                                src={businessLogo || "/assets/VEMTAP_PNG.png"}
                                alt="Logo"
                                fill
                                className="object-contain p-1 bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-0.5">
                            <p className="text-[8px] font-black text-slate-900 truncate max-w-[150px] uppercase tracking-wider">{businessName}</p>
                            <span className="material-icons text-[7px] text-primary">verified</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-white border-b border-gray-200 flex items-center gap-2 z-20">
                        <div className="size-7 rounded-full bg-white flex items-center justify-center overflow-hidden border border-primary/5 relative shadow-sm">
                            <Image
                                src={businessLogo || "/assets/VEMTAP_PNG.png"}
                                alt="Logo"
                                fill
                                className="object-contain p-0.5 bg-white"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <p className="text-[8px] font-black leading-none truncate">{businessName} Support</p>
                                <span className="material-icons text-[7px] text-primary">verified</span>
                            </div>
                            <p className="text-[7px] text-gray-400 mt-0.5">To: Customer</p>
                        </div>
                    </div>
                )}

                {/* Message Area */}
                <div className="flex-1 p-3 overflow-auto custom-scrollbar">
                    {channel === 'Email' ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transform scale-95 origin-top">
                            <div className="p-2 border-b border-gray-50">
                                <p className="text-[8px] font-black text-gray-900">Exclusive Update from VemTap</p>
                            </div>
                            <div className="p-3 min-h-[100px]">
                                {isEditable ? (
                                    <textarea
                                        value={content}
                                        onChange={(e) => onContentChange?.(e.target.value)}
                                        className="w-full min-h-[150px] text-[10px] leading-relaxed outline-none border-none bg-transparent resize-none focus:ring-0 p-0 text-gray-700"
                                        placeholder="Type your email content..."
                                    />
                                ) : (
                                    <p className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap">{content || 'Your email content will appear here...'}</p>
                                )}
                            </div>
                            <div className="p-3 bg-gray-50 mt-2 text-center">
                                <button className="px-4 py-1.5 bg-primary text-white text-[8px] font-bold rounded-md pointer-events-none">
                                    Action Button
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`relative flex flex-col ${channel === 'WhatsApp' ? 'items-start' : 'items-start'}`}>
                            <div className={`
                                max-w-[85%] p-2.5 rounded-xl text-[10px] shadow-sm relative group
                                ${channel === 'WhatsApp' ? 'bg-[#dcf8c6] rounded-tl-none border border-[#c5e1a5]' : 'bg-gray-100 rounded-tl-none text-gray-800'}
                            `}>
                                {isEditable ? (
                                    <textarea
                                        value={content}
                                        onChange={(e) => onContentChange?.(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none resize-none focus:ring-0 p-0 text-[10px] min-h-[50px]"
                                        placeholder="Type message..."
                                    />
                                ) : (
                                    <p className="whitespace-pre-wrap">{content || 'Your message will appear here...'}</p>
                                )}
                                <p className="text-[7px] text-right mt-1 opacity-50 uppercase tracking-tighter">12:45</p>

                                {channel === 'WhatsApp' && (
                                    <div className="absolute top-0 -left-1.5 w-2 h-2 bg-[#dcf8c6] clip-path-whatsapp-tail" />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Bar Simulation */}
                {(channel === 'WhatsApp' || channel === 'SMS') && (
                    <div className="p-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                        <div className="flex-1 h-7 bg-white border border-gray-200 rounded-full px-3 text-[8px] flex items-center text-gray-400">
                            {channel === 'WhatsApp' ? 'Message' : 'iMessage'}
                        </div>
                        <div className={`size-7 rounded-full flex items-center justify-center ${channel === 'WhatsApp' ? 'bg-[#128C7E]' : 'bg-primary'} text-white`}>
                            <Send size={12} />
                        </div>
                    </div>
                )}
            </div>

            {/* Editing Indicator Badge */}
            {isEditable && (
                <div className="absolute top-16 right-3 bg-primary text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-pulse z-40 uppercase">
                    Preview
                </div>
            )}

            <style jsx>{`
                .clip-path-whatsapp-tail {
                    clip-path: polygon(100% 0, 0 0, 100% 100%);
                }
            `}</style>
        </div>
    );
}

export default function MessageBuilder({ defaultChannel }: MessageBuilderProps) {
    const router = useRouter();
    const { user } = useAuthStore();
    const { templates, wallets } = useMessagingStore();
    const currentBranchId = user?.businessId || 'bistro_001';
    const [channel, setChannel] = useState<MessageChannel>(defaultChannel || 'SMS');
    const wallet = wallets[channel];

    // Get audience data from mock store
    const { getFilteredVisitors } = useMockDashboardStore();

    // Business Branding Helper
    const businessName = user?.businessName || 'Your Business';
    const businessLogo = (user as any)?.businessLogo;
    // If a channel was explicitly passed, skip channel selection (step 1) and go to compose (step 2)
    const [step, setStep] = useState(defaultChannel ? 2 : 1);

    // Form State
    const [messageName, setMessageName] = useState('');
    const [audience, setAudience] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [templateCategory, setTemplateCategory] = useState('All');
    const [customContent, setCustomContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLiveEdit, setIsLiveEdit] = useState(false);

    // Dynamic Audience counts based on branch
    const getAudienceCount = () => {
        const branchVisitors = getFilteredVisitors(currentBranchId);
        if (audience === 'returning') return branchVisitors.filter((v: any) => v.status === 'returning').length;
        if (audience === 'new') return branchVisitors.filter((v: any) => v.status === 'new').length;
        if (audience === 'premium') return branchVisitors.filter((v: any) => v.status === 'returning' && (v.timestamp < Date.now() - 86400000)).length; // Mock logic
        return branchVisitors.length;
    };

    const count = getAudienceCount();
    const costPerMsg = channel === 'SMS' ? 2.5 : channel === 'WhatsApp' ? 4.0 : 0.5;
    const totalCost = count * costPerMsg;

    const handleSend = async () => {
        setIsSending(true);
        try {
            await messagingApi.sendBroadcast(
                messageName || 'Untitled Message',
                channel,
                count,
                selectedTemplate ? (templates.find(t => t.id === selectedTemplate)?.content || '') : customContent
            );
            toast.success('Message launched successfully!');
            router.push('/dashboard/messaging');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm border border-primary/20">1</span>
                Message Check
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-text-secondary mb-2">Message Name</label>
                    <input
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                        placeholder="e.g. Weekend Promo"
                        value={messageName}
                        onChange={(e) => setMessageName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-text-secondary mb-2">Select Broadcast Place</label>
                    <div className="grid grid-cols-3 gap-4">
                        {(['WhatsApp', 'SMS', 'Email'] as const).map((c) => (
                            <button
                                key={c}
                                onClick={() => setChannel(c)}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${channel === c ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                {c === 'WhatsApp' ? <MessageSquare size={24} className="text-green-500" /> : c === 'SMS' ? <Smartphone size={24} className="text-blue-500" /> : <Mail size={24} className="text-purple-500" />}
                                <span className="font-bold text-sm">{c}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase text-text-secondary mb-3">Target Audience</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            { id: 'returning', label: 'Returning Users', sub: `(${getFilteredVisitors(currentBranchId).filter((v: any) => v.status === 'returning').length})`, icon: Users },
                            { id: 'new', label: 'New Users', sub: `(${getFilteredVisitors(currentBranchId).filter((v: any) => v.status === 'new').length})`, icon: Smartphone },
                            { id: 'premium', label: 'Premium Users', sub: `(${getFilteredVisitors(currentBranchId).filter((v: any) => v.status === 'returning').length})`, icon: CheckCircle }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setAudience(opt.id)}
                                className={`p-4 rounded-2xl border-2 transition-all text-left ${audience === opt.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-sm text-text-main">{opt.label}</span>
                                    {audience === opt.id && <div className="size-4 bg-primary rounded-full flex items-center justify-center">
                                        <div className="size-1.5 bg-white rounded-full" />
                                    </div>}
                                </div>
                                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-tighter">{opt.sub}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={() => setStep(2)} className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20">
                    Next: Compose
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm border border-primary/20">2</span>
                Compose Message
            </h3>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 space-y-6 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-text-secondary mb-2 tracking-widest ml-1">Template</label>
                            <select
                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={selectedTemplate}
                                onChange={(e) => {
                                    const tplId = e.target.value;
                                    setSelectedTemplate(tplId);
                                    if (tplId) {
                                        const tpl = templates.find(t => t.id === tplId);
                                        if (tpl) setCustomContent(tpl.content);
                                    }
                                }}
                            >
                                <option value="">Write Custom Message...</option>
                                {templates
                                    .filter(t => (t.channel === channel || t.channel === 'Any') && (!t.branchId || t.branchId === currentBranchId))
                                    .map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-text-secondary mb-2 tracking-widest ml-1">Target Audience</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'returning', label: 'Returning', sub: getFilteredVisitors(currentBranchId).filter((v: any) => v.status === 'returning').length, icon: Users },
                                    { id: 'new', label: 'New', sub: getFilteredVisitors(currentBranchId).filter((v: any) => v.status === 'new').length, icon: Smartphone },
                                    { id: 'premium', label: 'Premium', sub: getFilteredVisitors(currentBranchId).filter((v: any) => v.status === 'returning').length, icon: CheckCircle }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setAudience(opt.id)}
                                        className={`py-2 px-1 rounded-xl border-2 transition-all text-center ${audience === opt.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-100 bg-white hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="font-bold text-[9px] text-text-main truncate w-full px-1">{opt.label}</span>
                                            <span className="text-[8px] text-text-secondary font-black opacity-60">({opt.sub})</span>
                                            {audience === opt.id && <div className="w-1.5 h-1.5 mt-0.5 bg-primary rounded-full" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase text-text-secondary mb-2 tracking-widest ml-1">Message Content</label>
                        <div className="relative">
                            <textarea
                                className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/10 font-medium text-sm transition-all"
                                placeholder={`Type your ${channel} message here...`}
                                value={customContent}
                                onChange={(e) => setCustomContent(e.target.value)}
                            />
                            <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
                                {['{Name}', '{BusinessName}', '{Points}'].map(variable => (
                                    <button
                                        key={variable}
                                        type="button"
                                        onClick={() => setCustomContent(prev => prev + variable)}
                                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-black hover:bg-primary-hover transition-all shadow-md active:scale-95"
                                    >
                                        + {variable.replace(/{|}/g, '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-[9px] text-text-secondary font-black uppercase tracking-widest flex items-center gap-1">
                                <span className="text-primary tracking-normal not-italic underline decoration-2 underline-offset-4">{businessName}</span> branding will be attached
                            </p>
                            <p className="text-[10px] text-text-secondary font-medium uppercase tracking-tighter">
                                Characters: <span className="text-primary font-black">{customContent.length}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <button onClick={() => setStep(1)} className="px-6 py-3 text-text-secondary hover:text-text-main font-bold">Back</button>
                        <button onClick={() => setStep(3)} className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20">
                            Next: Review
                        </button>
                    </div>
                </div>

                <div className="hidden lg:block sticky top-8">
                    <label className="block text-[10px] font-black uppercase text-text-secondary mb-4 tracking-widest text-center">Live Preview</label>
                    <PhonePreview
                        channel={channel}
                        content={customContent}
                        businessName={businessName}
                        businessLogo={businessLogo}
                        isEditable={false}
                    />
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold text-text-main">Ready to Send?</h3>
                <p className="text-text-secondary">Review your message details before launching.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span className="text-sm font-bold text-text-secondary">Message Name</span>
                    <span className="font-bold text-text-main">{messageName || 'Untitled'}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span className="text-sm font-bold text-text-secondary">Audience Size</span>
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        <span className="font-bold text-text-main">{count.toLocaleString()} Contacts</span>
                    </div>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span className="text-sm font-bold text-text-secondary">Estimated Cost</span>
                    <span className="font-mono font-bold text-text-main">{totalCost.toLocaleString()} {wallet.currency}</span>
                </div>
                <div className="pt-2">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <label className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Message Preview</label>
                        <button
                            onClick={() => setIsLiveEdit(!isLiveEdit)}
                            className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 transition-all ${isLiveEdit ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-text-secondary border-gray-100'
                                }`}
                        >
                            {isLiveEdit ? 'Finish Editing' : 'Live Edit Preview'}
                        </button>
                    </div>
                    <div className="flex justify-center py-4 bg-white rounded-3xl border border-gray-100 shadow-inner">
                        <PhonePreview
                            channel={channel}
                            content={customContent}
                            businessName={businessName}
                            businessLogo={businessLogo}
                            isEditable={isLiveEdit}
                            onContentChange={setCustomContent}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button onClick={() => setStep(2)} className="px-6 py-3 text-text-secondary hover:text-text-main font-bold">Back</button>
                <button
                    onClick={handleSend}
                    disabled={isSending || wallet.credits < totalCost}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send size={18} />
                    )}
                    {wallet.credits < totalCost ? 'Insufficient Funds' : 'Launch Message'}
                </button>
            </div>
        </div>
    );

    return (
        <div className={`max-w-${step === 2 ? '5xl' : '2xl'} mx-auto py-8 px-4`}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </div>
    );
}
