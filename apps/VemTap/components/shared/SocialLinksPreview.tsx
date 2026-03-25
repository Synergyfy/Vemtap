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

    const normalizeUrl = (value: string | undefined) => {
        if (!value) return '';
        const trimmed = value.trim();
        if (!trimmed) return '';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith('www.')) return `https://${trimmed}`;
        if (!trimmed.includes('.') && !trimmed.includes('/')) return `https://${trimmed}`;
        return `https://${trimmed}`;
    };

    const hasExplicit = Boolean(
        settings.instagram || settings.twitter || settings.facebook || settings.linkedin
    );

    const resolved = {
        instagram: normalizeUrl(settings.instagram || (!hasExplicit && showPlaceholders ? PLACEHOLDERS.instagram : '')),
        twitter: normalizeUrl(settings.twitter || (!hasExplicit && showPlaceholders ? PLACEHOLDERS.twitter : '')),
        facebook: normalizeUrl(settings.facebook || (!hasExplicit && showPlaceholders ? PLACEHOLDERS.facebook : '')),
        linkedin: normalizeUrl(settings.linkedin || (!hasExplicit && showPlaceholders ? PLACEHOLDERS.linkedin : '')),
    };

    const links = [
        { label: 'Instagram', url: resolved.instagram },
        { label: 'X / Twitter', url: resolved.twitter },
        { label: 'Facebook', url: resolved.facebook },
        { label: 'LinkedIn', url: resolved.linkedin },
    ];

    const fallbackSocialUrl = !hasExplicit ? normalizeUrl(settings.socialUrl) : '';
    const hasAnyLinks = links.some((link) => Boolean(link.url)) || Boolean(fallbackSocialUrl);

    return (
        <div className={`mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 ${className}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{title}</p>
            {hasAnyLinks ? (
                <div className="grid grid-cols-1 gap-2">
                    {links.map((link) =>
                        link.url ? (
                            <a
                                key={link.label}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 border border-gray-100 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <span className="truncate">{link.label}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open</span>
                            </a>
                        ) : null
                    )}
                    {fallbackSocialUrl && (
                        <a
                            href={fallbackSocialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 border border-gray-100 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <span className="truncate">Social Link</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Open</span>
                        </a>
                    )}
                </div>
            ) : (
                <p className="text-xs text-slate-500">Social links are enabled. Add them in Socials to display here.</p>
            )}
        </div>
    );
};
