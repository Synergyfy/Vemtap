import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trust & Security',
    description: 'Vemtap Trust & Security - Enterprise-grade protection for your data.',
};

const trustSections = [
    {
        id: 'protection',
        title: 'Enterprise-Level Data Protection',
        icon: '🛡️',
        content: 'We comply with the Nigeria Data Protection Act (NDPA) and follow global best practices to ensure your data is handled responsibly.',
        list: [
            'Fully compliant data processing framework',
            'Transparent data usage policies',
            'Strict privacy controls'
        ]
    },
    {
        id: 'infra',
        title: 'Advanced Security Infrastructure',
        icon: '🔒',
        content: 'Your data is protected using industry-standard technologies to ensure confidentiality and integrity.',
        list: [
            'End-to-end encryption (HTTPS / TLS)',
            'Encrypted storage (AES-256)',
            'Secure cloud infrastructure (AWS / Google Cloud)',
            'Firewall & intrusion protection systems'
        ]
    },
    {
        id: 'access',
        title: 'Controlled Access & Accountability',
        icon: '👥',
        content: 'We ensure that only the right people access the right data through strict operational protocols.',
        list: [
            'Role-Based Access Control (RBAC)',
            'Admin access with time limits',
            'Activity logs & audit trails'
        ]
    },
    {
        id: 'control',
        title: 'Full Data Control for Businesses',
        icon: '📊',
        content: 'With Vemtap, you are always in control of your customer information and team permissions.',
        list: [
            'Access your customer data anytime',
            'Export or delete data easily',
            'Manage team permissions'
        ]
    },
    {
        id: 'qr',
        title: 'Secure QR Code Technology (QRThrive)',
        icon: '🔄',
        content: 'Our dynamic QR system is built with security in mind to prevent malicious activity.',
        list: [
            'Controlled and editable QR destinations',
            'Protection against malicious redirects',
            'Real-time data tracking and monitoring'
        ]
    },
    {
        id: 'threat',
        title: 'Proactive Threat Management',
        icon: '🚨',
        content: 'We don’t wait for problems — we prevent them through continuous system hardening.',
        list: [
            'Continuous monitoring',
            'Regular vulnerability testing',
            'Incident response system in place'
        ]
    }
];

export default function TrustSecurity() {
    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Navbar />
            
            <header className="pt-48 pb-24 bg-white border-b border-gray-100 overflow-hidden relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary rotate-3 shadow-inner">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-primary">Security Center</span>
                        </div>
                        <h1 className="text-[30px] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-main mb-8 leading-[1.15] tracking-tight">
                            Trust & <span className="blue-text-gradient italic underline decoration-primary/10">Security</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-text-secondary font-medium leading-relaxed italic">
                            🔐 Your Data. Your Customers. <span className="text-text-main font-bold underline decoration-primary/20 decoration-4">Fully Protected.</span>
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="max-w-3xl mb-32">
                    <p className="text-2xl leading-relaxed text-text-main font-medium italic mb-10 border-l-4 border-primary pl-8">
                        "At Vemtap, we understand that data is not just information — it is trust. That is why we have built our platform with enterprise-grade security, privacy, and compliance from the ground up."
                    </p>
                    <div className="w-24 h-1.5 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-16">
                    {trustSections.map((section) => (
                        <div key={section.id} id={section.id} className="group scroll-mt-32">
                            <div className="p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl mb-10 group-hover:bg-primary/5 group-hover:scale-110 transition-all duration-500 shadow-inner">
                                    {section.icon}
                                </div>
                                <h3 className="text-3xl font-display font-bold text-text-main mb-6 leading-tight">{section.title}</h3>
                                <p className="text-text-secondary font-medium italic mb-10 leading-relaxed text-lg">{section.content}</p>
                                
                                <div className="space-y-4">
                                    {section.list.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
                                            <div className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors"></div>
                                            <span className="text-sm font-bold text-text-secondary group-hover:text-text-main transition-colors italic tracking-wide">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <section className="mt-40 p-20 bg-text-main rounded-[4.5rem] text-white text-center relative overflow-hidden shadow-2xl shadow-primary/20">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full -mr-64 -mt-64 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full -ml-64 -mb-64 blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-10 backdrop-blur-xl border border-white/10">
                            <span className="text-4xl">🤝</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-10 tracking-tight">Built for Trust</h2>
                        <p className="text-gray-300 font-medium italic text-xl mb-16 max-w-3xl mx-auto leading-relaxed">
                            Whether you’re a small business or a large enterprise, Vemtap is designed to give you confidence in how your data is handled.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                            <div className="group flex items-center gap-4 px-8 py-4 bg-white/5 rounded-full border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <span className="text-sm font-bold tracking-wider uppercase">NDPA Compliant</span>
                            </div>
                            <div className="group flex items-center gap-4 px-8 py-4 bg-white/5 rounded-full border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-default">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                <span className="text-sm font-bold tracking-wider uppercase">Enterprise Grade</span>
                            </div>
                        </div>
                        <div className="mt-20 pt-10 border-t border-white/5 italic font-bold text-gray-400 text-sm">
                            Vemtap – Enterprise-Grade Data Protection for Modern Customer Engagement
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
