import React from 'react';
import { motion } from 'framer-motion';
import { 
    Instagram, 
    Facebook, 
    Twitter, 
    Linkedin, 
    Star,
    ExternalLink,
    ChevronLeft
} from 'lucide-react';
import { presets } from './presets';
import { VisitorHeader } from './VisitorHeader';

interface StepSocialConnectProps {
    storeName: string;
    logoUrl?: string | null;
    engagement: {
        instagram?: string;
        twitter?: string;
        facebook?: string;
        linkedin?: string;
        reviewUrl?: string;
    };
    onBack: () => void;
}

export const StepSocialConnect: React.FC<StepSocialConnectProps> = ({
    storeName,
    logoUrl,
    engagement,
    onBack
}) => {
    const safeHandle = (url: any, defaultLabel?: string) => {
        if (typeof url !== 'string' || !url || url === '[object Object]') return defaultLabel || '';
        try {
            return url.split('/').filter(Boolean).pop()?.replace('@', '') || defaultLabel || '';
        } catch {
            return defaultLabel || '';
        }
    };

    const socialPlatforms = [
        { 
            id: 'instagram', 
            label: 'Instagram', 
            icon: Instagram, 
            url: engagement.instagram, 
            color: 'text-pink-600', 
            bg: 'bg-pink-50',
            handle: safeHandle(engagement.instagram, 'Instagram')
        },
        { 
            id: 'facebook', 
            label: 'Facebook', 
            icon: Facebook, 
            url: engagement.facebook, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50',
            handle: safeHandle(engagement.facebook, 'Facebook')
        },
        { 
            id: 'twitter', 
            label: 'Twitter / X', 
            icon: Twitter, 
            url: engagement.twitter, 
            color: 'text-slate-900', 
            bg: 'bg-slate-100',
            handle: safeHandle(engagement.twitter, 'Twitter')
        },
        { 
            id: 'linkedin', 
            label: 'LinkedIn', 
            icon: Linkedin, 
            url: engagement.linkedin, 
            color: 'text-blue-700', 
            bg: 'bg-blue-50',
            handle: safeHandle(engagement.linkedin, 'LinkedIn')
        },
        { 
            id: 'reviews', 
            label: 'Google Review', 
            icon: Star, 
            url: engagement.reviewUrl, 
            color: 'text-yellow-600', 
            bg: 'bg-yellow-50',
            handle: 'Leave a Review'
        }
    ].filter(p => typeof p.url === 'string' && p.url.length > 0);

    const handleLink = (platform: string, url: string) => {
        // Deep link attempts
        const getUsername = (u: string) => u.split('/').filter(Boolean).pop()?.replace('@', '') || '';

        const deepLinks: Record<string, string> = {
            instagram: `instagram://user?username=${getUsername(url)}`,
            facebook: `fb://facewebmodal/f?href=${encodeURIComponent(url)}`,
            twitter: `twitter://user?screen_name=${getUsername(url)}`,
        };

        const deepLink = deepLinks[platform];
        if (deepLink) {
            // "Both" approach: Try deep link, if it fails within 1s, open in new tab
            const start = Date.now();
            window.location.href = deepLink;
            
            setTimeout(() => {
                // If the user hasn't left the page (diff < 1500ms), open web fallback
                if (Date.now() - start < 1500) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            }, 1000);
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={presets.card}
        >
            <button
                onClick={onBack}
                className="absolute top-8 right-8 size-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors group"
            >
                <ChevronLeft className="size-4 text-gray-400 group-hover:text-primary transition-colors" />
            </button>

            <VisitorHeader logoUrl={logoUrl} storeName={storeName} />

            <div className="mb-8">
                <span className={presets.tag}>Social Connect</span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                    Connect & Follow
                </h1>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Stay updated with {storeName} on your favorite platforms.
                </p>
            </div>

            <div className="space-y-3">
                {socialPlatforms.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => handleLink(platform.id, platform.url!)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-primary/20 hover:bg-slate-50/50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`size-12 rounded-xl ${platform.bg} flex items-center justify-center`}>
                                <platform.icon className={`size-6 ${platform.color}`} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                                    {platform.label}
                                </p>
                                <p className="text-[11px] font-medium text-slate-400 truncate max-w-[150px]">
                                    @{platform.handle}
                                </p>
                            </div>
                        </div>
                        <div className="size-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                            <ExternalLink className="size-3.5 text-slate-400 group-hover:text-white" />
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-8 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Thank you for your support
                </p>
            </div>
        </motion.div>
    );
};
