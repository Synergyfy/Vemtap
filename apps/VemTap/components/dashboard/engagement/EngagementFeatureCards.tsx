'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export type EngagementFeatureCard = {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    cta: string;
};

interface EngagementFeatureCardsProps {
    cards: EngagementFeatureCard[];
}

export default function EngagementFeatureCards({ cards }: EngagementFeatureCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((card) => (
                <Link
                    key={card.title}
                    href={card.href}
                    className="group bg-white rounded-2xl border border-blue-100 p-5 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                >
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">{card.eyebrow}</p>
                    <h3 className="text-lg font-display font-bold text-text-main mt-2">{card.title}</h3>
                    <p className="text-sm text-text-secondary font-medium mt-2 leading-relaxed">{card.description}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                        {card.cta}
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                </Link>
            ))}
        </div>
    );
}
