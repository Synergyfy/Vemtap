'use client';

import React, { useState, useMemo } from 'react';
import { useMessagingTemplates, useSendMessage, useMyCredits } from '@/services/messaging/hooks';
import { useMessagingVisitorsByBranch } from '@/services/visitors/hooks';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    Search, 
    Send, 
    AlertTriangle, 
    CheckCircle, 
    Users, 
    Smile, 
    AtSign, 
    Clock, 
    Zap,
    ChevronDown,
    X,
    Info,
    Plus,
    Paperclip,
    UserPlus,
    Check,
    Tag,
    Trash2,
    ChevronRight,
    Shield,
    BookOpen,
    ExternalLink,
    AlertOctagon,
    Eye,
    CreditCard,
    Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import TopUpModal from '@/components/messaging/TopUpModal';

type RecipientMode = 'All' | 'Groups' | 'Selected' | 'Manual';
type TagFilter = 'all' | 'new' | 'returning';

const HIGH_RISK_WORDS = [
    'immediate action', 'verify', 'account', 'secure-login', 'verify-now', 
    'urgent', 'winner', 'prize', 'bank', 'password', 'urgent response needed', 
    'you have won', 'congratulations winner', 'click below', 'identity verification', 
    'crypto giveaway', 'failed delivery', 'free gift', 'action required', 'bank account',
    'promo', 'promotion', 'congrat', 'congratulations', 'bonus', 'discount',
    'offer', 'claim', 'exclusive', 'limited time', 'act now', 'don\'t miss',
    'special offer', 'free', 'win', 'cash', 'guaranteed', 'risk free',
    'no obligation', 'act today', 'expires', 'limited supply'
];

