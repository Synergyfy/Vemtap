'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { MessageSquare, Send, Smartphone, Edit3, Check, ChevronDown, Users, Loader2 } from 'lucide-react';
import { notify } from '@/lib/notify';
import LogoIcon from '@/components/brand/LogoIcon';

interface SendMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName?: string;
    recipientPhone?: string;
    type: 'welcome' | 'general' | 'reward' | 'custom';
}

export default function SendMessageModal({ isOpen, onClose, recipientName, recipientPhone, type }: SendMessageModalProps) {
    const store = useCustomerFlowStore();
    const [selectedChannel, setSelectedChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
    const [selectedType, setSelectedType] = useState(type);
    const [name, setName] = useState(recipientName || '');
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        { id: 'welcome', label: 'Welcome Template', icon: MessageSquare, channels: ['WhatsApp', 'SMS', 'Email'] },
        { id: 'reward', label: 'Reward Template', icon: Send, channels: ['WhatsApp', 'SMS'] },
        { id: 'general', label: 'General Announcement', icon: Smartphone, channels: ['WhatsApp', 'SMS', 'Email'] },
        { id: 'custom', label: 'Custom Message', icon: Edit3, channels: ['WhatsApp', 'SMS', 'Email'] }
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
    const handleChannelChange = (channel: 'WhatsApp' | 'SMS' | 'Email') => {
        setSelectedChannel(channel);
        const templateExists = allTemplates.find(t => t.id === selectedType && t.channels.includes(channel));
        if (!templateExists) {
            setSelectedType('custom' as any);
        }
    };

    const handleSend = async () => {
        setIsLoading(true);
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update store as requested: "edit from the pop up modal should reflect in the template"
        if (selectedType === 'welcome') {
            store.updateCustomSettings({ welcomeMessage: message, welcomeTitle: title });
        } else if (selectedType === 'reward') {
            store.updateCustomSettings({ rewardMessage: message });
        }

        setIsLoading(false);
        notify.success(`Message sent to ${recipientName || name} via ${selectedChannel} successfully!`);
        onClose();
    };

    // Helper to replace tokens for preview
    const activeName = recipientName || name || '{name}';
    const previewMessage = message.replace(/{name}/g, activeName);
    const previewTitle = title.replace(/{name}/g, activeName);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={recipientName ? "Personalize Message" : "Compose New Message"}
            description={recipientName ? `Sending to ${recipientName}` : "Send a message to any visitor"}
            size="2xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                {/* Editor */}
                <div className="space-y-6">
                    {/* Channel Selection - NOW FIRST */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Select Channel</label>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            {(['WhatsApp', 'SMS', 'Email'] as const).map((channel) => (
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

                    {!recipientName && (
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
                            placeholder="e.g. Welcome back, {name}"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Message Content</label>
                        <textarea
                            rows={selectedChannel === 'Email' ? 10 : 6}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-5 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-sm resize-none"
                            placeholder="Type your message here..."
                        />
                        <div className="flex items-center justify-between gap-4 px-1">
                            <p className="text-[10px] text-text-secondary font-medium">
                                Use <code className="text-primary font-bold">{"{name}"}</code> for personalization.
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

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-14 border border-gray-100 text-text-main font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isLoading || (!recipientName && !name)}
                            className="flex-2 h-14 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin text-white" />
                            ) : (
                                <>
                                    <Send size={18} />
                                    Send {selectedChannel}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col items-center">
                    <div className={`w-full max-w-[280px] aspect-9/16 bg-gray-900 rounded-[2.5rem] border-4 border-gray-800 shadow-2xl relative overflow-hidden flex flex-col transition-all duration-500 ${selectedChannel === 'Email' ? 'max-w-[340px] aspect-square' : ''}`}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-b-xl z-10"></div>
                        <div className={`flex-1 bg-white m-1 rounded-4xl overflow-hidden flex flex-col p-4 pt-10 ${selectedChannel === 'WhatsApp' ? 'bg-[#e5ddd5]' : ''}`}>
                            {selectedChannel === 'WhatsApp' ? (
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
        </Modal>
    );
}

