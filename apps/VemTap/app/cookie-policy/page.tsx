import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cookie Policy',
    description: 'Vemtap Cookie Policy - Information about how we use cookies and similar technologies.',
};

const sections = [
    { id: 'intro', title: '1. Introduction' },
    { id: 'what-are-cookies', title: '2. What Are Cookies?' },
    { id: 'types', title: '3. Types of Cookies' },
    { id: 'how-we-use', title: '4. How We Use Cookies' },
    { id: 'third-party', title: '5. Third-Party Cookies' },
    { id: 'consent', title: '6. Cookie Consent Management' },
    { id: 'managing', title: '7. Managing Cookies' },
    { id: 'retention', title: '8. Cookie Retention' },
    { id: 'updates', title: '9. Updates to This Policy' },
    { id: 'contact', title: '10. Contact Us' },
    { id: 'compliance', title: '11. Compliance' },
];

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Navbar />
            
            <header className="pt-48 pb-20 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Policy Document</span>
                            <span className="h-px w-8 bg-gray-200"></span>
                            <span className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">v1.2</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-display font-bold text-text-main mb-8 leading-tight">
                            Cookie <span className="blue-text-gradient">Policy</span>
                        </h1>
                        <p className="text-text-secondary font-medium italic">Effective Date: [Insert Date] | Last Updated: [Insert Date]</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="flex flex-col lg:flex-row gap-20">
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-32">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8">Table of Contents</h4>
                            <nav className="space-y-1 border-l border-gray-100 max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                                {sections.map((section) => (
                                    <a key={section.id} href={`#${section.id}`} className="group block py-2 px-4 text-xs font-bold text-gray-500 hover:text-primary border-l-2 border-transparent hover:border-primary -ml-px transition-all">{section.title}</a>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    <article className="flex-1 max-w-3xl">
                        <div className="space-y-24">
                            <section id="intro" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-8">1. Introduction</h2>
                                <p className="text-lg leading-relaxed text-text-secondary font-medium">This Cookie Policy explains how Vemtap ("we", "our", "us") uses cookies and similar tracking technologies on our websites, applications, and services, including Vemtap and QRThrive (collectively, the "Services").</p>
                                <p className="mt-4 text-lg leading-relaxed text-text-secondary font-medium italic">By using our Services, you consent to the use of cookies as described in this policy, subject to your preferences.</p>
                            </section>

                            <section id="what-are-cookies" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-8">2. What Are Cookies?</h2>
                                <p className="text-lg leading-relaxed text-text-secondary font-medium">Cookies are small text files placed on your device (computer, mobile, or tablet) when you visit a website. They help websites function, remember preferences, and provide analytics information.</p>
                                <p className="mt-4 text-lg leading-relaxed text-text-secondary font-medium">We may also use similar technologies such as web beacons, pixels, and local storage.</p>
                            </section>

                            <section id="types" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-8">3. Types of Cookies We Use</h2>
                                <div className="space-y-6">
                                    {[
                                        { title: '3.1 Strictly Necessary Cookies', desc: 'Essential for the operation of our Services.', examples: ['Session management', 'Authentication', 'Security and fraud prevention'], basis: 'Legitimate interest (no consent required)' },
                                        { title: '3.2 Performance & Analytics Cookies', desc: 'Help us understand how users interact with our platform.', examples: ['Page visits', 'Feature usage', 'Error tracking'], basis: 'Consent (where required)' },
                                        { title: '3.3 Functional Cookies', desc: 'Remember your preferences and settings.', examples: ['Language preferences', 'Saved settings'], basis: 'Consent (where required)' },
                                        { title: '3.4 Marketing & Tracking Cookies', desc: 'Used to deliver relevant content or measure campaign effectiveness.', examples: ['Campaign tracking', 'Conversion tracking'], basis: 'Explicit consent' },
                                    ].map(c => (
                                        <div key={c.title} className="p-8 bg-white rounded-3xl border border-gray-100">
                                            <h4 className="text-lg font-bold text-text-main mb-3">{c.title}</h4>
                                            <p className="text-text-secondary italic mb-4">{c.desc}</p>
                                            <p className="text-xs font-black uppercase text-primary mb-2">Examples:</p>
                                            <ul className="list-disc pl-5 mb-4 text-text-secondary font-medium">
                                                {c.examples.map(ex => <li key={ex}>{ex}</li>)}
                                            </ul>
                                            <p className="text-xs font-bold text-text-main uppercase">Legal Basis: <span className="text-text-secondary italic">{c.basis}</span></p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="how-we-use" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-8">4. How We Use Cookies</h2>
                                <ul className="grid sm:grid-cols-2 gap-4 text-text-secondary font-medium">
                                    {['Ensure platform functionality', 'Authenticate users & maintain sessions', 'Analyze usage & improve performance', 'Remember user preferences', 'Measure marketing effectiveness', 'Enhance security & detect fraud'].map(item => (
                                        <li key={item} className="p-4 bg-white rounded-xl border border-gray-50 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div> {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section id="third-party" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">5. Third-Party Cookies</h2>
                                <p className="text-lg leading-relaxed text-text-secondary font-medium">We may allow third-party service providers (e.g., analytics or cloud providers) to place cookies on your device. These third parties are responsible for their own cookie practices and are contractually required to protect your data.</p>
                            </section>

                            <section id="consent" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">6. Cookie Consent Management</h2>
                                <p className="text-lg leading-relaxed text-text-secondary font-medium">Where required by law, we obtain your consent before placing non-essential cookies. You can accept all, reject non-essential, or customize your preferences. We provide a cookie banner and preference center to manage your choices.</p>
                            </section>

                            <section id="managing" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">7. Managing Cookies</h2>
                                <p className="text-lg leading-relaxed text-text-secondary font-medium">You can control or delete cookies through your browser settings. Common actions include blocking, deleting, or setting alerts before cookies are stored. Note: Disabling cookies may affect functionality of the Services.</p>
                            </section>

                            <section id="retention" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">8. Cookie Retention</h2>
                                <ul className="list-disc pl-5 text-lg leading-relaxed text-text-secondary font-medium">
                                    <li>Session cookies: deleted when you close your browser</li>
                                    <li>Persistent cookies: stored for a defined period or until manually deleted</li>
                                </ul>
                                <p className="mt-4 text-lg leading-relaxed text-text-secondary font-medium">We retain cookies only as long as necessary for their purpose.</p>
                            </section>

                            <section id="updates" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">9. Updates to This Policy</h2>
                                <p className="text-lg leading-relaxed text-text-secondary font-medium">We may update this Cookie Policy from time to time. Changes will be posted with an updated revision date.</p>
                            </section>

                            <section id="contact" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">10. Contact Us</h2>
                                <p className="text-lg leading-relaxed text-text-secondary font-medium">If you have questions about this Cookie Policy, contact us:</p>
                                <p className="text-lg font-bold mt-4">Email: <a href="mailto:[Insert Email]" className="text-primary hover:underline">[Insert Email]</a></p>
                                <p className="text-lg font-bold">Website: <a href="[Insert Website]" className="text-primary hover:underline">[Insert Website]</a></p>
                            </section>

                            <section id="compliance" className="scroll-mt-32">
                                <div className="p-8 bg-gray-100 rounded-3xl">
                                    <h2 className="text-2xl font-display font-bold text-text-main mb-4">11. Compliance</h2>
                                    <p className="text-text-secondary font-medium">This Cookie Policy is designed to comply with the Nigeria Data Protection Act (NDPA) and applicable international privacy and electronic communications regulations.</p>
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