export default function SMSSender() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const sendMessage = useSendMessage();
    
    // Fetch Data
    const { data: business } = useMyBusiness();
    const { data: visitors = [] } = useMessagingVisitorsByBranch();
    const { data: businessForms = [] } = useBusinessForms();
    const { data: templates = [] } = useMessagingTemplates('SMS');
    const { data: credits } = useMyCredits();

    const smsBalance = credits?.smsCredits ?? 0;

    const businessName = business?.name || user?.businessName || 'Your Business';
    const businessLogo = business?.logoUrl;

    // Form State
    const [recipientMode, setRecipientMode] = useState<RecipientMode>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]); // For Modal
    const [customContent, setCustomContent] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [selectedFormId, setSelectedFormId] = useState(searchParams.get('formId') || '');
    const [isSending, setIsSending] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWordListModalOpen, setIsWordListModalOpen] = useState(false);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [modalTagFilter, setModalTagFilter] = useState<TagFilter>('all');

    // Derived Data
    const selectedContacts = useMemo(() => 
        visitors.filter(v => selectedContactIds.includes(v.id)),
    [visitors, selectedContactIds]);

    const filteredModalContacts = useMemo(() => {
        let result = visitors;

        // Search filter
        const query = modalSearch.toLowerCase().trim();
        if (query) {
            result = result.filter(v => 
                v.name?.toLowerCase().includes(query) || 
                v.phone?.includes(query)
            );
        }

        // Tag filter (New vs Returning based on visits)
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

    const charCount = customContent.length;
    const smsTokens = Math.ceil(charCount / 160) || 1;
    const estimatedCostPerSms = 25.00; 
    
    const totalRecipients = useMemo(() => {
        if (recipientMode === 'All') return visitors.length;
        if (recipientMode === 'Manual' || recipientMode === 'Selected') return selectedContactIds.length;
        return 0;
    }, [recipientMode, visitors.length, selectedContactIds.length]);

    const requiredUnits = smsTokens * totalRecipients;
    const isInsufficientBalance = smsBalance < requiredUnits;
    const totalCost = (smsTokens * estimatedCostPerSms * totalRecipients).toLocaleString(undefined, { minimumFractionDigits: 2 });

    const hasHighRiskWords = useMemo(() => {
        return HIGH_RISK_WORDS.some(word => customContent.toLowerCase().includes(word));
    }, [customContent]);

    const eligibleForms = businessForms.filter(f => f.isPublished && f.isActive);
    const selectedForm = eligibleForms.find(f => f.id === selectedFormId);
    const selectedFormCode = selectedForm?.uniqueCode?.trim() || '';
    const selectedFormLink = selectedFormCode 
        ? (typeof window !== 'undefined' ? `${window.location.origin}/forms/${selectedFormCode}` : `/forms/${selectedFormCode}`)
        : '';

    const finalContent = useMemo(() => {
        if (selectedFormLink && customContent.trim()) {
            return `${customContent.trim()}\n\nComplete this form: ${selectedFormLink}`;
        }
        return customContent;
    }, [customContent, selectedFormLink]);

    // Handlers
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

    const handleSchedule = async () => {
        if (!scheduleDateTime) {
            toast.error('Please select a date and time');
            return;
        }

        const scheduledDate = new Date(scheduleDateTime);
        if (scheduledDate <= new Date()) {
            toast.error('Schedule time must be in the future');
            return;
        }

        setIsSending(true);
        try {
            await sendMessage.mutateAsync({
                channel: 'SMS',
                audienceType: recipientMode === 'All' ? 'ALL' : 'TAGGED',
                content: finalContent,
                from: businessName,
                customerIds: (recipientMode === 'Manual' || recipientMode === 'Selected') ? selectedContactIds : undefined,
                templateId: selectedTemplateId || undefined,
                scheduledAt: scheduledDate.toISOString(),
            });

            toast.success('Message scheduled successfully!');
            setIsScheduleModalOpen(false);
            router.push('/dashboard/messaging/history');
        } catch (err: any) {
            toast.error(err.message || 'Failed to schedule message');
        } finally {
            setIsSending(false);
        }
    };

    const handleSend = async () => {
        if (!customContent.trim()) {
            toast.error('Please enter message content');
            return;
        }

        if ((recipientMode === 'Manual' || recipientMode === 'Selected') && selectedContactIds.length === 0) {
            toast.error('Please select at least one recipient');
            return;
        }

        setIsSending(true);
        try {
            const response = await sendMessage.mutateAsync({
                channel: 'SMS',
                audienceType: recipientMode === 'All' ? 'ALL' : 'TAGGED',
                content: finalContent,
                from: businessName,
                customerIds: (recipientMode === 'Manual' || recipientMode === 'Selected') ? selectedContactIds : undefined,
                templateId: selectedTemplateId || undefined,
            });

            const costInfo = response?.totalCost ? ` (Cost: ${response.totalCost} units)` : '';
            toast.success(`Message launched successfully!${costInfo}`);
            router.push('/dashboard/messaging/history');
        } catch (err: any) {
            toast.error(err.message || 'Failed to launch message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500 pb-40 md:pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* Left Side: Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Recipient Selection Card */}
                    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 p-5 md:p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recipient Selection</h3>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                {(['All', 'Manual'] as RecipientMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setRecipientMode(mode)}
                                        className={`px-3 md:px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                                            recipientMode === mode 
                                            ? 'bg-white text-primary shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {recipientMode === 'All' && (
                            <div className="bg-slate-50 border border-slate-100 p-4 md:p-6 rounded-2xl flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="size-10 md:size-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary shrink-0">
                                        <Users size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 leading-tight">All Contacts</p>
                                        <p className="text-[11px] md:text-xs text-slate-400 font-medium mt-0.5 truncate">{visitors.length.toLocaleString()} visitors will receive this.</p>
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
                                                    <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase shrink-0">
                                                        {contact.name?.[0] || contact.phone?.[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-bold text-slate-800 truncate">{contact.name || 'Unknown'}</p>
                                                        <p className="text-[9px] text-slate-400 font-medium">{contact.phone}</p>
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

                    {/* SMS Composer Card */}
                    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 p-5 md:p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">SMS Composer</h3>
                            
                            <div className="flex items-center gap-2 md:gap-3">
                                {/* Form Attachment */}
                                <div className="relative flex-1 md:flex-none">
                                    <select 
                                        className="w-full md:w-auto appearance-none bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 pr-10 text-[10px] font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
                                        value={selectedFormId}
                                        onChange={(e) => setSelectedFormId(e.target.value)}
                                    >
                                        <option value="">Attach Form</option>
                                        {eligibleForms.map(form => (
                                            <option key={form.id} value={form.id}>{form.title}</option>
                                        ))}
                                    </select>
                                    <Paperclip size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                                </div>

                                {/* Template Selection */}
                                <div className="relative flex-1 md:flex-none">
                                    <select 
                                        className="w-full md:w-auto appearance-none bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 pr-10 text-[10px] font-bold text-slate-600 outline-none focus:border-primary/20 transition-all cursor-pointer"
                                        value={selectedTemplateId}
                                        onChange={(e) => {
                                            const tpl = templates.find(t => t.id === e.target.value);
                                            if (tpl) {
                                                setCustomContent(tpl.content);
                                                setSelectedTemplateId(tpl.id);
                                            } else {
                                                setSelectedTemplateId('');
                                            }
                                        }}
                                    >
                                        <option value="">Templates</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <textarea 
                                value={customContent}
                                onChange={(e) => setCustomContent(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full h-40 md:h-48 p-5 md:p-6 bg-gray-50 border border-gray-100 rounded-[1.5rem] md:rounded-[2rem] text-sm font-medium leading-relaxed resize-none outline-none focus:bg-white focus:border-primary/20 transition-all"
                            />
                            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-3">
                                <div className="relative">
                                    <button 
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={`p-2 transition-colors ${showEmojiPicker ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                                    >
                                        <Smile size={20} />
                                    </button>
                                    
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <div className="fixed inset-0 z-[-1]" onClick={() => setShowEmojiPicker(false)} />
                                            <div className="max-w-[calc(100vw-2rem)]">
                                                <EmojiPicker 
                                                    onEmojiClick={(emojiData: EmojiClickData) => {
                                                        setCustomContent(prev => prev + emojiData.emoji);
                                                        setShowEmojiPicker(false);
                                                    }}
                                                    autoFocusSearch={false}
                                                    width="100%"
                                                    height={350}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Variable Buttons */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {[
                                { label: 'Name', value: '{Name}' },
                                { label: 'First Name', value: '{FirstName}' },
                                { label: 'Business', value: '{BusinessName}' },
                                { label: 'Points', value: '{Points}' },
                            ].map(variable => (
                                <button
                                    key={variable.value}
                                    type="button"
                                    onClick={() => setCustomContent(prev => prev + variable.value)}
                                    className="px-2.5 py-1.5 bg-white border border-gray-100 text-slate-600 rounded-lg text-[9px] md:text-[10px] font-bold hover:border-primary/30 hover:text-primary transition-all shadow-sm active:scale-95"
                                >
                                    + {variable.label}
                                </button>
                            ))}
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 md:gap-4 mt-6">
                            <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 text-center">
                                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase mb-1">Chars</p>
                                <p className="text-xs md:text-sm font-bold text-slate-700 leading-none">
                                    <span className={charCount > 160 ? 'text-amber-500' : 'text-slate-700'}>{charCount}</span>/160
                                </p>
                            </div>
                            <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 text-center">
                                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase mb-1">Units</p>
                                <p className="text-xs md:text-sm font-bold text-slate-700 leading-none">{smsTokens}</p>
                            </div>
                        </div>

                        {/* High Risk Alert */}
                        {hasHighRiskWords && (
                            <div className="mt-6 bg-red-50 border border-red-100 p-4 md:p-5 rounded-2xl flex gap-3 md:gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="size-8 md:size-10 bg-white rounded-xl flex items-center justify-center text-red-500 shrink-0 shadow-sm">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] md:text-xs font-black text-red-700 uppercase tracking-wide">High Risk Words</h4>
                                    <p className="text-[10px] md:text-[11px] text-red-600/80 leading-relaxed mt-1">
                                        Suspicious links or phrases detected. May trigger spam filters.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Safety & Compliance Card */}
                    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 p-5 md:p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="size-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                    <Shield size={18} />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Message Safety & Compliance</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* High Risk Words Info */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertOctagon size={16} className="text-amber-500" />
                                    <span className="text-xs font-bold text-slate-700">Restricted Content</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4 flex-1">
                                    Certain words and phrases are classified as high-risk. Using them may cause your messages to be flagged as phishing or spam by carriers.
                                </p>
                                <button 
                                    onClick={() => setIsWordListModalOpen(true)}
                                    className="w-full h-10 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:text-primary hover:border-primary/20 transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Eye size={14} />
                                    View Word List
                                </button>
                            </div>

                            {/* Manual Guide */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <BookOpen size={16} className="text-primary" />
                                    <span className="text-xs font-bold text-slate-700">Optimization Guide</span>
                                </div>
                                <ul className="space-y-2">
                                    {[
                                        'Use variables like {FirstName} to increase engagement.',
                                        'Keep messages under 160 characters for single unit billing.',
                                        'Always include a clear opt-out or call-to-action.',
                                        'Avoid excessive capitalization and multiple exclamation marks.'
                                    ].map((tip, i) => (
                                        <li key={i} className="flex gap-2">
                                            <div className="size-1.5 bg-primary/40 rounded-full mt-1.5 shrink-0" />
                                            <span className="text-[10px] text-slate-500 font-medium leading-tight">{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Preview & Delivery */}
                <div className="space-y-6">
                    
                    {/* Phone Preview */}
                    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 p-5 md:p-8 shadow-sm flex flex-col items-center">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 w-full text-center md:text-left">Live Preview</h3>
                        <div className="relative w-full max-w-[260px] md:max-w-[280px] aspect-[1/2] md:h-[560px] bg-slate-950 rounded-[2.5rem] md:rounded-[3.5rem] border-[8px] md:border-[10px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-white/10 mx-auto">
                            {/* Reflection effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20" />
                            
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 md:w-28 h-5 md:h-7 bg-slate-900 rounded-b-2xl md:rounded-b-3xl z-30 flex items-center justify-center">
                                <div className="w-8 md:w-10 h-0.5 md:h-1 bg-slate-800 rounded-full" />
                            </div>
                            
                            <div className="h-full bg-slate-50 pt-8 md:pt-10 flex flex-col relative">
                                {/* iOS style header */}
                                <div className="px-4 py-3 md:px-5 md:py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center gap-2 md:gap-3 z-10">
                                    {businessLogo ? (
                                        <div className="size-7 md:size-9 rounded-full overflow-hidden border border-gray-100 relative bg-white shrink-0">
                                            <Image src={businessLogo} alt={businessName} fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="size-7 md:size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] md:text-xs shrink-0">
                                            {businessName[0]}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[10px] md:text-[11px] font-black text-slate-800 leading-none truncate">{businessName}</p>
                                        <p className="text-[7px] md:text-[8px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
                                            <div className="size-1 bg-emerald-500 rounded-full animate-pulse" />
                                            Active Now
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 p-3 md:p-4 overflow-y-auto custom-scrollbar space-y-4">
                                    <div className="text-center">
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-300 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">Today</span>
                                    </div>
                                    
                                    {finalContent && (
                                        <div className="bg-primary text-white p-3 md:p-4 rounded-2xl rounded-tr-none text-[10px] md:text-[11px] leading-relaxed shadow-lg shadow-primary/10 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
                                            {finalContent}
                                            <div className="flex items-center justify-end gap-1 mt-2">
                                                <p className="text-[7px] md:text-[8px] text-white/60">Now · SMS</p>
                                                <Check size={8} className="text-white/60" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Mock Keyboard Area */}
                                <div className="h-14 md:h-20 bg-gray-100/50 border-t border-gray-100 flex items-center px-4 gap-2">
                                    <div className="flex-1 h-7 md:h-9 bg-white rounded-full border border-gray-200" />
                                    <div className="size-7 md:size-9 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                        <Send size={12} className="md:w-[14px] md:h-[14px]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Speed Card */}
                    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 p-5 md:p-8 shadow-sm transition-all hover:shadow-md">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Estimated Delivery</h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                                        <Zap size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">Avg. Speed</span>
                                </div>
                                <span className="text-sm font-black text-slate-800">2.4s</span>
                            </div>

                            <div className="relative h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                <div className="absolute inset-y-0 left-0 bg-primary w-[85%] rounded-full shadow-[0_0_8px_rgba(0,74,198,0.3)]" />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
                                <span className="text-sm font-black text-emerald-500">98.2%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="fixed bottom-20 md:bottom-6 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:max-w-5xl px-0 md:px-6 z-40">
                <div className="bg-white/95 md:bg-white/80 backdrop-blur-xl border-t md:border border-gray-100 md:border-white/20 md:rounded-3xl p-3 md:p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] md:shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-6 ring-1 ring-black/5">
                    <div className="flex justify-between md:justify-start md:gap-8 px-4 md:pl-4">
                        <div>
                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipients</p>
                            <p className="text-lg md:text-xl font-black text-slate-800 leading-none mt-1">
                                {totalRecipients.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest text-right md:text-left">Total Units</p>
                            <p className="text-lg md:text-xl font-black text-primary leading-none mt-1 text-right md:text-left">
                                {(smsTokens * totalRecipients).toLocaleString()}
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Balance</p>
                            <p className={`text-lg md:text-xl font-black leading-none mt-1 ${smsBalance < (smsTokens * totalRecipients) ? 'text-red-500' : 'text-slate-800'}`}>
                                {smsBalance.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 md:gap-3 px-4 md:px-0 pb-2 md:pb-0">
                        {isInsufficientBalance ? (
                            <button 
                                onClick={() => setIsTopUpOpen(true)}
                                className="flex-1 md:flex-none h-12 md:h-14 px-6 md:px-8 bg-amber-500 text-white font-black rounded-xl md:rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base"
                            >
                                <CreditCard size={18} />
                                Top Up Now
                            </button>
                        ) : (
                            <button 
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="flex-1 md:flex-none h-12 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl border border-gray-100 font-bold text-slate-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base"
                            >
                                <Clock size={18} />
                                Schedule
                            </button>
                        )}
                        
                        <button 
                            onClick={handleSend}
                            disabled={isSending || !customContent.trim() || isInsufficientBalance}
                            className="flex-[1.5] md:flex-none h-12 md:h-14 px-6 md:px-10 bg-primary text-white font-black rounded-xl md:rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                            {isInsufficientBalance ? 'Insufficient Balance' : (isSending ? 'Launching...' : 'Send Now')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Manual Selection */}
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
                                            onChange={(e) => setModalTagFilter(e.target.value as TagFilter)}
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
                                                {contact.name?.[0] || contact.phone?.[0]}
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
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{contact.phone}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {filteredModalContacts.length === 0 && (
                                    <div className="p-12 text-center">
                                        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">Your first customer is waiting. Let's capture them today.</p>
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

            {/* Word List Modal */}
            {isWordListModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsWordListModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        
                        <div className="p-6 md:p-8 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">High-Risk Words</h3>
                                </div>
                                <button onClick={() => setIsWordListModalOpen(false)} className="size-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Messages containing these words are highly likely to be blocked or filtered by mobile network operators.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-2">
                                {HIGH_RISK_WORDS.map((word, i) => (
                                    <div key={i} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-2">
                                        <div className="size-1 bg-red-400 rounded-full" />
                                        {word}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                                <div className="flex gap-3">
                                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-[11px] font-black text-blue-700 uppercase mb-1">Pro Tip</h4>
                                        <p className="text-[10px] text-blue-600/80 leading-relaxed font-medium">
                                            Instead of "Verify", try "Confirm". Instead of "Immediate Action", try "Update Required". Softening your language improves delivery rates.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100">
                            <button 
                                onClick={() => setIsWordListModalOpen(false)}
                                className="w-full h-12 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Understood
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <TopUpModal 
                isOpen={isTopUpOpen} 
                onClose={() => setIsTopUpOpen(false)} 
            />

            {/* Schedule Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsScheduleModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        <div className="p-6 md:p-8 border-b border-gray-100 relative overflow-hidden">
                            <div className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                Coming Soon
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                        <Calendar size={20} />
                                    </div>
                                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Schedule Message</h3>
                                </div>
                                <button onClick={() => setIsScheduleModalOpen(false)} className="size-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Pick a future date and time to launch your message automatically.
                            </p>
                        </div>

                        <div className="p-6 md:p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Select Date & Time</label>
                                <input 
                                    type="datetime-local" 
                                    value={scheduleDateTime}
                                    onChange={(e) => setScheduleDateTime(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-primary/20 transition-all cursor-pointer"
                                />
                            </div>

                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-700/80 font-medium leading-relaxed">
                                    Scheduled messages will be sent according to your local timezone. Make sure you have enough unit balance at the time of delivery.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                            <button 
                                onClick={() => setIsScheduleModalOpen(false)}
                                className="flex-1 h-12 bg-white border border-gray-200 text-slate-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                disabled
                                className="flex-[2] h-12 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 font-black rounded-xl cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                            >
                                <Clock size={16} className="opacity-50" />
                                <span className="uppercase tracking-tight text-[11px]">Confirm Schedule (Coming Soon)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
