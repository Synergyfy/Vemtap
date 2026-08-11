'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Clock, ArrowUpRight, Send, MessageCircle, Loader2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useChatStore } from '@/store/chatStore';

type ContactSectionProps = {
    isPage?: boolean;
};

const CONTACT_NUMBER = '+2349013666883';
const CONTACT_EMAIL = 'support@vemtap.com';
const OFFICE_ADDRESS = 'B29 Awesome Plaza, Opp Chicken Republic, Apo Resettlement, Abuja.';
const MAP_LINK = 'https://maps.google.com/?q=B29+Awesome+Plaza,+Opp+Chicken+Republic,+Apo+Resettlement,+Abuja';
const WHATSAPP_MESSAGE =
    'Hello VemTap! I found your business guide and I would love to learn more about how VEMTAP can help my business get discovered, engage customers and grow.';
const WHATSAPP_LINK = `https://wa.me/message/DNSNHBIA3YZLK1?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function ContactSection({ isPage = false }: ContactSectionProps) {
    const setIsOpen = useChatStore((s) => s.setIsOpen);
    const setIsVisible = useChatStore((s) => s.setIsVisible);

    const openChat = () => {
        setIsVisible(true);
        setIsOpen(true);
    };

    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);

    const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            toast.error('Please fill in your name, email and message.');
            return;
        }

        setSending(true);

        const body = [
            `Name: ${form.name}`,
            `Email: ${form.email}`,
            form.phone ? `Phone: ${form.phone}` : null,
            `Subject: ${form.subject || 'General Inquiry'}`,
            '',
            form.message,
        ]
            .filter(Boolean)
            .join('\n');

        const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
            `Website Contact: ${form.subject || 'General Inquiry'}`
        )}&body=${encodeURIComponent(body)}`;

        setTimeout(() => {
            window.location.href = mailto;
            setSending(false);
            toast.success('Your message is ready — your email app will open so you can send it.');
        }, 300);
    };

    const inputClass =
        'w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-primary/40 transition-all';

    return (
        <section id="contact" className={isPage ? 'pt-24 pb-16 bg-white' : 'py-12 md:py-16 bg-white'}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* HEADER */}
                <div className="text-center mb-12 md:mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full mb-5">
                        <MessageCircle size={12} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                            Contact Us
                        </span>
                    </div>
                    <h2 className="text-[28px] md:text-5xl font-bold text-text-main leading-[1.15] tracking-tight">
                        We&apos;d Love to Hear <span className="text-primary">from You</span>
                    </h2>
                    <p className="mt-4 text-sm md:text-lg text-text-secondary font-normal max-w-2xl mx-auto leading-relaxed">
                        Pick the channel that works best for you — call, WhatsApp, chat or email. Our team is here to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6">
                    {/* LEFT: CONTACT METHODS */}
                    <div className="lg:col-span-2 space-y-3">
                        {/* 1 — CALL US */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="size-11 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                                    <Phone size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary mb-1">
                                        Call Us
                                    </p>
                                    <a href={`tel:${CONTACT_NUMBER}`} className="text-[15px] md:text-base font-semibold text-text-main hover:text-primary transition-colors break-all">
                                        {CONTACT_NUMBER}
                                    </a>
                                    <p className="text-[13px] text-text-secondary font-normal mt-1 flex items-center gap-1.5">
                                        <Clock size={12} /> Mon – Sat, 9:00 AM – 6:00 PM
                                    </p>
                                </div>
                            </div>
                            <a href={`tel:${CONTACT_NUMBER}`} className="mt-4 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider px-4 py-3 hover:bg-primary hover:text-white transition-all active:scale-[0.99]">
                                Call Now <ArrowUpRight size={13} />
                            </a>
                        </div>

                        {/* 2 — WHATSAPP */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="size-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                    <FaWhatsapp size={22} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary mb-1">
                                        WhatsApp
                                    </p>
                                    <p className="text-[15px] md:text-base font-semibold text-text-main">Chat with Us on WhatsApp</p>
                                    <p className="text-[13px] text-text-secondary font-normal mt-1">
                                        Instant replies — message is pre-filled for you
                                    </p>
                                </div>
                            </div>
                            <a
                                href={WHATSAPP_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#25D366] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 hover:brightness-105 transition-all active:scale-[0.99]"
                            >
                                Chat on WhatsApp <FaWhatsapp size={13} />
                            </a>
                        </div>

                        {/* 3 — LIVE CHAT */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="size-11 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                                    <MessageCircle size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary mb-1">
                                        Live Chat
                                    </p>
                                    <p className="text-[15px] md:text-base font-semibold text-text-main">Chat with Our Team</p>
                                    <p className="text-[13px] text-text-secondary font-normal mt-1 flex items-center gap-1.5">
                                        <span className="size-1.5 rounded-full bg-emerald-500" /> Available 24/7
                                    </p>
                                </div>
                            </div>
                            <button onClick={openChat} className="mt-4 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 hover:bg-primary-hover transition-all active:scale-[0.99]">
                                Start Chat <MessageCircle size={13} />
                            </button>
                        </div>

                        {/* 4 — EMAIL */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="size-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                    <Mail size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary mb-1">
                                        Email Us
                                    </p>
                                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-[15px] md:text-base font-semibold text-text-main hover:text-primary transition-colors break-all">
                                        {CONTACT_EMAIL}
                                    </a>
                                    <p className="text-[13px] text-text-secondary font-normal mt-1">
                                        Avg. response: within 2 hours
                                    </p>
                                </div>
                            </div>
                            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-4 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-rose-50 text-rose-500 text-[10px] font-bold uppercase tracking-wider px-4 py-3 hover:bg-rose-500 hover:text-white transition-all active:scale-[0.99]">
                                Send Email <ArrowUpRight size={13} />
                            </a>
                        </div>

                        {/* 5 — VISIT OFFICE */}
                        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 md:p-6">
                            <div className="flex items-start gap-4">
                                <div className="size-11 rounded-xl bg-white border border-gray-100 text-text-main flex items-center justify-center shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary mb-1">
                                        Visit Office
                                    </p>
                                    <p className="text-sm md:text-[15px] font-semibold text-text-main leading-relaxed">
                                        {OFFICE_ADDRESS}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={MAP_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-3 hover:bg-primary transition-all active:scale-[0.99]"
                            >
                                Open in Maps <ArrowUpRight size={13} />
                            </a>
                        </div>
                    </div>

                    {/* RIGHT: CONTACT FORM */}
                    <div className="lg:col-span-3">
                        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 md:p-8 shadow-sm h-full">
                            <h3 className="text-2xl md:text-3xl font-bold text-text-main tracking-tight">
                                Send Us a Message
                            </h3>
                            <p className="text-sm text-text-secondary font-normal mt-2 mb-7">
                                Fill out the form and our team will get back to you as soon as possible.
                            </p>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary block mb-2">
                                        Full Name <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={update('name')}
                                        placeholder="John Doe"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary block mb-2">
                                        Email Address <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={update('email')}
                                        placeholder="john@company.com"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary block mb-2">
                                        Phone <span className="text-text-secondary opacity-50">(optional)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={update('phone')}
                                        placeholder="+234 800 000 0000"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary block mb-2">
                                        Subject <span className="text-text-secondary opacity-50">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.subject}
                                        onChange={update('subject')}
                                        placeholder="How can we help?"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary block mb-2">
                                        Message <span className="text-primary">*</span>
                                    </label>
                                    <textarea
                                        value={form.message}
                                        onChange={update('message')}
                                        placeholder="Tell us how we can help you..."
                                        rows={5}
                                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm font-medium outline-none focus:ring-4 focus:ring-blue-50 focus:border-primary/40 transition-all resize-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-primary/20 hover:bg-primary-hover transition-all active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
                                    >
                                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                        Send Message
                                    </button>
                                    <p className="text-center text-xs text-text-secondary font-normal mt-4">
                                        Prefer support fast? Use <button type="button" onClick={openChat} className="text-primary font-semibold hover:underline">Live Chat</button> or{" "}
                                        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-semibold hover:underline">
                                            WhatsApp
                                        </a>.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}