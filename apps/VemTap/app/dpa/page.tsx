import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Data Processing Agreement',
    description: 'Vemtap Data Processing Agreement (DPA) - Information for our business clients.',
};

const sections = [
    { id: 'definitions', title: '1. Definitions' },
    { id: 'scope', title: '2. Scope and Purpose' },
    { id: 'nature', title: '3. Nature and Duration' },
    { id: 'types', title: '4. Types of Personal Data' },
    { id: 'categories', title: '5. Categories of Subjects' },
    { id: 'controller-obs', title: '6. Controller Obligations' },
    { id: 'processor-obs', title: '7. Processor Obligations' },
    { id: 'security', title: '8. Security Measures' },
    { id: 'sub-processors', title: '9. Sub-Processors' },
    { id: 'transfers', title: '10. International Transfers' },
    { id: 'rights', title: '11. Data Subject Rights' },
    { id: 'breach', title: '12. Breach Management' },
    { id: 'retention', title: '13. Retention & Deletion' },
    { id: 'audit', title: '14. Audit Rights' },
    { id: 'confidentiality', title: '15. Confidentiality' },
    { id: 'liability', title: '16. Liability & Indemnity' },
    { id: 'sla', title: '17. Service Levels' },
    { id: 'termination', title: '18. Term & Termination' },
    { id: 'law', title: '19. Governing Law' },
    { id: 'annex-a', title: '20. Annex A' },
    { id: 'annex-b', title: '21. Annex B' },
    { id: 'contact', title: '22. Contact Information' },
];

