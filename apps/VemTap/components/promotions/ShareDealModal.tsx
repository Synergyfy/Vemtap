'use client';

import React from 'react';
import { X, MessageCircle, Mail, Twitter, Link2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShareDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    url: string;
}

const shareOptions = [
    {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: MessageCircle,
        bg: 'bg-emerald-50 text-emerald-600',
        hover: 'hover:bg-emerald-100',
    },
    {
        id: 'twitter',
        label: 'Twitter',
        icon: Twitter,
        bg: 'bg-sky-50 text-sky-600',
        hover: 'hover:bg-sky-100',
    },
    {
        id: 'email',
        label: 'Email',
        icon: Mail,
        bg: 'bg-blue-50 text-blue-600',
        hover: 'hover:bg-blue-100',
    },
];

export default function ShareDealModal({ isOpen, onClose, title, description, url }: ShareDealModalProps) {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen) return null;

    const waMessage = `*${title}*\n\n${description}\n\n${url}`;
    const emailBody = `${title}\n\n${description}\n\n${url}`;

    const handleShare = (id: string) => {
        switch (id) {
            case 'whatsapp': {
                const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
                window.open(waUrl, '_blank', 'noopener,noreferrer');
                break;
            }
            case 'twitter': {
                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title}\n\n${url}`)}`;
                window.open(tweetUrl, '_blank', 'noopener,noreferrer');
                break;
            }
            case 'email': {
                const mailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(emailBody)}`;
                window.open(mailUrl, '_blank', 'noopener,noreferrer');
                break;
            }
        }
        onClose();
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy link');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 pb-4">
                    <h3 className="text-lg font-black text-gray-900">Share This Deal</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-3">
                    {shareOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => handleShare(option.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl ${option.bg} ${option.hover} transition-all active:scale-[0.98]`}
                        >
                            <div className={`size-12 rounded-xl flex items-center justify-center ${option.bg}`}>
                                <option.icon size={22} />
                            </div>
                            <span className="text-sm font-bold text-gray-800">{option.label}</span>
                        </button>
                    ))}

                    <div className="border-t border-gray-100 pt-3">
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.98]"
                        >
                            <div className="size-12 rounded-xl bg-gray-200/60 flex items-center justify-center">
                                {copied ? <Check size={22} className="text-green-600" /> : <Link2 size={22} className="text-gray-600" />}
                            </div>
                            <div className="text-left">
                                <span className="text-sm font-bold text-gray-800">{copied ? 'Copied!' : 'Copy Link'}</span>
                                <p className="text-[10px] text-gray-400 font-medium">Share the direct link to this deal</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
