import React from 'react';

type SocialSettings = {
    showSocial?: boolean;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    socialUrl?: string;
};

interface SocialLinksPreviewProps {
    settings?: SocialSettings | null;
    title?: string;
    className?: string;
    showPlaceholders?: boolean;
}

const PLACEHOLDERS = {
    instagram: 'https://instagram.com/your-handle',
    twitter: 'https://x.com/your-handle',
    facebook: 'https://facebook.com/your-page',
    linkedin: 'https://linkedin.com/company/your-company',
};

export const SocialLinksPreview: React.FC<SocialLinksPreviewProps> = ({
    settings,
    title = 'Social Links',
    className = '',
    showPlaceholders = true,
}) => {
    if (!settings?.showSocial) return null;

    const hasExplicit = Boolean(
        settings.instagram || settings.twitter || settings.facebook || settings.linkedin
    );

    const resolved = {
        instagram: settings.instagram || (!hasExplicit && showPlaceholders ? PLACEHOLDERS.instagram : ''),
        twitter: settings.twitter || (!hasExplicit && showPlaceholders ? PLACEHOLDERS.twitter : ''),
        facebook: settings.facebook || (!hasExplicit && showPlaceholders ? PLACEHOLDERS.facebook : ''),
        linkedin: settings.linkedin || (!hasExplicit && showPlaceholders ? PLACEHOLDERS.linkedin : ''),
    };

    const links = [
        { label: 'Instagram', url: resolved.instagram },
        { label: 'X / Twitter', url: resolved.twitter },
        { label: 'Facebook', url: resolved.facebook },
        { label: 'LinkedIn', url: resolved.linkedin },
    ];

    const fallbackSocialUrl = !hasExplicit ? settings.socialUrl : '';
    const hasAnyLinks = links.some((link) => Boolean(link.url)) || Boolean(fallbackSocialUrl);

    return (
        <div className={`mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 ${className}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{title}</p>
            {hasAnyLinks ? (
                <div className="space-y-2 text-xs text-slate-700">
                    {links.map((link) =>
                        link.url ? (
                            <div key={link.label} className="flex items-center justify-between gap-4 rounded-xl bg-white px-3 py-2 border border-gray-100">
                                <span className="font-semibold">{link.label}</span>
                                <span className="truncate text-slate-500">{link.url}</span>
                            </div>
                        ) : null
                    )}
                    {fallbackSocialUrl && (
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-3 py-2 border border-gray-100">
                            <span className="font-semibold">Social Link</span>
                            <span className="truncate text-slate-500">{fallbackSocialUrl}</span>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-xs text-slate-500">Social links are enabled. Add them in Socials to display here.</p>
            )}
        </div>
    );
};