export default function DPA() {
    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Navbar />
            
            <header className="pt-48 pb-20 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Enterprise Standard</span>
                            <span className="h-px w-8 bg-gray-200"></span>
                            <span className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">DPA v3.0</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-display font-bold text-text-main mb-8 leading-tight">
                            Data Processing <span className="blue-text-gradient">Agreement</span>
                        </h1>
                        <p className="text-text-secondary font-medium italic">Effective Date: [Insert Date]</p>
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
                                <div className="p-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm shadow-gray-200/50 italic leading-relaxed text-lg text-text-main">
                                    "This Data Processing Agreement ("DPA") forms part of the agreement between Vemtap ("Processor") and the business client ("Controller") and governs the processing of Personal Data in connection with Vemtap and QRThrive services. It is designed to meet enterprise-grade standards and comply with the Nigeria Data Protection Act (NDPA) and applicable international data protection frameworks."
                                </div>
                            </section>

                            <section id="definitions" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">01</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-8">1. Definitions</h2>
                                        <div className="space-y-4">
                                            {[
                                                { k: 'Controller', v: 'The entity that determines the purposes and means of processing Personal Data.' },
                                                { k: 'Processor', v: 'Vemtap, which processes Personal Data on behalf of the Controller.' },
                                                { k: 'Personal Data', v: 'Any information relating to an identified or identifiable individual.' },
                                                { k: 'Processing', v: 'Any operation performed on Personal Data.' },
                                                { k: 'Sub-Processor', v: 'Any third party engaged by the Processor to process data.' },
                                                { k: 'Data Subject', v: 'The individual whose Personal Data is processed.' }
                                            ].map((def) => (
                                                <div key={def.k} className="p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-2">
                                                    <span className="text-xs font-black uppercase tracking-widest text-primary">{def.k}</span>
                                                    <span className="text-sm font-bold text-text-secondary italic leading-relaxed">{def.v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section id="scope" className="scroll-mt-32">
                                <div className="flex gap-8">
                                    <div className="hidden sm:flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm">02</div>
                                        <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-transparent mt-4"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-3xl font-display font-bold text-text-main mb-6">2. Scope and Purpose of Processing</h2>
                                        <p className="text-text-secondary font-medium leading-relaxed mb-6">Vemtap shall process Personal Data only for the purpose of providing services, including:</p>
                                        <ul className="grid sm:grid-cols-2 gap-4">
                                            {['QR-based customer interactions', 'Data collection and storage', 'Customer engagement and messaging', 'Analytics and reporting dashboards'].map(s => (
                                                <li key={s} className="p-4 bg-white rounded-xl border border-gray-50 flex items-center gap-3 italic text-sm font-bold text-text-secondary">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div> {s}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="text-text-secondary font-medium leading-relaxed mt-6 italic">Processing shall be carried out strictly in accordance with the Controller’s documented instructions.</p>
                                    </div>
                                </div>
                            </section>

                            <section id="nature" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">3. Nature, Duration, and Context of Processing</h2>
                                <ul className="list-disc pl-5 space-y-4">
                                    <li><strong>Nature:</strong> Collection, storage, organization, retrieval, and analysis of data</li>
                                    <li><strong>Duration:</strong> For the duration of the service agreement unless otherwise required by law</li>
                                    <li><strong>Context:</strong> Digital customer engagement and business intelligence</li>
                                </ul>
                            </section>

                            <section id="types" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">4. Types of Personal Data</h2>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Identification data (name)</li>
                                    <li>Contact data (phone number, email)</li>
                                    <li>Transactional data (orders, service requests)</li>
                                    <li>Interaction data (QR scans, messages)</li>
                                    <li>Technical data (IP address, device information)</li>
                                </ul>
                            </section>

                            <section id="categories" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">5. Categories of Data Subjects</h2>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Customers of the Controller</li>
                                    <li>Prospective customers</li>
                                    <li>Website visitors</li>
                                    <li>End-users interacting via QR codes or forms</li>
                                </ul>
                            </section>

                            <section id="controller-obs" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">6. Obligations of the Controller</h2>
                                <p className="mb-4">The Controller shall:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Ensure lawful basis for processing (consent, contract, etc.)</li>
                                    <li>Provide clear privacy notices to Data Subjects</li>
                                    <li>Ensure accuracy of data provided</li>
                                    <li>Comply with all applicable data protection laws</li>
                                    <li>Issue lawful instructions to the Processor</li>
                                </ul>
                            </section>

                            <section id="processor-obs" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">7. Obligations of the Processor (Vemtap)</h2>
                                <p className="mb-4">Vemtap shall:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Process Personal Data only on documented instructions</li>
                                    <li>Ensure personnel confidentiality obligations</li>
                                    <li>Implement appropriate technical and organizational measures</li>
                                    <li>Maintain records of processing activities</li>
                                    <li>Assist the Controller in compliance obligations</li>
                                    <li>Not use data for its own purposes without authorization</li>
                                </ul>
                            </section>

                            <section id="security" className="scroll-mt-32">
                                <div className="p-10 bg-primary rounded-[3rem] text-white shadow-2xl shadow-primary/20 relative overflow-hidden">
                                    <h2 className="text-3xl font-display font-bold mb-10 relative italic">8. Technical & Organizational Security Measures</h2>
                                    <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6 relative">
                                        {[
                                            'Encryption in transit (TLS/HTTPS)',
                                            'Encryption at rest (AES-256 or equivalent)',
                                            'Role-Based Access Control (RBAC)',
                                            'Multi-Factor Authentication (MFA)',
                                            'Network firewalls and intrusion detection systems',
                                            'Continuous monitoring and logging',
                                            'Regular vulnerability assessments and penetration testing'
                                        ].map(item => (
                                            <div key={item} className="flex items-center gap-4 border-b border-white/10 pb-4">
                                                <div className="w-2 h-2 rounded-full bg-white/40"></div>
                                                <span className="text-sm font-bold tracking-wide italic">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section id="sub-processors" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">9. Sub-Processors</h2>
                                <p className="mb-4">Vemtap may engage Sub-Processors under the following conditions:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Sub-Processors are bound by written agreements with equivalent data protection obligations</li>
                                    <li>Vemtap remains fully liable for Sub-Processor performance</li>
                                    <li>A list of Sub-Processors shall be made available upon request</li>
                                </ul>
                            </section>

                            <section id="transfers" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">10. International Data Transfers</h2>
                                <p className="mb-4">Where data is transferred outside Nigeria:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Adequate safeguards shall be implemented</li>
                                    <li>Transfers shall comply with NDPA requirements</li>
                                    <li>Standard contractual protections shall be applied where necessary</li>
                                </ul>
                            </section>

                            <section id="rights" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">11. Data Subject Rights Assistance</h2>
                                <p className="mb-4">Vemtap shall assist the Controller in responding to Data Subject requests, including:</p>
                                <ul className="grid grid-cols-2 gap-4">
                                    {['Access', 'Rectification', 'Erasure', 'Restriction', 'Data portability', 'Objection'].map(item => (
                                        <li key={item} className="p-4 bg-white rounded-xl border border-gray-100 italic text-sm font-bold text-primary flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div> {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section id="breach" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">12. Data Breach Management</h2>
                                <p className="mb-4">In the event of a Personal Data breach, Vemtap shall:</p>
                                <ol className="list-decimal pl-5 space-y-4">
                                    <li>Notify the Controller within <strong>48 hours</strong> of becoming aware</li>
                                    <li>Provide detailed incident information</li>
                                    <li>Assist in mitigation and remediation</li>
                                    <li>Support regulatory reporting obligations</li>
                                </ol>
                            </section>

                            <section id="retention" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">13. Data Retention and Deletion</h2>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Data shall be retained only as necessary for service delivery</li>
                                    <li>Upon termination, data shall be deleted or returned at the Controller’s request</li>
                                    <li>Legal retention obligations may apply</li>
                                </ul>
                            </section>

                            <section id="audit" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">14. Audit and Inspection Rights</h2>
                                <p className="mb-4">The Controller may:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Request documentation of security measures</li>
                                    <li>Conduct audits (with reasonable notice)</li>
                                </ul>
                                <p className="mt-4 italic">Vemtap shall provide reasonable cooperation, subject to confidentiality and operational constraints.</p>
                            </section>

                            <section id="confidentiality" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">15. Confidentiality</h2>
                                <p>All personnel involved in processing Personal Data are subject to strict confidentiality obligations.</p>
                            </section>

                            <section id="liability" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">16. Liability and Indemnity</h2>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Each party is responsible for its own compliance</li>
                                    <li>Vemtap shall not be liable for unlawful instructions from the Controller</li>
                                    <li>Liability may be limited as defined in the main service agreement</li>
                                </ul>
                            </section>

                            <section id="sla" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">17. Service Levels (Security & Availability)</h2>
                                <p className="mb-4">Vemtap commits to:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>High system availability</li>
                                    <li>Continuous monitoring</li>
                                    <li>Timely response to security incidents</li>
                                </ul>
                            </section>

                            <section id="termination" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">18. Term and Termination</h2>
                                <p>This DPA remains in effect for the duration of data processing activities.</p>
                            </section>

                            <section id="law" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">19. Governing Law</h2>
                                <p>This Agreement shall be governed by the laws of the Federal Republic of Nigeria.</p>
                            </section>

                            <section id="annex-a" className="scroll-mt-32">
                                <div className="p-10 bg-white rounded-[2rem] border-2 border-primary/5">
                                    <h2 className="text-3xl font-display font-bold text-text-main mb-8 underline decoration-primary/20 decoration-4 underline-offset-8">20. Annex A – Processing Details</h2>
                                    <div className="space-y-6 font-medium text-text-secondary italic">
                                        <p><strong>Subject Matter:</strong> Customer engagement and data collection</p>
                                        <p><strong>Duration:</strong> Duration of service agreement</p>
                                        <p><strong>Nature of Processing:</strong> Collection, storage, analysis, communication</p>
                                        <p><strong>Types of Data:</strong> Name, phone number, email, interaction data, technical data</p>
                                        <p><strong>Categories of Data Subjects:</strong> Customers, prospects, visitors</p>
                                    </div>
                                </div>
                            </section>

                            <section id="annex-b" className="scroll-mt-32 font-medium text-text-secondary leading-relaxed">
                                <div className="p-10 bg-white rounded-[2rem] border-2 border-primary/5">
                                    <h2 className="text-3xl font-display font-bold text-text-main mb-8 underline decoration-primary/20 decoration-4 underline-offset-8">21. Annex B – Security Measures Summary</h2>
                                    <ul className="grid sm:grid-cols-2 gap-4">
                                        {['Encryption (TLS, AES-256)', 'RBAC and access controls', 'Monitoring and logging', 'Backup and recovery systems', 'Vulnerability testing'].map(item => (
                                            <li key={item} className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/20"></div> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>

                            <section id="contact" className="scroll-mt-32 text-center pt-20 border-t border-gray-100">
                                <h2 className="text-3xl font-display font-bold text-text-main mb-6">22. Contact Information</h2>
                                <p className="text-text-secondary font-medium italic mb-10 max-w-sm mx-auto uppercase underline">For data protection matters:</p>
                                <div className="inline-block p-1 bg-white rounded-full shadow-xl shadow-gray-200/50">
                                    <a href="mailto:[Insert Email]" className="flex items-center gap-4 px-8 py-4 bg-text-main text-white rounded-full font-bold text-sm hover:bg-primary transition-all">
                                        <span>contact@vemtap.io</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </a>
                                </div>
                                <div className="mt-20">
                                    <p className="text-xs font-black uppercase tracking-[0.4em] text-primary italic">Vemtap – Enterprise-Grade Data Processing Infrastructure</p>
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
