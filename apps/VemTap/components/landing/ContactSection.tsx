import React from 'react';
import { MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react';

type ContactSectionProps = {
    isPage?: boolean;
};

const CONTACT_NUMBER = '+2349013666883';
const OFFICE_ADDRESS = 'B29 Awesome Plaza, Opp Chicken Republic, Apo Resettlement, Abuja.';
const MAP_LINK = 'https://maps.google.com/?q=B29+Awesome+Plaza,+Opp+Chicken+Republic,+Apo+Resettlement,+Abuja';

export default function ContactSection({ isPage = false }: ContactSectionProps) {
    return (
        <section id="contact" className={isPage ? 'pt-32 pb-24 bg-white' : 'py-24 bg-white'}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-[2rem] border border-primary/10 bg-linear-to-br from-[#eef3ff] to-[#f4f7ff] p-6 md:p-10 lg:p-12 shadow-[0_20px_80px_-40px_rgba(37,99,235,0.35)]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                        <div className="lg:col-span-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3">
                                Contact Us
                            </p>
                            <h2 className="text-4xl md:text-5xl font-display font-bold text-text-main leading-tight">
                                Connecting Near and Far
                            </h2>
                            <p className="mt-5 text-text-secondary font-medium text-base md:text-lg max-w-2xl leading-relaxed">
                                Reach our team directly for support, sales inquiries, and onboarding help.
                            </p>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-2xl bg-white/90 border border-white p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">
                                        Contact Number
                                    </p>
                                    <a href={`tel:${CONTACT_NUMBER}`} className="text-lg md:text-xl font-bold text-text-main hover:text-primary transition-colors">
                                        {CONTACT_NUMBER}
                                    </a>
                                </div>
                                <div className="rounded-2xl bg-white/90 border border-white p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">
                                        Office Address
                                    </p>
                                    <p className="text-sm md:text-base font-bold text-text-main leading-relaxed">
                                        {OFFICE_ADDRESS}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 md:p-7 border border-gray-100 shadow-lg h-fit">
                            <h3 className="text-3xl font-display font-bold text-text-main">Get in Touch</h3>
                            <p className="text-text-secondary font-medium mt-2">You can reach us anytime.</p>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <Phone size={18} className="text-primary mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Call</p>
                                        <a href={`tel:${CONTACT_NUMBER}`} className="text-sm font-bold text-text-main hover:text-primary transition-colors">
                                            {CONTACT_NUMBER}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <MapPin size={18} className="text-primary mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Visit Office</p>
                                        <p className="text-sm font-bold text-text-main leading-relaxed">{OFFICE_ADDRESS}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <Clock size={18} className="text-primary mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Availability</p>
                                        <p className="text-sm font-bold text-text-main">Mon - Sat, 9:00 AM - 6:00 PM</p>
                                    </div>
                                </div>
                            </div>

                            <a
                                href={MAP_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-primary-hover active:scale-[0.99]"
                            >
                                Open in Maps
                                <ArrowUpRight size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
