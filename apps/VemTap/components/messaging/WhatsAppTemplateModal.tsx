'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, MessageSquare, Check, UserCircle, Building2, Link as LinkIcon } from 'lucide-react';
import { useMessagingTemplates, useSendMessage } from '@/services/messaging/hooks';
import { useMessagingBranch } from '@/hooks/useMessagingBranch';
import { generateWhatsAppLink, processTemplate, generateBridgeLink } from '@/lib/whatsapp-utils';
import { toast } from 'react-hot-toast';

// Inline WhatsApp SVG icon for consistent branding
function WhatsAppIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

interface WhatsAppTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    visitors: any[];
    businessName: string;
    businessCode: string;
}

const PLACEHOLDERS = [
    { label: 'Name', tag: '[name]', icon: <UserCircle size={12} /> },
    { label: 'Business Name', tag: '[business-name]', icon: <Building2 size={12} /> },
];

export default function WhatsAppTemplateModal({ isOpen, onClose, visitors, businessName, businessCode }: WhatsAppTemplateModalProps) {
    const { branchId } = useMessagingBranch();
    const { data: templates = [], isLoading } = useMessagingTemplates('WHATSAPP');
    const sendMessage = useSendMessage();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [customMessage, setCustomMessage] = useState('');
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [includeBridgeLink, setIncludeBridgeLink] = useState(true);

    if (!isOpen) return null;

    const isBulk = visitors.length > 1;
    const currentVisitor = currentIndex !== null ? visitors[currentIndex] : visitors[0];

    const filteredTemplates = templates.filter((t: any) => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getBridgeLabel = () => `\n\n💬 Continue chatting with *${businessName}* here:\n`;
    const getBridgeUrl = (visitor?: any) => {
        return generateBridgeLink(businessCode, visitor?.id, visitor?.name);
    };

    const selectedTemplate = templates.find((t: any) => t.id === selectedTemplateId);
    
    const previewName = isBulk && currentIndex === null ? "[name]" : currentVisitor?.name || "[name]";
    let previewMessage = selectedTemplate 
        ? processTemplate(selectedTemplate.content, { name: previewName, businessName })
        : processTemplate(customMessage, { name: previewName, businessName });

    if (includeBridgeLink && previewMessage.trim()) {
        previewMessage += getBridgeLabel() + getBridgeUrl(currentVisitor);
    }

    const handleSendNext = async (index: number) => {
        const visitor = visitors[index];
        if (!visitor.phone) return;
        
        let finalMessage = selectedTemplate 
            ? processTemplate(selectedTemplate.content, { name: visitor.name, businessName })
            : processTemplate(customMessage, { name: visitor.name, businessName });

        if (includeBridgeLink) {
            finalMessage += getBridgeLabel() + getBridgeUrl(visitor);
        }

        // Log to backend history
        try {
            await sendMessage.mutateAsync({
                channel: 'WHATSAPP',
                content: finalMessage,
                customerIds: [visitor.id],
                audienceType: 'GROUP',
                from: businessName
            } as any);
        } catch (err) {
            console.warn('[Broadcast] Log ignored:', err);
        }
            
        const link = generateWhatsAppLink(visitor.phone, finalMessage);
        window.open(link, '_blank');
        
        if (index < visitors.length - 1) {
            setCurrentIndex(index + 1);
        } else {
            onClose();
            toast.success('Broadcast loop complete. Check your message history!');
        }
    };

    const handleStartBulk = () => {
        setCurrentIndex(0);
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-emerald-600 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="size-11 bg-white/20 backdrop-blur-sm text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-700/20">
                            <WhatsAppIcon size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                {isBulk ? `Bulk WhatsApp Message` : `Message ${visitors[0].name}`}
                            </h3>
                            <p className="text-xs text-emerald-100 font-medium">
                                {isBulk ? `${visitors.length} contacts selected` : visitors[0].phone}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                {currentIndex !== null ? (
                    /* Progress View for Bulk */
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-8 bg-gradient-to-b from-emerald-50/50 to-white flex-1">
                        <div className="relative">
                            <div className="size-36 rounded-full border-[6px] border-slate-100 border-t-emerald-500 animate-spin" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-5 shadow-inner">
                                <span className="text-3xl font-black text-emerald-600">{currentIndex + 1}</span>
                                <span className="text-slate-400 text-xs font-bold">of {visitors.length}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-slate-900">Sending to {currentVisitor.name}</h4>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">Click the button below to open WhatsApp for this contact. We&apos;ll queue the next one automatically.</p>
                        </div>
                        <button
                            onClick={() => handleSendNext(currentIndex)}
                            className="w-full max-w-sm flex items-center justify-center gap-3 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.97]"
                        >
                            <WhatsAppIcon size={20} />
                            <span>Open WhatsApp & Continue</span>
                        </button>
                    </div>
                ) : (
                    /* Selection View */
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/30">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full">
                            {/* Templates List */}
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">Choose a Template</p>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input 
                                            type="text"
                                            placeholder="Search templates..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
                                    {isLoading ? (
                                        <div className="py-12 text-center">
                                            <div className="size-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
                                            <p className="text-xs text-slate-400 font-medium">Loading templates...</p>
                                        </div>
                                    ) : filteredTemplates.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <div className="size-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                <MessageSquare size={20} />
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">No templates found.</p>
                                            <p className="text-[10px] text-slate-300 mt-1">Create templates in Chat Settings.</p>
                                        </div>
                                    ) : (
                                        filteredTemplates.map((t: any) => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setSelectedTemplateId(t.id);
                                                    setCustomMessage('');
                                                }}
                                                className={`w-full p-4 border rounded-2xl text-left transition-all hover:shadow-md group ${selectedTemplateId === t.id ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/10 shadow-sm' : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${t.category === 'MARKETING' ? 'bg-orange-100 text-orange-600' : t.category === 'WELCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {t.category}
                                                    </span>
                                                    {selectedTemplateId === t.id && (
                                                        <div className="size-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                                            <Check size={12} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 mb-1">{t.name}</p>
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{t.content}</p>
                                            </button>
                                        ))
                                    )}
                                    
                                    {!isBulk && (
                                        <button
                                            onClick={() => {
                                                setSelectedTemplateId(null);
                                                setCustomMessage('');
                                            }}
                                            className={`w-full p-4 border rounded-2xl text-left transition-all hover:shadow-md ${!selectedTemplateId ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/10 shadow-sm' : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    CUSTOM
                                                </span>
                                                {!selectedTemplateId && (
                                                    <div className="size-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 mb-1">Custom Message</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">Write your own personalized message.</p>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Preview & Edit Area */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl flex flex-col h-full overflow-hidden">
                                    {/* WhatsApp-style chat preview header */}
                                    <div className="bg-[#075e54] px-5 py-3.5 flex items-center gap-3">
                                        <div className="size-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                                            {(currentVisitor?.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">{previewName}</p>
                                            <p className="text-[10px] text-emerald-200">Message Preview</p>
                                        </div>
                                        <WhatsAppIcon size={18} className="text-white/60" />
                                    </div>

                                    {/* Chat bubble preview */}
                                    <div className="flex-1 p-4 bg-[#ece5dd] space-y-4">
                                        <div className="flex justify-end">
                                            <div className="max-w-[85%] bg-[#dcf8c6] rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                                                {previewMessage.trim() ? (
                                                    <p className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap break-words">{previewMessage}</p>
                                                ) : (
                                                    <p className="text-[13px] text-slate-400 italic">Your message will preview here...</p>
                                                )}
                                                <p className="text-[9px] text-slate-400 text-right mt-1.5">
                                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <span className="ml-1 text-blue-400">✓✓</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="p-5 bg-white border-t border-slate-100 space-y-4">
                                        {/* Custom message input (only when no template selected) */}
                                        {!selectedTemplateId && (
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">Your Message</label>
                                                <textarea
                                                    value={customMessage}
                                                    onChange={e => setCustomMessage(e.target.value)}
                                                    placeholder="Type your message here... Use [name] for the visitor's name."
                                                    className="w-full h-[100px] p-3.5 rounded-xl text-sm leading-relaxed outline-none bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none"
                                                />
                                            </div>
                                        )}

                                        {/* VemTap Bridge Toggle */}
                                        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200/80">
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                    <LinkIcon size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">VemTap Chat Bridge</p>
                                                    <p className="text-[10px] text-slate-400">Append link so customers can continue chatting on VemTap</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setIncludeBridgeLink(!includeBridgeLink)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${includeBridgeLink ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeBridgeLink ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        {/* Placeholder Tags */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mr-1">Tags:</span>
                                            {PLACEHOLDERS.map(p => {
                                                const isUsed = previewMessage.includes(p.tag);
                                                return (
                                                    <div 
                                                        key={p.tag}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${isUsed ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-150 text-slate-400'}`}
                                                    >
                                                        {p.icon}
                                                        {p.tag}
                                                        {isUsed && <Check size={9} />}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Send Button */}
                                        {isBulk ? (
                                            <button
                                                onClick={handleStartBulk}
                                                disabled={!previewMessage.trim() || !selectedTemplateId}
                                                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#25d366] hover:bg-[#1ebe57] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.97]"
                                            >
                                                <WhatsAppIcon size={18} />
                                                <span>Start Bulk Sending ({visitors.length} contacts)</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSendNext(0)}
                                                disabled={!previewMessage.trim() || !visitors[0].phone}
                                                className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#25d366] hover:bg-[#1ebe57] text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.97]"
                                            >
                                                <WhatsAppIcon size={18} />
                                                <span>Send via WhatsApp</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
