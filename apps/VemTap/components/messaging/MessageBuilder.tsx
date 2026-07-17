'use client';

import React, { useState, useMemo } from 'react';
import { MessageChannel } from '@/lib/store/useMessagingStore';
import { useMessagingTemplates, useSendMessage } from '@/services/messaging/hooks';
import { Channel, AudienceType } from '@/services/messaging/types';
import { Users, Send, CheckCircle, Smartphone, MessageSquare, Mail, UserPlus, X, Check, Tag, ChevronDown, Trash2, ChevronRight, Search, ArrowLeft, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useMessagingVisitorsByBranch } from '@/services/visitors/hooks';
import { useBusinessForms } from '@/services/business-forms/hooks';
import Image from 'next/image';

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
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const sendMessage = useSendMessage();
    const { data: businessForms = [] } = useBusinessForms();
    const [channel, setChannel] = useState<MessageChannel>(defaultChannel || 'SMS');
    const channelApiMap: Record<MessageChannel, Channel> = {
        WhatsApp: 'WHATSAPP',
        SMS: 'SMS',
        Email: 'EMAIL',
    };
    const { data: templates = [] } = useMessagingTemplates(channelApiMap[channel]);

    // Business Branding Helper
    const businessName = user?.businessName || 'Your Business';
    const businessLogo = (user as any)?.businessLogo;
    // If a channel was explicitly passed, skip channel selection (step 1) and go to compose (step 2)
    const [step, setStep] = useState(defaultChannel ? 2 : 1);

    type RecipientMode = 'All' | 'Manual';

    // Form State
    const [messageName, setMessageName] = useState('');
    const [recipientMode, setRecipientMode] = useState<RecipientMode>('All');
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [modalTagFilter, setModalTagFilter] = useState<'all' | 'new' | 'returning'>('all');
    const [subject, setSubject] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [selectedFormId, setSelectedFormId] = useState<string>(searchParams.get('formId') || '');
    const [customContent, setCustomContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLiveEdit, setIsLiveEdit] = useState(false);

    const { data: visitors = [] } = useMessagingVisitorsByBranch();
    const totalVisitors = visitors.length;
    const countLabel = recipientMode === 'All' ? `${totalVisitors.toLocaleString()} Contacts` : `${selectedContactIds.length.toLocaleString()} Selected`;

    const selectedContacts = useMemo(() => 
        visitors.filter(v => selectedContactIds.includes(v.id)),
    [visitors, selectedContactIds]);

    const filteredModalContacts = useMemo(() => {
        let result = visitors;
        const query = modalSearch.toLowerCase().trim();
        if (query) {
            result = result.filter(v => 
                v.name?.toLowerCase().includes(query) || 
                v.phone?.includes(query)
            );
        }
        if (modalTagFilter !== 'all') {
            result = result.filter(v => {
                const visits = Number(v.visits) || 0;
                if (modalTagFilter === 'new') return visits <= 1;
                if (modalTagFilter === 'returning') return visits > 1;
                return true;
            });
        }
        return result;
    }, [visitors, modalSearch, modalTagFilter]);

    const toggleContact = (id: string) => {
        setSelectedContactIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleModalContact = (id: string) => {
        setTempSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAllModalContacts = () => {
        if (tempSelectedIds.length === filteredModalContacts.length) {
            setTempSelectedIds([]);
        } else {
            setTempSelectedIds(filteredModalContacts.map(v => v.id));
        }
    };

    const handleOpenModal = () => {
        setTempSelectedIds([...selectedContactIds]);
        setIsModalOpen(true);
    };

    const handleConfirmSelection = () => {
        setSelectedContactIds(tempSelectedIds);
        setIsModalOpen(false);
    };

    const eligibleForms = businessForms.filter((form) => form.isPublished && form.isActive);
    const selectedForm = eligibleForms.find((form) => form.id === selectedFormId) || null;
    const selectedFormCode = selectedForm?.uniqueCode?.trim() || '';
    const selectedFormLink =
        selectedFormCode && typeof window !== 'undefined'
            ? `${window.location.origin}/forms/${selectedFormCode}`
            : selectedFormCode
                ? `/forms/${selectedFormCode}`
                : '';
    const contentWithFormLink =
        selectedFormLink && customContent.trim()
            ? `${customContent.trim()}\n\nComplete this form: ${selectedFormLink}`
            : customContent;

    const handleSend = async () => {
        if (!customContent.trim() && !selectedTemplate) {
            toast.error('Please add content or select a template');
            return;
        }
        if (selectedFormId && !selectedFormCode) {
            toast.error('This form is missing a public code. Please republish the form to generate one.');
            return;
        }
        if (recipientMode === 'Manual' && selectedContactIds.length === 0) {
            toast.error('Please select at least one recipient');
            return;
        }

        const audienceType: AudienceType =
            recipientMode === 'All' ? 'ALL' : 'TAGGED';

        setIsSending(true);
        try {
            const response = await sendMessage.mutateAsync({
                channel: channelApiMap[channel],
                audienceType,
                templateId: selectedTemplate || undefined,
                content: selectedTemplate ? contentWithFormLink || undefined : contentWithFormLink,
                from: businessName,
                customerIds: recipientMode === 'Manual' ? selectedContactIds : undefined,
            });

            const costInfo = response.totalCost ? ` (Cost: ${response.totalCost} units)` : '';
            toast.success(`Message launched successfully!${costInfo}`);
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
                    <div className="space-y-4">
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 w-fit">
                            {(['All', 'Manual'] as RecipientMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setRecipientMode(mode)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        recipientMode === mode 
                                        ? 'bg-white text-primary shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        {recipientMode === 'All' && (
                            <div className="bg-gray-50 border border-gray-100 p-4 md:p-6 rounded-2xl flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="size-10 md:size-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary shrink-0">
                                        <Users size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-text-main leading-tight">All Contacts</p>
                                        <p className="text-xs text-text-secondary font-medium mt-0.5 truncate">{totalVisitors.toLocaleString()} visitors will receive this.</p>
                                    </div>
                                </div>
                                <CheckCircle className="text-primary shrink-0" size={24} />
                            </div>
                        )}

                        {recipientMode === 'Manual' && (
                            <div className="space-y-4">
                                <button 
                                    onClick={handleOpenModal}
                                    className="w-full h-14 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-bold text-sm hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
                                >
                                    <UserPlus size={20} />
                                    Select Visitors from List
                                </button>

                                {selectedContactIds.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                        {selectedContacts.map(contact => (
                                            <div key={contact.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 uppercase shrink-0">
                                                        {contact.name?.[0] || contact.email?.[0] || '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-text-main truncate">{contact.name || 'Unknown'}</p>
                                                        <p className="text-[10px] text-text-secondary font-medium">{contact.email || 'No email'}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => toggleContact(contact.id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
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
                                    .filter(t => t.channel === channelApiMap[channel])
                                    .map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-text-secondary mb-2 tracking-widest ml-1">Attach Form</label>
                            <select
                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={selectedFormId}
                                onChange={(e) => setSelectedFormId(e.target.value)}
                            >
                                <option value="">No form attached</option>
                                {eligibleForms.map((form) => (
                                    <option key={form.id} value={form.id}>{form.title}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-text-secondary mt-2">
                                When messaging is clicked, the selected form link is added to the outbound message automatically.
                            </p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-text-secondary mb-2 tracking-widest ml-1">Target Audience</label>
                            <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100 w-fit">
                                {(['All', 'Manual'] as RecipientMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setRecipientMode(mode)}
                                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                                            recipientMode === mode 
                                            ? 'bg-white text-primary shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {mode} {mode === 'Manual' && selectedContactIds.length > 0 ? `(${selectedContactIds.length})` : ''}
                                    </button>
                                ))}
                            </div>
                            {recipientMode === 'Manual' && (
                                <div className="mt-3 space-y-3">
                                    <button 
                                        onClick={handleOpenModal}
                                        className="w-full h-11 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 font-bold text-xs hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        <UserPlus size={16} />
                                        Select Visitors from List
                                    </button>
                                    {selectedContactIds.length > 0 && (
                                        <p className="text-[10px] font-bold text-primary">{selectedContactIds.length} visitor(s) selected</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {channel === 'Email' && (
                        <div>
                            <label className="block text-[10px] font-black uppercase text-text-secondary mb-2 tracking-widest ml-1">Email Subject</label>
                            <input
                                type="text"
                                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="Enter email subject line..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black uppercase text-text-secondary mb-2 tracking-widest ml-1">Message Content</label>
                        <div className="relative">
                            <textarea
                                className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/10 font-medium text-sm transition-all"
                                placeholder={`Type your ${channel} message here...`}
                                value={customContent}
                                onChange={(e) => setCustomContent(e.target.value)}
                            />
                            <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap max-w-[80%]">
                                {[
                                    { label: 'Name', value: '{Name}' },
                                    { label: 'First Name', value: '{FirstName}' },
                                    { label: 'Last Name', value: '{LastName}' },
                                    { label: 'Business', value: '{BusinessName}' },
                                    { label: 'Points', value: '{Points}' },
                                    { label: 'Email', value: '{Email}' },
                                    { label: 'Phone', value: '{Phone}' },
                                    { label: 'Link', value: '{Link}' },
                                ].map(variable => (
                                    <button
                                        key={variable.value}
                                        type="button"
                                        onClick={() => setCustomContent(prev => prev + variable.value)}
                                        className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-[10px] font-bold hover:bg-gray-50 hover:border-primary/30 transition-all shadow-sm active:scale-95"
                                    >
                                        + {variable.label}
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
                        {selectedForm && (
                            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Attached Form</p>
                                <p className="text-sm font-bold text-slate-900 mt-1">{selectedForm.title}</p>
                                <p className="text-xs text-slate-600 mt-1">{selectedFormLink}</p>
                            </div>
                        )}
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
                            content={contentWithFormLink}
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
                        <span className="font-bold text-text-main">{countLabel}</span>
                    </div>
                </div>
                {channel === 'Email' && subject && (
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                        <span className="text-sm font-bold text-text-secondary">Subject</span>
                        <span className="font-bold text-text-main text-right max-w-[60%] truncate">{subject}</span>
                    </div>
                )}
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <span className="text-sm font-bold text-text-secondary">Estimated Cost</span>
                    <span className="font-mono font-bold text-text-main">Calculated by backend</span>
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
                            content={contentWithFormLink}
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
                    disabled={isSending}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send size={18} />
                    )}
                    {'Launch Message'}
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className={`max-w-${step === 2 ? '5xl' : '2xl'} mx-auto pt-8 pb-32 md:pb-8 px-4`}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>

            {/* Manual Selection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full h-full md:h-auto md:max-w-4xl bg-white md:rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Select Visitors</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{tempSelectedIds.length} selected</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors md:hidden">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Header Filters */}
                        <div className="p-4 md:p-6 border-b border-gray-100 space-y-4 bg-gray-50/30">
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Search size={16} />
                                    </div>
                                    <input 
                                        type="text"
                                        placeholder="Search name or phone..."
                                        value={modalSearch}
                                        onChange={(e) => setModalSearch(e.target.value)}
                                        className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all shadow-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1 md:flex-none">
                                        <select 
                                            value={modalTagFilter}
                                            onChange={(e) => setModalTagFilter(e.target.value as 'all' | 'new' | 'returning')}
                                            className="appearance-none w-full h-11 pl-10 pr-10 border border-gray-200 rounded-xl text-slate-600 text-[11px] md:text-sm font-bold outline-none bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                                        >
                                            <option value="all">All Visitors</option>
                                            <option value="new">New</option>
                                            <option value="returning">Returning</option>
                                        </select>
                                        <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                    <button 
                                        onClick={toggleAllModalContacts}
                                        className="h-11 px-4 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-slate-600 shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 shrink-0"
                                    >
                                        <Check size={14} className={tempSelectedIds.length === filteredModalContacts.length ? 'text-primary' : 'text-slate-400'} />
                                        {tempSelectedIds.length === filteredModalContacts.length ? 'Deselect' : 'Select All'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="divide-y divide-gray-50">
                                {filteredModalContacts.map(contact => {
                                    const isSelected = tempSelectedIds.includes(contact.id);
                                    const isReturning = (Number(contact.visits) || 0) > 1;
                                    return (
                                        <div 
                                            key={contact.id}
                                            onClick={() => toggleModalContact(contact.id)}
                                            className={`flex items-center gap-3 p-4 transition-all cursor-pointer ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                                isSelected ? 'bg-primary border-primary' : 'border-gray-200 bg-white'
                                            }`}>
                                                {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                            </div>
                                            
                                            <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-primary uppercase shrink-0">
                                                {contact.name?.[0] || contact.email?.[0] || '?'}
                                            </div>
                                            
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800 truncate">{contact.name || 'Unknown'}</span>
                                                    <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md shrink-0 ${
                                                        isReturning 
                                                        ? 'bg-emerald-50 text-emerald-600' 
                                                        : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        {isReturning ? 'Returning' : 'New'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{contact.email || 'No email'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {filteredModalContacts.length === 0 && (
                                    <div className="p-12 text-center">
                                        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">No visitors found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-0">
                            <div className="flex items-center justify-between w-full md:w-auto md:gap-6">
                                <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-black border border-primary/20">
                                    {tempSelectedIds.length.toLocaleString()} selected
                                </div>
                                <button 
                                    onClick={() => setTempSelectedIds([])}
                                    className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-xs font-bold transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Clear
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 md:flex-none h-11 px-6 border border-gray-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmSelection}
                                    className="flex-[1.5] md:flex-none h-11 px-8 bg-primary text-white text-sm font-black rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    Confirm
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
