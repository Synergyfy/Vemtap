'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { MessageSquare, Send, Smartphone, Edit3, Check, Users, Loader2 } from 'lucide-react';
import { notify } from '@/lib/notify';
import LogoIcon from '@/components/brand/LogoIcon';
import { useSendMessage } from '@/services/messaging/hooks';
import { Channel } from '@/services/messaging/types';
import { generateWhatsAppLink, generateBridgeLink } from '@/lib/whatsapp-utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useMessagingBranch } from '@/hooks/useMessagingBranch';
import { useMyBusiness } from '@/services/businesses/hooks';

interface SendMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName?: string;
    recipientPhone?: string;
    recipientEmail?: string;
    visitors?: any[];
    segmentId?: string;
    initialChannel?: 'In-App' | 'WhatsApp' | 'SMS' | 'Email';
    allowedChannels?: Array<'In-App' | 'WhatsApp' | 'SMS' | 'Email'>;
    type: 'welcome' | 'general' | 'reward' | 'custom';
}

export default function SendMessageModal({ 
    isOpen, 
    onClose, 
    recipientName, 
    recipientPhone, 
    recipientEmail, 
    visitors, 
    segmentId: initialSegmentId, 
    initialChannel = 'In-App', 
    allowedChannels, 
    type 
}: SendMessageModalProps) {
    const store = useCustomerFlowStore();
    const [selectedChannel, setSelectedChannel] = useState<'In-App' | 'WhatsApp' | 'SMS' | 'Email'>(initialChannel);
    const [selectedType, setSelectedType] = useState(type);
    const [name, setName] = useState(recipientName || '');
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [segmentId, setSegmentId] = useState<string | undefined>(initialSegmentId);
    const [includeBridgeLink, setIncludeBridgeLink] = useState(true);
    const [bulkIndex, setBulkIndex] = useState<number | null>(null);
    
    const { branchId } = useMessagingBranch();
    const { user } = useAuthStore();
    const { data: business } = useMyBusiness(!!user);
    
    const sendMessage = useSendMessage();
    const isLoading = sendMessage.isPending;

    // Get template from store or defaults based on channel
    const getTemplate = (t: string, channel: string) => {
        if (t === 'welcome') {
            const base = store.customWelcomeMessage || 'Welcome back! We are so glad to see you again. Enjoy your stay!';
            if (channel === 'Email') return `${base}\n\nBest regards,\n${store.storeName || 'The Team'}`;
            return base;
        }
        if (t === 'reward') return store.customRewardMessage || 'Congratulations! You have earned a reward for your loyalty.';
        if (t === 'general') {
            if (channel === 'Email') return 'Hello {name},\n\nThank you for visiting us! We have a special announcement for our loyal customers.\n\nVisit us again soon!';
            return 'Hello {name}, thank you for visiting us! We have a special offer for you.';
        }
        return '';
    };

    const getTitle = (t: string) => {
        if (t === 'welcome') return store.customWelcomeTitle || 'Hi, {name}!';
        if (t === 'reward') return 'Special Reward for {name}';
        return 'Special Message for {name}';
    };

    const allTemplates = [
        { id: 'welcome', label: 'Welcome Template', icon: MessageSquare, channels: ['In-App', 'WhatsApp', 'SMS', 'Email'] },
        { id: 'reward', label: 'Reward Template', icon: Send, channels: ['In-App', 'WhatsApp', 'SMS'] },
        { id: 'general', label: 'General Announcement', icon: Smartphone, channels: ['In-App', 'WhatsApp', 'SMS', 'Email'] },
        { id: 'custom', label: 'Custom Message', icon: Edit3, channels: ['In-App', 'WhatsApp', 'SMS', 'Email'] }
    ];

    const filteredTemplates = allTemplates.filter(t => t.channels.includes(selectedChannel));

    // Sync template when selection or channel changes
    React.useEffect(() => {
        if (selectedType !== 'custom') {
            setMessage(getTemplate(selectedType, selectedChannel));
            setTitle(getTitle(selectedType));
        }
    }, [selectedType, selectedChannel, store.customWelcomeMessage, store.customRewardMessage]);

    // Handle channel change: reset template if current one isn't available
    const handleChannelChange = (channel: 'In-App' | 'WhatsApp' | 'SMS' | 'Email') => {
        setSelectedChannel(channel);
        const templateExists = allTemplates.find(t => t.id === selectedType && t.channels.includes(channel));
        if (!templateExists) {
            setSelectedType('custom' as any);
        }
    };

    // Sync selectedChannel when modal opens with a specific channel
    React.useEffect(() => {
        if (isOpen && initialChannel) {
            setSelectedChannel(initialChannel);
        }
    }, [isOpen, initialChannel]);

    const replacePlaceholders = (text: string, v?: any) => {
        if (!text) return '';
        const activeName = v?.name || recipientName || name || 'Visitor';
        const firstName = v?.firstName || activeName.split(' ')[0] || 'Visitor';
        const points = v?.points ?? 0;
        
        return text
            .replace(/{Name}/g, activeName)
            .replace(/{FirstName}/g, firstName)
            .replace(/{Points}/g, points.toString());
    };

    const handleSend = async () => {
        try {
            const isBulk = (visitors && visitors.length > 1) || !!segmentId;
            const activeName = recipientName || name || '{Name}';
            const visitorIds = visitors?.map(v => v.id);
            
            // For WhatsApp, we use the Click-to-Chat flow
            if (selectedChannel === 'WhatsApp') {
                if (isBulk && bulkIndex === null) {
                    setBulkIndex(0);
                    return;
                }

                if (!isBulk && recipientPhone) {
                    let finalMessage = replacePlaceholders(message, visitors?.[0]);
                    if (includeBridgeLink) {
                        const businessCode = (business as any)?.branches?.find((b: any) => b.id === branchId)?.uniqueCode || (business as any)?.uniqueCode || branchId || 'business';
                        const bridgeLabel = `\n\n💬 Continue chatting with *${business?.name || store.storeName}* here:\n`;
                        const bridgeUrl = generateBridgeLink(businessCode, visitors?.[0]?.id, visitors?.[0]?.name || name);
                        finalMessage += bridgeLabel + bridgeUrl;
                    }

                    try {
                        await sendMessage.mutateAsync({
                            channel: 'WHATSAPP',
                            content: finalMessage,
                            customerIds: visitorIds,
                            audienceType: 'GROUP',
                            from: store.storeName || 'VemTap',
                        } as any);
                    } catch (e) { console.warn('Log failed', e); }

                    const link = generateWhatsAppLink(recipientPhone, finalMessage);
                    window.open(link, '_blank');
                    onClose();
                    return;
                } else if (isBulk) {
                    return;
                }
            }

            const resolvedMessage = isBulk ? message : message.replace(/{Name}/g, activeName);
            const resolvedTitle = isBulk ? title : title.replace(/{Name}/g, activeName);
            
            const channelMap: Record<string, Channel> = {
                'In-App': 'IN_HOUSE',
                'WhatsApp': 'WHATSAPP',
                'SMS': 'SMS',
                'Email': 'EMAIL'
            };

            const selectedChannelApi = channelMap[selectedChannel];

            const finalContent = (selectedChannel === 'Email' || selectedChannel === 'In-App')
                ? resolvedMessage 
                : (resolvedTitle ? `${resolvedTitle}\n\n${resolvedMessage}` : resolvedMessage);

            await sendMessage.mutateAsync({
                channel: selectedChannelApi,
                content: finalContent,
                customerIds: visitorIds,
                segmentId: segmentId,
                audienceType: segmentId ? 'SEGMENT' : (isBulk ? 'GROUP' : undefined),
                from: store.storeName || 'VemTap', 
            } as any);

            if (selectedType === 'welcome') {
                store.updateCustomSettings({ welcomeMessage: message, welcomeTitle: title });
            } else if (selectedType === 'reward') {
                store.updateCustomSettings({ rewardMessage: message });
            }

            notify.success(`Message sent via ${selectedChannel}!`);
            onClose();
        } catch (error: any) {
            console.error('Send error:', error);
            notify.error(error?.response?.data?.message || `Failed to send ${selectedChannel} message`);
        }
    };

    const activeNameTokens = recipientName || name || '{Name}';
    const previewMessage = replacePlaceholders(message);
    const previewTitle = replacePlaceholders(title);

    React.useEffect(() => {
        setSegmentId(initialSegmentId);
        setBulkIndex(null);
    }, [initialSegmentId, isOpen]);

    const ComingSoonOverlay = ({ channel }: { channel: string }) => (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl" />
            <div className="relative z-30 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-2xl scale-100">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="text-primary animate-pulse" size={32} />
                </div>
                <h3 className="text-lg font-black text-text-main tracking-tight">{channel} Support</h3>
                <p className="text-xs text-text-secondary mt-2 max-w-[200px] leading-relaxed font-medium">
                    Automated {channel} campaigns are coming soon to VemTap. We&apos;re currently finalizing our carrier integrations.
                </p>
                <div className="mt-6 px-4 py-2 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full uppercase tracking-wider inline-flex items-center gap-2">
                    <Check size={12} /> Coming Soon
                </div>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={bulkIndex !== null ? "Bulk WhatsApp Loop" : (recipientName ? "Personalize Message" : (segmentId ? "Broadcast to Segment" : "Compose New Message"))}
            description={bulkIndex !== null ? `Step ${bulkIndex + 1} of ${visitors?.length}` : (recipientName ? `Sending to ${recipientName}` : (segmentId ? "Send a broadcast message to this group" : "Send a message to any visitor"))}
            size="2xl"
        >
            {bulkIndex !== null ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
                    <div className="relative">
                        <div className="size-32 rounded-full border-[6px] border-slate-100 border-t-primary animate-spin" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-4 shadow-inner">
                            <span className="text-2xl font-black text-primary">{bulkIndex + 1}</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase">of {visitors?.length}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Ready for {visitors?.[bulkIndex]?.name}?</h4>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">Opening WhatsApp for the next contact in your list.</p>
                    </div>
                    <div className="flex gap-4 w-full max-w-xs">
                        <button
                            onClick={async () => {
                                const v = visitors?.[bulkIndex];
                                if (!v?.phone) {
                                    notify.error("No phone number for this contact");
                                    if (bulkIndex < (visitors?.length || 0) - 1) setBulkIndex(bulkIndex + 1);
                                    else { setBulkIndex(null); onClose(); }
                                    return;
                                }

                                let finalMessage = replacePlaceholders(message, v);
                                if (includeBridgeLink) {
                                    const businessCode = (business as any)?.branches?.find((b: any) => b.id === branchId)?.uniqueCode || (business as any)?.uniqueCode || branchId || 'business';
                                    const bridgeLabel = `\n\n💬 Continue chatting with *${business?.name || store.storeName}* here:\n`;
                                    const bridgeUrl = generateBridgeLink(businessCode, v.id, v.name);
                                    finalMessage += bridgeLabel + bridgeUrl;
                                }

                                // Log
                                try {
                                    await sendMessage.mutateAsync({
                                        channel: 'WHATSAPP',
                                        content: finalMessage,
                                        customerIds: [v.id],
                                        audienceType: 'GROUP',
                                        from: store.storeName || 'VemTap',
                                    } as any);
                                } catch (e) { console.warn('Log failed', e); }

                                const link = generateWhatsAppLink(v.phone, finalMessage);
                                window.open(link, '_blank');
                                
                                if (bulkIndex < (visitors?.length || 0) - 1) setBulkIndex(bulkIndex + 1);
                                else {
                                    setBulkIndex(null);
                                    onClose();
                                    notify.success("Bulk sending complete!");
                                }
                            }}
                            className="flex-1 py-4 bg-primary text-white font-bold text-sm rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.97]"
                        >
                            Open & Next
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 relative">
                    {/* Editor */}
                    <div className="space-y-6">
                        {(!allowedChannels || allowedChannels.length > 1) && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Select Channel</label>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    {(allowedChannels || ['In-App', 'WhatsApp', 'SMS', 'Email'] as const).map((channel) => (
                                        <button
                                            key={channel}
                                            onClick={() => handleChannelChange(channel)}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedChannel === channel ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:bg-gray-200/50'}`}
                                        >
                                            {channel}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!recipientName && !segmentId && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Recipient Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-5 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-sm"
                                    placeholder="Enter visitor name..."
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Select Template</label>
                            <div className="grid grid-cols-2 gap-2">
                                {filteredTemplates.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedType(t.id as any)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-xs font-bold ${selectedType === t.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-50 bg-gray-50 text-slate-500 hover:border-gray-200'}`}
                                    >
                                        <t.icon size={14} />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Message Heading</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-5 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-sm"
                                placeholder="e.g. Welcome back, {Name}"
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Message Content</label>
                            <textarea
                                rows={selectedChannel === 'Email' ? 10 : 6}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-5 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-sm resize-none"
                                placeholder="Type your message here..."
                            />
                            {(selectedChannel === 'SMS' || selectedChannel === 'Email') && <ComingSoonOverlay channel={selectedChannel} />}
                            <div className="flex items-center justify-between gap-4 px-1">
                                <p className="text-[10px] text-text-secondary font-medium">
                                    Use <code className="text-primary font-bold">{"{Name}"}</code>, <code className="text-primary font-bold">{"{FirstName}"}</code>, or <code className="text-primary font-bold">{"{Points}"}</code>.
                                </p>
                                <button
                                    onClick={() => {
                                        setMessage('');
                                        setTitle('');
                                        setSelectedType('custom' as any);
                                    }}
                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    <Edit3 size={10} /> Compose Fresh
                                </button>
                            </div>
                        </div>

                        {selectedChannel === 'WhatsApp' && (
                            <div className="flex items-center justify-between bg-blue-50/50 rounded-xl px-4 py-3 border border-blue-100/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                        <LogoIcon size={12} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-700">VemTap Chat Bridge</p>
                                        <p className="text-[8px] text-slate-400">Append link so customers can chat In-App</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIncludeBridgeLink(!includeBridgeLink)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${includeBridgeLink ? 'bg-primary' : 'bg-slate-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeBridgeLink ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        )}

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 h-14 border border-gray-100 text-text-main font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={isLoading || (!recipientName && !name && !segmentId)}
                                className="flex-2 h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 size={18} className="animate-spin text-white" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        {selectedChannel === 'WhatsApp' ? 'Open WhatsApp' : `Send ${selectedChannel}`}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center">
                        <div className={`w-full max-w-[280px] aspect-9/16 bg-gray-900 rounded-[2.5rem] border-4 border-gray-800 shadow-2xl relative overflow-hidden flex flex-col transition-all duration-500 ${selectedChannel === 'Email' ? 'max-w-[340px] aspect-square' : ''}`}>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-b-xl z-10"></div>
                            <div className={`flex-1 bg-white m-1 rounded-4xl overflow-hidden flex flex-col p-4 pt-10 ${selectedChannel === 'WhatsApp' ? 'bg-[#e5ddd5]' : (selectedChannel === 'In-App' ? 'bg-slate-50' : '')}`}>
                                {selectedChannel === 'In-App' ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                            <div className="size-6 bg-primary rounded-lg flex items-center justify-center text-white">
                                                <LogoIcon size={12} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-slate-800">Support Team</p>
                                                <p className="text-[7px] text-slate-400">In-App Message</p>
                                            </div>
                                        </div>
                                        <div className="bg-primary/10 p-3 rounded-2xl rounded-tl-none self-start max-w-[90%] border border-primary/5">
                                            <p className="text-[10px] font-bold text-primary mb-1">{previewTitle}</p>
                                            <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">{previewMessage}</p>
                                            <p className="text-[8px] text-slate-400 text-right mt-1">Now</p>
                                        </div>
                                    </div>
                                ) : selectedChannel === 'WhatsApp' ? (
                                    <div className="space-y-2">
                                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm relative max-w-[90%]">
                                            <div className="absolute top-0 -left-2 w-0 h-0 border-t-8 border-t-white border-l-8 border-l-transparent"></div>
                                            <p className="text-[10px] font-bold text-blue-600 mb-1">{previewTitle}</p>
                                            <p className="text-[11px] text-gray-800 whitespace-pre-wrap">{previewMessage}</p>
                                            <p className="text-[8px] text-gray-400 text-right mt-1">12:00 PM</p>
                                        </div>
                                    </div>
                                ) : selectedChannel === 'SMS' ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-col items-center gap-1 mb-4">
                                            <div className="size-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                                <Users size={16} />
                                            </div>
                                            <span className="text-[8px] font-bold text-gray-500">VemTap</span>
                                        </div>
                                        <div className="bg-gray-100 p-3 rounded-2xl self-start max-w-[90%]">
                                            <p className="text-[11px] text-gray-800 whitespace-pre-wrap">{previewMessage}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 flex flex-col h-full">
                                        <div className="border-b border-gray-100 pb-2">
                                            <p className="text-[10px] text-gray-400">Subject: <span className="text-gray-900 font-bold">{previewTitle}</span></p>
                                            <p className="text-[10px] text-gray-400">From: <span className="text-gray-900">VemTap Support</span></p>
                                        </div>
                                        <div className="flex-1 text-[11px] text-gray-600 whitespace-pre-wrap py-2">
                                            {previewMessage}
                                        </div>
                                        <div className="mt-auto border-t border-gray-100 pt-4 flex flex-col items-center gap-2">
                                            <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                <LogoIcon size={16} />
                                            </div>
                                            <p className="text-[8px] text-gray-400">© 2026 VemTap. All rights reserved.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-text-secondary">
                            <Smartphone size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                {selectedChannel} Preview
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
