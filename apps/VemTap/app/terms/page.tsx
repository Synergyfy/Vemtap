import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Vemtap Terms of Service - Governing your access to and use of our Services.',
};

const sections = [
    { id: 'intro', title: '1. Introduction' },
    { id: 'definitions', title: '2. Definitions' },
    { id: 'eligibility', title: '3. Eligibility' },
    { id: 'overview', title: '4. Services Overview' },
    { id: 'account', title: '5. Account Registration' },
    { id: 'use', title: '6. Acceptable Use Policy' },
    { id: 'data', title: '7. Data Protection & Privacy' },
    { id: 'ip', title: '8. Intellectual Property' },
    { id: 'availability', title: '9. Service Availability' },
    { id: 'fees', title: '10. Fees and Payments' },
    { id: 'third-party', title: '11. Third-Party Services' },
    { id: 'liability', title: '12. Limitation of Liability' },
    { id: 'indemnity', title: '13. Indemnification' },
    { id: 'termination', title: '14. Suspension and Termination' },
    { id: 'retention', title: '15. Data Retention' },
    { id: 'confidentiality', title: '16. Confidentiality' },
    { id: 'security', title: '17. Security Disclaimer' },
    { id: 'force-majeure', title: '18. Force Majeure' },
    { id: 'law', title: '19. Governing Law' },
    { id: 'changes', title: '20. Changes to Terms' },
    { id: 'contact', title: '21. Contact Information' },
];

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Navbar />
            
            <header className="pt-48 pb-20 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">Legal Agreement</span>
                            <span className="h-px w-8 bg-gray-200"></span>
                            <span className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">v2.1</span>
                        </div>
                        <h1 className="text-[30px] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-main mb-8 leading-[1.15] tracking-tight">
                            Terms of <span className="blue-text-gradient">Service</span>
                        </h1>
                        <p className="text-text-secondary font-medium italic">Last Updated: [Insert Date]</p>
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
                            
                            <section id="intro" className="scroll-mt-32">
                                <div className="p-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm shadow-gray-200/50">
                                    <h2 className="text-3xl font-display font-bold text-text-main mb-6">1. Introduction</h2>
                                    <p className="text-lg leading-relaxed text-text-secondary font-medium italic">These Terms of Service ("Terms") govern your access to and use of Vemtap and QRThrive (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms.</p>
                                    <p className="text-lg leading-relaxed text-text-secondary font-medium italic mt-4">If you do not agree, you must not use the Services.</p>
                                </div>
                            </section>

                            <section id="definitions" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-8">2. Definitions</h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { k: 'Platform', v: 'Vemtap and QRThrive systems' },
                                        { k: 'User', v: 'Any individual or entity using the Services' },
                                        { k: 'Business User', v: 'A company or individual using Vemtap for business purposes' },
                                        { k: 'Customer', v: 'End-user interacting with a Business via the Platform' }
                                    ].map((def) => (
                                        <div key={def.k} className="p-6 bg-white rounded-2xl border border-gray-100">
                                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">{def.k}</h5>
                                            <p className="text-sm font-bold text-text-secondary italic">{def.v}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="eligibility" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">3. Eligibility</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">You must:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Be at least 18 years old</li>
                                    <li>Have authority to enter into a binding agreement</li>
                                </ul>
                            </section>

                            <section id="overview" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">4. Services Overview</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">Vemtap provides:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Customer engagement tools</li>
                                    <li>QR-based data collection</li>
                                    <li>Messaging and interaction systems</li>
                                    <li>Analytics and reporting tools</li>
                                </ul>
                                <p className="mt-4 text-text-secondary font-medium">Services may evolve over time.</p>
                            </section>

                            <section id="account" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">5. Account Registration & Responsibility</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">Users must:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Provide accurate information</li>
                                    <li>Maintain account security</li>
                                    <li>Be responsible for all activities under their account</li>
                                </ul>
                                <p className="mt-4 text-text-secondary font-medium">Vemtap is not liable for unauthorized access caused by user negligence.</p>
                            </section>

                            <section id="use" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">6. Acceptable Use Policy</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">Users agree NOT to:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Use the platform for illegal activities</li>
                                    <li>Collect or misuse personal data unlawfully</li>
                                    <li>Distribute spam, malware, or harmful content</li>
                                    <li>Attempt to hack, disrupt, or reverse engineer the system</li>
                                    <li>Use the platform for fraudulent purposes</li>
                                </ul>
                                <p className="mt-4 text-text-secondary font-medium">Violation may result in suspension or termination.</p>
                            </section>

                            <section id="data" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">7. Data Protection & Privacy</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">Use of the Services is subject to our Privacy Policy and Data Processing Agreement.</p>
                                <p className="text-text-secondary font-medium leading-relaxed mt-4">Business Users are responsible for:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Obtaining user consent</li>
                                    <li>Providing privacy notices</li>
                                    <li>Ensuring lawful data collection</li>
                                </ul>
                            </section>

                            <section id="ip" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">8. Intellectual Property</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">All rights, title, and interest in the Platform remain with Vemtap.</p>
                                <p className="text-text-secondary font-medium leading-relaxed mt-4">Users are granted a limited, non-exclusive, non-transferable license to use the Services.</p>
                                <p className="text-text-secondary font-medium leading-relaxed mt-4">Users retain ownership of their own data.</p>
                            </section>

                            <section id="availability" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">9. Service Availability</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">We strive for high availability but do not guarantee uninterrupted service.</p>
                                <p className="text-text-secondary font-medium leading-relaxed mt-4">We may:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Perform maintenance</li>
                                    <li>Update features</li>
                                    <li>Modify or discontinue parts of the Services</li>
                                </ul>
                            </section>

                            <section id="fees" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">10. Fees and Payments</h2>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Services may be offered under subscription plans</li>
                                    <li>Fees are non-refundable unless stated otherwise</li>
                                    <li>Failure to pay may result in suspension</li>
                                </ul>
                            </section>

                            <section id="third-party" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">11. Third-Party Services</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">The Platform may integrate with third-party providers. We are not responsible for their services, content, or data practices.</p>
                            </section>

                            <section id="liability" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">12. Limitation of Liability</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">To the maximum extent permitted by law:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Vemtap shall not be liable for indirect, incidental, or consequential damages</li>
                                    <li>Total liability shall not exceed the amount paid by the User in the last 12 months</li>
                                </ul>
                            </section>

                            <section id="indemnity" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">13. Indemnification</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">Users agree to indemnify and hold Vemtap harmless from:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Claims arising from misuse of the platform</li>
                                    <li>Violation of laws or these Terms</li>
                                    <li>Infringement of third-party rights</li>
                                </ul>
                            </section>

                            <section id="termination" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">14. Suspension and Termination</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">We may suspend or terminate access if:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Terms are violated</li>
                                    <li>Illegal or harmful activity is detected</li>
                                    <li>Payment obligations are not met</li>
                                </ul>
                                <p className="mt-4 text-text-secondary font-medium">Users may terminate their account at any time.</p>
                            </section>

                            <section id="retention" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">15. Data Retention After Termination</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">Upon termination:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Data may be deleted or retained as required by law</li>
                                    <li>Users should export data before termination</li>
                                </ul>
                            </section>

                            <section id="confidentiality" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">16. Confidentiality</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">Both parties agree to keep confidential information secure and not disclose it without authorization.</p>
                            </section>

                            <section id="security" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">17. Security Disclaimer</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">While we implement strong security measures, no system is completely secure. Users acknowledge inherent risks of digital platforms.</p>
                            </section>

                            <section id="force-majeure" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">18. Force Majeure</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">We are not liable for failure due to events beyond our control, including:</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Natural disasters</li>
                                    <li>Internet outages</li>
                                    <li>Government actions</li>
                                </ul>
                            </section>

                            <section id="law" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">19. Governing Law & Dispute Resolution</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">These Terms are governed by the laws of the Federal Republic of Nigeria.</p>
                                <p className="text-text-secondary font-medium leading-relaxed mt-4">Disputes shall be resolved through:</p>
                                <ol className="list-decimal pl-5 mt-4 space-y-2 text-text-secondary font-medium">
                                    <li>Negotiation</li>
                                    <li>Mediation</li>
                                    <li>Courts of competent jurisdiction</li>
                                </ol>
                            </section>

                            <section id="changes" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">20. Changes to Terms</h2>
                                <p className="text-text-secondary font-medium leading-relaxed">We may update these Terms at any time. Continued use of the Services constitutes acceptance.</p>
                            </section>

                            <section id="contact" className="scroll-mt-32">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">21. Contact Information</h2>
                                <p className="text-text-secondary font-medium leading-relaxed italic">For inquiries:</p>
                                <p className="text-text-secondary font-medium leading-relaxed mt-4">Email: <a href="mailto:[Insert Email]" className="text-primary hover:underline font-bold">[Insert Email]</a></p>
                                <p className="text-text-secondary font-medium leading-relaxed mt-2">Website: <a href="[Insert Website]" className="text-primary hover:underline font-bold">[Insert Website]</a></p>
                            </section>

                        </div>
                    </article>
                </div>
            </div>

            <Footer />
        </div>
    );
}
