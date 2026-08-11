import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Vemtap Privacy Policy - Protecting and respecting your privacy.',
};

const sections = [
    { id: 'intro', title: '1. Introduction' },
    { id: 'scope', title: '2. Scope of Policy' },
    { id: 'collection', title: '3. Information We Collect' },
    { id: 'purpose', title: '4. Purpose of Data Processing' },
    { id: 'legal', title: '5. Legal Basis' },
    { id: 'sharing', title: '6. Data Sharing' },
    { id: 'transfers', title: '7. International Transfers' },
    { id: 'retention', title: '8. Data Retention' },
    { id: 'security', title: '9. Data Security' },
    { id: 'breach', title: '10. Breach Notification' },
    { id: 'rights', title: '11. Your Rights' },
    { id: 'minimization', title: '12. Data Minimization' },
    { id: 'access', title: '13. Access Control' },
    { id: 'children', title: '14. Children\'s Privacy' },
    { id: 'cookies', title: '15. Cookies' },
    { id: 'third-party', title: '16. Third-Party Links' },
    { id: 'dpo', title: '17. DPO' },
    { id: 'updates', title: '18. Updates' },
    { id: 'contact', title: '19. Contact' },
    { id: 'compliance', title: '20. Compliance' },
];

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Navbar />
            
            <header className="pt-48 pb-20 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">Legal Document</span>
                            <span className="h-px w-8 bg-gray-200"></span>
                            <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">v2.0</span>
                        </div>
                        <h1 className="text-[30px] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-main mb-8 leading-[1.15] tracking-tight">
                            Privacy <span className="blue-text-gradient">Policy</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <span className="text-text-secondary font-medium italic">Effective: January 31, 2026</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                <span className="text-text-secondary font-medium italic">Last Updated: [Insert Date]</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="flex flex-col lg:flex-row gap-20">
                    
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-32">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-8">Table of Contents</h4>
                            <nav className="space-y-1 border-l border-gray-100 max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                                {sections.map((section) => (
                                    <a 
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="group block py-2 px-4 text-xs font-bold text-gray-500 hover:text-primary border-l-2 border-transparent hover:border-primary -ml-px transition-all"
                                    >
                                        {section.title}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    <article className="flex-1 max-w-3xl">
                        <div className="space-y-24">
                            
                            {/* 1. Introduction */}
                            <section id="intro" className="scroll-mt-32">
                                <div className="p-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm shadow-gray-200/50">
                                    <h2 className="text-3xl font-display font-bold text-text-main mb-8">Introduction</h2>
                                    <p className="text-xl leading-relaxed text-text-main font-medium italic mb-8">
                                        "Welcome to Vemtap. We are committed to protecting and respecting your privacy. This policy explains how we handle your information with the highest standards of security."
                                    </p>
                                    <p className="text-text-secondary leading-relaxed font-medium">
                                        This document is designed to meet enterprise standards and comply with applicable data protection laws, including the Nigeria Data Protection Act (NDPA). By accessing or using our services, you agree to this Privacy Policy.
                                    </p>
                                </div>
                            </section>

                            {/* 2. Scope */}
                            <section id="scope" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">02</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-8">Scope of Policy</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium mb-6">This Privacy Policy applies to:</p>
                                        <div className="grid sm:grid-cols-3 gap-4">
                                            {['Business Users', 'End Customers', 'Web Visitors'].map((item) => (
                                                <div key={item} className="p-6 bg-white rounded-2xl border border-gray-100 font-bold text-sm text-text-secondary hover:border-primary/20 transition-colors">
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 3. Information Collection */}
                            <section id="collection" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">03</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-8">Information We Collect</h2>
                                        
                                        <div className="space-y-12">
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-6">3.1 Personal Data</h4>
                                                <div className="flex flex-wrap gap-3">
                                                    {['Full Name', 'Phone Number', 'Email Address', 'Business Details'].map(tag => (
                                                        <span key={tag} className="px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold text-text-secondary">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-6">3.2 Customer Interaction</h4>
                                                <p className="text-text-secondary leading-relaxed font-medium mb-4">Data captured during platform engagement:</p>
                                                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                                                    {['QR Code Scans', 'Orders & Requests', 'Form Submissions', 'Messages & Inquiries'].map(li => (
                                                        <li key={li} className="flex items-center gap-3 text-sm font-bold text-text-secondary italic">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                                            {li}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-6">3.3 Technical Data</h4>
                                                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                                                    {['IP address', 'Browser version', 'Device type', 'Access logs'].map(li => (
                                                        <li key={li} className="flex items-center gap-3 text-sm font-bold text-text-secondary italic">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                                            {li}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="p-8 bg-primary/[0.02] rounded-3xl border border-primary/5">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 text-center">3.4 Behavioral & Cookies</h4>
                                                <p className="text-center text-sm text-text-secondary font-medium italic">We track usage patterns (pages visited, features used) and employ cookies (session, analytics, preference) to optimize your experience.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 4. Purpose */}
                            <section id="purpose" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">04</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Purpose of Processing</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg mb-6">We process data to provide, operate, and maintain our platform, facilitate interactions, deliver analytics, improve system performance, and comply with legal obligations.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 5. Legal Basis */}
                            <section id="legal" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">05</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Legal Basis</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg">Our processing relies on user consent, performance of a contract, compliance with legal obligations, and legitimate business interests.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 6. Data Sharing */}
                            <section id="sharing" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">06</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-8">Data Sharing & Disclosure</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium mb-8 italic">We do not sell personal data.</p>
                                        <div className="space-y-6">
                                            <div className="p-6 bg-white rounded-2xl border border-gray-100">
                                                <h4 className="text-sm font-bold text-text-main mb-2">6.1 Business Clients</h4>
                                                <p className="text-sm text-text-secondary leading-relaxed">Customer data collected through Vemtap is shared with the respective business for operational purposes.</p>
                                            </div>
                                            <div className="p-6 bg-white rounded-2xl border border-gray-100">
                                                <h4 className="text-sm font-bold text-text-main mb-2">6.2 Service Providers</h4>
                                                <p className="text-sm text-text-secondary leading-relaxed">We engage trusted third parties for cloud hosting, analytics, and communication, bound by strict protection obligations.</p>
                                            </div>
                                            <div className="p-6 bg-white rounded-2xl border border-gray-100">
                                                <h4 className="text-sm font-bold text-text-main mb-2">6.3 Legal Authorities</h4>
                                                <p className="text-sm text-text-secondary leading-relaxed">We may disclose data where required by law or to protect rights, safety, and security.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 7. International Transfers */}
                            <section id="transfers" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">07</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">International Transfers</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg">For data transferred outside Nigeria, we implement robust safeguards including standard contractual clauses and secure hosting environments.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 8. Retention */}
                            <section id="retention" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">08</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Data Retention Policy</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg">We retain data only as long as necessary: active accounts for continuity; inactive data deleted/anonymized after 12 months; legal obligations as required.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 9. Security (Highlighted) */}
                            <section id="security" className="scroll-mt-32">
                                <div className="p-10 bg-primary rounded-[2.5rem] text-white shadow-2xl shadow-primary/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                    <h2 className="text-3xl font-display font-bold mb-8 relative">Data Security Measures</h2>
                                    <div className="grid sm:grid-cols-2 gap-8 relative">
                                        {[
                                            'Encryption in Transit (TLS)',
                                            'Encryption at Rest (AES-256)',
                                            'Role-Based Access Control',
                                            'Multi-Factor Auth (MFA)',
                                            'Continuous Log Monitoring',
                                            'Secure Cloud Infrastructure'
                                        ].map(item => (
                                            <div key={item} className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <span className="font-bold text-sm italic tracking-wide">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* 10. Breach Notification */}
                            <section id="breach" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">10</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Breach Notification</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg mb-6">In the event of a breach, we detect/contain, assess risks, notify affected users/authorities where required, and implement corrective measures.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 11. Rights */}
                            <section id="rights" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">11</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-8">Your Data Protection Rights</h2>
                                        <p className="text-text-secondary font-medium mb-10">You possess extensive rights regarding your data, including access, correction, deletion, and portability.</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                            {['Access Data', 'Correct Data', 'Request Deletion', 'Withdraw Consent', 'Object Processing', 'Data Portability'].map(right => (
                                                <div key={right} className="aspect-square flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 text-center">{right}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 12. Data Minimization */}
                            <section id="minimization" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">12</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Data Minimization</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg">We only collect data that is necessary for the intended purpose and limit access strictly to authorized users.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 13. Access Control */}
                            <section id="access" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">13</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-8">Access Control & Accountability</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium mb-6 italic">We enforce strict security protocols:</p>
                                        <ul className="grid sm:grid-cols-2 gap-4">
                                            {['Role-based permissions', 'Time-limited admin access', 'Activity logs', 'Audit trails'].map(li => (
                                                <li key={li} className="p-4 bg-white rounded-xl border border-gray-50 flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                                    <span className="text-sm font-bold text-text-secondary italic">{li}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* 14. Children's Privacy */}
                            <section id="children" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">14</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Children's Privacy</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg">Our services are not intended for individuals under 13. We do not knowingly collect such data.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 15. Cookies */}
                            <section id="cookies" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">15</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Cookies and Tracking</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg mb-6">We use cookies to maintain sessions, analyze usage, and improve performance. For full details, refer to our <a href="/cookie-policy" className="text-primary underline">Cookie Policy</a>.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 16. Third-Party Links */}
                            <section id="third-party" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">16</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Third-Party Links</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg">We are not responsible for the privacy practices of third-party websites or services linked on our platform.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 17. DPO */}
                            <section id="dpo" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">17</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Data Protection Officer</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg">We have appointed a DPO responsible for overseeing compliance and strategy. Contact: <a href="mailto:[Insert DPO Email]" className="text-primary font-bold hover:underline">[Insert DPO Email]</a>.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 18. Updates */}
                            <section id="updates" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">18</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">Updates to This Policy</h2>
                                        <p className="text-text-secondary leading-relaxed font-medium text-lg">We may update this policy periodically. Changes will be communicated via our platform.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 19. Contact */}
                            <section id="contact" className="scroll-mt-32">
                                <div className="text-center p-16 bg-white rounded-[3rem] border border-gray-100 shadow-sm shadow-gray-200/50">
                                    <h2 className="text-3xl font-display font-bold text-text-main mb-6 uppercase tracking-tight italic">Contact Us</h2>
                                    <p className="text-text-secondary font-medium italic mb-10 max-w-sm mx-auto uppercase underline">For inquiries or complaints:</p>
                                    <div className="flex flex-col gap-2 mb-8 font-bold italic">
                                        <a href="mailto:[Insert Email]" className="text-primary underline">Email: [Insert Email]</a>
                                        <span className="text-text-secondary">Website: [Insert Website]</span>
                                    </div>
                                    <a 
                                        href="mailto:[Insert Email]" 
                                        className="inline-flex items-center justify-center px-10 py-5 bg-text-main text-white font-bold uppercase tracking-wider text-xs rounded-full hover:bg-primary transition-all shadow-xl shadow-gray-200"
                                    >
                                        Message Privacy Team
                                    </a>
                                </div>
                            </section>

                            {/* 20. Compliance */}
                            <section id="compliance" className="scroll-mt-32">
                                <div className="p-10 bg-gray-100 rounded-[2rem] border border-gray-200 text-center">
                                    <h2 className="text-2xl font-display font-bold text-text-main mb-4">Regulatory Compliance</h2>
                                    <p className="text-sm font-bold text-text-secondary italic">This Privacy Policy complies with the Nigeria Data Protection Act (NDPA) and applicable international data protection standards.</p>
                                    <p className="mt-8 text-[10px] font-bold uppercase tracking-wider text-gray-400 italic">Vemtap – Enterprise-Grade Data Protection</p>
                                </div>
                            </section>

                        </div>
                    </article>
                </div>
            </div>

            <Footer />
        </div>
    );
}
