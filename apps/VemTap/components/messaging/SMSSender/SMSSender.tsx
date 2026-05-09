'use client';

import React, { useState, useMemo } from 'react';
import { useMessagingTemplates, useSendMessage } from '@/services/messaging/hooks';
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
    ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

type RecipientMode = 'All' | 'Groups' | 'Selected' | 'Manual';
type TagFilter = 'all' | 'new' | 'returning';

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

    const totalCost = (smsTokens * estimatedCostPerSms * totalRecipients).toLocaleString(undefined, { minimumFractionDigits: 2 });

    const hasHighRiskWords = useMemo(() => {
        const highRisk = ['immediate action', 'verify', 'account', 'secure-login', 'verify-now', 'urgent', 'winner', 'prize', 'bank', 'password', 'urgent response needed', 'you have won', 'congratulations winner', 'click below', 'identity verification', 'crypto giveaway', 'failed delivery'];
        return highRisk.some(word => customContent.toLowerCase().includes(word));
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
        <div className="max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in duration-500 pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Recipient Selection Card */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recipient Selection</h3>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                {(['All', 'Manual'] as RecipientMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setRecipientMode(mode)}
                                        className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
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
                            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">All Contacts</p>
                                        <p className="text-xs text-slate-400 font-medium">{visitors.length.toLocaleString()} total visitors will receive this message.</p>
                                    </div>
                                </div>
                                <CheckCircle className="text-primary" size={24} />
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
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                                        {contact.name?.[0] || contact.phone?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-800">{contact.name || 'Unknown'}</p>
                                                        <p className="text-[9px] text-slate-400 font-medium">{contact.phone}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => toggleContact(contact.id)} className="text-slate-300 hover:text-red-500 transition-colors">
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
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm transition-all hover:shadow-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">SMS Composer</h3>
                            
                            <div className="flex items-center gap-3">
                                {/* Form Attachment */}
                                <div className="relative">
                                    <select 
                                        className="appearance-none bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 pr-10 text-[10px] font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
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
                                <div className="relative">
                                    <select 
                                        className="appearance-none bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 pr-10 text-[10px] font-bold text-slate-600 outline-none focus:border-primary/20 transition-all cursor-pointer"
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
                                className="w-full h-48 p-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm font-medium leading-relaxed resize-none outline-none focus:bg-white focus:border-primary/20 transition-all"
                            />
                            <div className="absolute bottom-6 right-6 flex items-center gap-3">
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
                                            <EmojiPicker 
                                                onEmojiClick={(emojiData: EmojiClickData) => {
                                                    setCustomContent(prev => prev + emojiData.emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                autoFocusSearch={false}
                                                width={320}
                                                height={400}
                                            />
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
                                    className="px-3 py-1.5 bg-white border border-gray-100 text-slate-600 rounded-lg text-[10px] font-bold hover:border-primary/30 hover:text-primary transition-all shadow-sm active:scale-95"
                                >
                                    + {variable.label}
                                </button>
                            ))}
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Characters</p>
                                <p className="text-sm font-bold text-slate-700">
                                    <span className={charCount > 160 ? 'text-amber-500' : 'text-slate-700'}>{charCount}</span> / 160
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Units</p>
                                <p className="text-sm font-bold text-slate-700">{smsTokens} SMS</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Estimated Credit</p>
                            <p className="text-sm font-bold text-primary">₦{totalCost}</p>
                            </div>
                        </div>

                        {/* High Risk Alert */}
                        {hasHighRiskWords && (
                            <div className="mt-6 bg-red-50 border border-red-100 p-5 rounded-2xl flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="size-10 bg-white rounded-xl flex items-center justify-center text-red-500 shrink-0 shadow-sm">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-red-700 uppercase tracking-wide">High Risk Words Detected</h4>
                                    <p className="text-[11px] text-red-600/80 leading-relaxed mt-1">
                                        Your message contains suspicious links or urgent phrases. This may trigger carrier spam filters or be flagged as phishing.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Preview & Delivery */}
                <div className="space-y-6">
                    
                    {/* Phone Preview */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col items-center">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 w-full">Live Preview</h3>
                        <div className="relative w-[280px] h-[560px] bg-slate-950 rounded-[3.5rem] border-[10px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-white/10">
                            {/* Reflection effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20" />
                            
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-900 rounded-b-3xl z-30 flex items-center justify-center">
                                <div className="w-10 h-1 bg-slate-800 rounded-full" />
                            </div>
                            
                            <div className="h-full bg-slate-50 pt-10 flex flex-col relative">
                                {/* iOS style header */}
                                <div className="px-5 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 z-10">
                                    {businessLogo ? (
                                        <div className="size-9 rounded-full overflow-hidden border border-gray-100 relative bg-white">
                                            <Image src={businessLogo} alt={businessName} fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {businessName[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[11px] font-black text-slate-800 leading-none">{businessName}</p>
                                        <p className="text-[8px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
                                            <div className="size-1 bg-emerald-500 rounded-full animate-pulse" />
                                            Active Now
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                                    <div className="text-center">
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">Today</span>
                                    </div>
                                    
                                    {finalContent && (
                                        <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none text-[11px] leading-relaxed shadow-lg shadow-primary/10 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
                                            {finalContent}
                                            <div className="flex items-center justify-end gap-1 mt-2">
                                                <p className="text-[8px] text-white/60">Now · SMS</p>
                                                <Check size={8} className="text-white/60" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Mock Keyboard Area */}
                                <div className="h-20 bg-gray-100/50 border-t border-gray-100 flex items-center px-4 gap-2">
                                    <div className="flex-1 h-9 bg-white rounded-full border border-gray-200" />
                                    <div className="size-9 rounded-full bg-primary flex items-center justify-center text-white">
                                        <Send size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Speed Card */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm transition-all hover:shadow-md">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Estimated Delivery</h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                                        <Zap size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">Avg. Speed</span>
                                </div>
                                <span className="text-sm font-black text-slate-800">2.4 seconds</span>
                            </div>

                            <div className="relative h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                <div className="absolute inset-y-0 left-0 bg-primary w-[85%] rounded-full shadow-[0_0_8px_rgba(0,74,198,0.3)]" />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Success Rate</span>
                                <span className="text-sm font-black text-emerald-500">98.2%</span>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 border border-slate-100">
                                <div className="size-6 shrink-0 flex items-center justify-center text-slate-400">
                                    <Info size={14} />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                    Global routing optimized for delivery. High traffic expected in the UK region.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-50">
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-6 ring-1 ring-black/5">
                    <div className="flex gap-8 pl-4">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipients</p>
                            <p className="text-xl font-black text-slate-800">
                                {totalRecipients.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Cost</p>
                            <p className="text-xl font-black text-primary">₦{totalCost}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="h-14 px-8 rounded-2xl border border-gray-100 font-bold text-slate-600 hover:bg-gray-50 transition-all flex items-center gap-3">
                            <Clock size={18} />
                            Schedule
                        </button>
                        <button 
                            onClick={handleSend}
                            disabled={isSending || !customContent.trim()}
                            className="h-14 px-10 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center gap-3"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                            {isSending ? 'Launching...' : 'Send Now'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Manual Selection */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-4xl bg-white rounded-[1.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        
                        {/* Header Filters */}
                        <div className="p-6 border-b border-gray-100 space-y-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Search size={18} />
                                    </div>
                                    <input 
                                        type="text"
                                        placeholder="Search by name or phone..."
                                        value={modalSearch}
                                        onChange={(e) => setModalSearch(e.target.value)}
                                        className="w-full h-12 pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <select 
                                            value={modalTagFilter}
                                            onChange={(e) => setModalTagFilter(e.target.value as TagFilter)}
                                            className="appearance-none h-12 px-10 border border-gray-200 rounded-xl text-slate-600 text-sm font-bold outline-none hover:bg-gray-50 transition-all cursor-pointer"
                                        >
                                            <option value="all">All Visitors</option>
                                            <option value="new">New Visitors (1 visit)</option>
                                            <option value="returning">Returning Visitors (1+ visits)</option>
                                        </select>
                                        <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-1 overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="p-4 text-left w-14">
                                            <div 
                                                onClick={toggleAllModalContacts}
                                                className={`size-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                                                    tempSelectedIds.length === filteredModalContacts.length 
                                                    ? 'bg-primary border-primary' 
                                                    : 'border-gray-200 bg-white'
                                                }`}
                                            >
                                                {tempSelectedIds.length === filteredModalContacts.length && <Check size={12} className="text-white" strokeWidth={4} />}
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-wider">Contact Name</th>
                                        <th className="p-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone Number</th>
                                        <th className="p-4 text-left text-[10px] font-black uppercase text-slate-400 tracking-wider">Tags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredModalContacts.map(contact => {
                                        const isSelected = tempSelectedIds.includes(contact.id);
                                        const isReturning = (Number(contact.visits) || 0) > 1;
                                        return (
                                            <tr 
                                                key={contact.id} 
                                                className={`border-b border-gray-50 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                                            >
                                                <td className="p-4">
                                                    <div 
                                                        onClick={() => toggleModalContact(contact.id)}
                                                        className={`size-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                                                            isSelected ? 'bg-primary border-primary' : 'border-gray-200 bg-white'
                                                        }`}
                                                    >
                                                        {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-primary uppercase">
                                                            {contact.name?.[0] || contact.phone?.[0]}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800">{contact.name || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-500 font-medium">{contact.phone}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-1">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                                            isReturning 
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                        }`}>
                                                            {isReturning ? 'Returning' : 'New'}
                                                        </span>
                                                        {isReturning && (
                                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold rounded-md">Loyal</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-black border border-primary/20">
                                    {tempSelectedIds.length.toLocaleString()} selected
                                </div>
                                <button 
                                    onClick={() => setTempSelectedIds([])}
                                    className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-sm font-bold transition-colors"
                                >
                                    <Trash2 size={18} />
                                    Clear Selection
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-12 px-10 border border-gray-200 text-slate-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmSelection}
                                    className="h-12 px-10 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                                >
                                    Confirm Selection
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
