'use client';

import React, { useState } from 'react';
import { X, Search, Smartphone, MessageSquare, Check, UserCircle, Building2, Link as LinkIcon, Star, Coins } from 'lucide-react';
import { useChatTemplates } from '@/hooks/useMessaging';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { generateWhatsAppLink, processTemplate, generateBridgeLink } from '@/lib/whatsapp-utils';

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
    const { activeBranchId } = useActiveBranch();
    const { data: templates = [], isLoading } = useChatTemplates(activeBranchId || undefined);
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

    const bridgeLabel = "\n\nChat with us on Venture: ";
    const getBridgeUrl = (visitor?: any) => {
        return generateBridgeLink(businessCode, visitor?.id, visitor?.name);
    };

    const selectedTemplate = templates.find((t: any) => t.id === selectedTemplateId);
    
    // For bulk, we show a generic placeholder preview or the first visitor's preview
    const previewName = isBulk && currentIndex === null ? "[name]" : currentVisitor?.name || "[name]";
    let previewMessage = selectedTemplate 
        ? processTemplate(selectedTemplate.content, { name: previewName, businessName })
        : customMessage;

    if (includeBridgeLink && previewMessage.trim()) {
        previewMessage += bridgeLabel + getBridgeUrl(currentVisitor);
    }

    const handleSendNext = (index: number) => {
        const visitor = visitors[index];
        if (!visitor.phone) return;
        
        let finalMessage = selectedTemplate 
            ? processTemplate(selectedTemplate.content, { name: visitor.name, businessName })
            : customMessage;

        if (includeBridgeLink) {
            finalMessage += bridgeLabel + getBridgeUrl(visitor);
        }
            
        const link = generateWhatsAppLink(visitor.phone, finalMessage);
        window.open(link, '_blank');
        
        if (index < visitors.length - 1) {
            setCurrentIndex(index + 1);
        } else {
            onClose();
        }
    };

    const handleStartBulk = () => {
        setCurrentIndex(0);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Smartphone size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                {isBulk ? `Bulk WhatsApp (${visitors.length} Contacts)` : `Send WhatsApp to ${visitors[0].name}`}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {isBulk ? "Template-based messaging" : visitors[0].phone}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                {currentIndex !== null ? (
                    /* Progress View for Bulk */
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-8 bg-slate-50/50 flex-1">
                        <div className="relative">
                            <div className="size-32 rounded-full border-8 border-slate-100 border-t-emerald-500 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full m-4 shadow-inner">
                                <span className="text-2xl font-black text-slate-900">{currentIndex + 1}</span>
                                <span className="text-slate-400 text-sm font-bold ml-1">/ {visitors.length}</span>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 mb-2">Ready to message {currentVisitor.name}?</h4>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">Click the button below to open WhatsApp for this contact. We&apos;ll move to the next one automatically.</p>
                        </div>
                        <button
                            onClick={() => handleSendNext(currentIndex)}
                            className="w-full max-w-sm flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all scale-100 active:scale-95"
                        >
                            <Smartphone size={20} />
                            <span>OPEN WHATSAPP & CONTINUE</span>
                        </button>
                    </div>
                ) : (
                    /* Selection View */
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            {/* Templates List */}
                            <div className="flex flex-col gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text"
                                        placeholder="Search templates..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                                    />
                                </div>

                                <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                                    {isLoading ? (
                                        <div className="py-8 text-center text-slate-400 text-xs font-medium">Loading templates...</div>
                                    ) : filteredTemplates.length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 text-xs font-medium">No templates found.</div>
                                    ) : (
                                        filteredTemplates.map((t: any) => (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setSelectedTemplateId(t.id);
                                                    setCustomMessage('');
                                                }}
                                                className={`w-full p-4 border rounded-2xl text-left transition-all hover:shadow-md ${selectedTemplateId === t.id ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/5' : 'bg-white border-slate-100 shadow-sm'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${t.category === 'MARKETING' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {t.category}
                                                    </span>
                                                    {selectedTemplateId === t.id && <Check className="text-emerald-500" size={14} />}
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
                                            className={`w-full p-4 border rounded-2xl text-left transition-all hover:shadow-md ${!selectedTemplateId ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/5' : 'bg-white border-slate-100 shadow-sm'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    CUSTOM
                                                </span>
                                                {!selectedTemplateId && <Check className="text-emerald-500" size={14} />}
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 mb-1">Custom Message</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">Write your own message from scratch.</p>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Preview & Edit Area */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex flex-col h-full ring-1 ring-slate-200/50">
                                    <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-4">
                                        <div className="size-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                            <UserCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Preview</p>
                                            <p className="text-xs font-bold text-slate-900">To: {previewName}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 px-1">Content</label>
                                            <textarea
                                                value={previewMessage}
                                                onChange={e => {
                                                    if (!selectedTemplateId) setCustomMessage(e.target.value);
                                                }}
                                                readOnly={!!selectedTemplateId}
                                                placeholder="Write your message here..."
                                                className={`w-full h-[180px] p-4 rounded-2xl text-sm leading-relaxed outline-none transition-all ${selectedTemplateId ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-transparent' : 'bg-white border-2 border-slate-100 focus:border-emerald-500 shadow-inner'}`}
                                            />
                                            {selectedTemplateId && (
                                                <p className="mt-2 text-[10px] text-slate-400 font-medium italic">Templates are processed automatically with visitor data.</p>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Venture Chat Bridge</p>
                                                <button 
                                                    onClick={() => setIncludeBridgeLink(!includeBridgeLink)}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${includeBridgeLink ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                >
                                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeBridgeLink ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-400 px-1 leading-relaxed">Appends a secure link to every message so customers can chat with you directly on Venture.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1">Placeholders Used</p>
                                            <div className="flex flex-wrap gap-2">
                                                {PLACEHOLDERS.map(p => {
                                                    const isUsed = previewMessage.includes(p.tag);
                                                    return (
                                                        <div 
                                                            key={p.tag}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${isUsed ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-slate-100 border-transparent text-slate-400'}`}
                                                        >
                                                            {p.icon}
                                                            {p.tag}
                                                            {isUsed && <Check size={10} />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-50">
                                        {isBulk ? (
                                            <button
                                                onClick={handleStartBulk}
                                                disabled={!previewMessage.trim() || !selectedTemplateId}
                                                className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none transition-all scale-100 active:scale-95"
                                            >
                                                <Smartphone size={20} />
                                                <span>START BULK SENDING</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSendNext(0)}
                                                disabled={!previewMessage.trim() || !visitors[0].phone}
                                                className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none transition-all scale-100 active:scale-95"
                                            >
                                                <Smartphone size={20} />
                                                <span>CHAT ON WHATSAPP</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
