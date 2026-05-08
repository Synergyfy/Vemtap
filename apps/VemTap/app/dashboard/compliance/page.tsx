'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useSearchParams } from 'next/navigation';
import { 
    FileText, 
    Download, 
    History, 
    ShieldCheck, 
    ExternalLink, 
    Scale, 
    Lock, 
    CheckCircle2,
    Eye,
    Globe,
    ArrowRight,
    Zap,
    Trash2,
    Users2,
    Bell,
    Gavel,
    Mail,
    LifeBuoy,
    AlertCircle,
    X,
    Server,
    Monitor,
    Calendar,
    Info
} from 'lucide-react';

const legalAgreements = [
    {
        id: 'terms',
        name: 'Terms of Service',
        status: 'Accepted',
        acceptedDate: 'Jan 31, 2026, 14:22',
        version: 'v1.0',
        icon: FileText,
        color: 'text-blue-500',
        bg: 'bg-blue-50'
    },
    {
        id: 'privacy',
        name: 'Privacy Policy',
        status: 'Accepted',
        acceptedDate: 'Jan 31, 2026, 14:22',
        version: 'v1.0',
        icon: Lock,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50'
    },
    {
        id: 'dpa',
        name: 'Data Processing Agreement (DPA)',
        status: 'Accepted',
        acceptedDate: 'Feb 05, 2026, 09:15',
        version: 'v1.0',
        icon: Scale,
        color: 'text-primary',
        bg: 'bg-primary/5'
    }
];

const agreementHistory = [
    { doc: 'Terms of Service', version: 'v1.0', date: 'Jan 31, 2026', ip: '192.168.1.45', action: 'View', browser: 'Chrome 120.0', os: 'Windows 11' },
    { doc: 'Privacy Policy', version: 'v1.0', date: 'Jan 31, 2026', ip: '192.168.1.45', action: 'View', browser: 'Chrome 120.0', os: 'Windows 11' },
    { doc: 'Data Processing Agreement', version: 'v1.0', date: 'Feb 05, 2026', ip: '102.89.34.12', action: 'View', browser: 'Safari 17.2', os: 'macOS Sonoma' },
];

export default function CompliancePage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as 'legal' | 'privacy';
    const [activeTab, setActiveTab] = useState<'legal' | 'privacy'>('legal');

    useEffect(() => {
        if (tabParam === 'privacy' || tabParam === 'legal') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const [selectedItem, setSelectedItem] = useState<any>(null);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 pb-24 relative">
            <PageHeader
                title="Legal & Compliance"
                description="Manage your legal agreements, data protection settings, and privacy controls in one place."
            />

            {/* Tabs Navigation */}
            <div className="flex bg-gray-100/50 p-1.5 rounded-2xl w-full sm:w-fit">
                <button
                    onClick={() => setActiveTab('legal')}
                    className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'legal'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Scale size={16} />
                        Legal Agreements
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('privacy')}
                    className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'privacy'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-main'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Lock size={16} />
                        Privacy & Data
                    </div>
                </button>
            </div>

            {activeTab === 'legal' ? (
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Compliance Status Banner */}
                    <section className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                <Bell size={24} className="animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight">Compliance Status: Up to Date</h4>
                                <p className="text-xs text-emerald-700 font-medium italic">You have accepted the latest versions of all legal agreements. No action required.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200">
                                Accepted Version History
                            </button>
                        </div>
                    </section>

                    {/* Legal Agreements Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <FileText size={20} />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-text-main">Legal Agreements</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {legalAgreements.map((agreement) => (
                                <div key={agreement.id} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 hover:shadow-md transition-all flex flex-col h-full group">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`w-14 h-14 rounded-2xl ${agreement.bg} flex items-center justify-center`}>
                                            <agreement.icon size={24} className={agreement.color} />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full">
                                            <CheckCircle2 size={12} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{agreement.status}</span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-display font-bold text-text-main mb-2">{agreement.name}</h3>
                                    <div className="flex items-center gap-2 mb-8">
                                        <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/5 rounded-md uppercase">{agreement.version}</span>
                                        <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                        <span className="text-[10px] text-text-secondary font-bold italic tracking-tight uppercase">Accepted: {agreement.acceptedDate}</span>
                                    </div>

                                    <div className="mt-auto space-y-3">
                                        <a 
                                            href={`/${agreement.id === 'terms' ? 'terms' : agreement.id === 'privacy' ? 'privacy' : 'dpa'}`} 
                                            target="_blank"
                                            className="w-full py-3 bg-gray-50 border border-gray-100 rounded-xl text-text-main font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                                        >
                                            <Eye size={14} />
                                            View Document
                                        </a>
                                        <button className="w-full py-3 bg-white border border-gray-200 rounded-xl text-text-secondary font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:border-primary/20 hover:text-primary transition-all">
                                            <Download size={14} />
                                            Download PDF
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Agreement History Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <History size={20} />
                            </div>
                            <h2 className="text-2xl font-display font-bold text-text-main">Agreement History</h2>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Document</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Version</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Accepted On</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">IP Address</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {agreementHistory.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                                                        <span className="text-sm font-bold text-text-main">{item.doc}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-text-secondary uppercase">{item.version}</span>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-medium text-text-secondary italic">{item.date}</td>
                                                <td className="px-8 py-6">
                                                    <span className="font-mono text-[11px] text-gray-400 font-bold">{item.ip}</span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button 
                                                        onClick={() => setSelectedItem(item)}
                                                        className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-primary transition-all"
                                                    >
                                                        <ArrowRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 bg-gray-50/30 border-t border-gray-100 text-center">
                                <p className="text-[10px] font-bold text-text-secondary italic uppercase tracking-widest">
                                    Legal Protection • Audit Trail • Enterprise Trust
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Data Protection Summary */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                                    <ShieldCheck size={20} />
                                </div>
                                <h2 className="text-2xl font-display font-bold text-text-main">Data Protection Summary</h2>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm p-10 space-y-10 relative overflow-hidden h-full">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50"></div>
                                
                                <div className="grid sm:grid-cols-2 gap-8 relative">
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Your Role</h4>
                                        <p className="text-lg font-display font-bold text-text-main italic">Data Controller</p>
                                    </div>
                                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Vemtap Role</h4>
                                        <p className="text-lg font-display font-bold text-primary italic">Data Processor</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-text-main mb-6 flex items-center gap-2 italic">
                                        <Zap size={14} className="text-yellow-500" />
                                        What we do for you
                                    </h4>
                                    <div className="space-y-4">
                                        {[
                                            'Process customer data on your behalf',
                                            'Secure and store information using AES-256',
                                            'Provide actionable analytics and insights'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                                <span className="text-sm font-bold text-text-secondary italic">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Permissions & Data Control */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                                    <Zap size={20} />
                                </div>
                                <h2 className="text-2xl font-display font-bold text-text-main">Permissions & Control</h2>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm p-10 h-full flex flex-col justify-between">
                                <div className="grid sm:grid-cols-1 gap-4 mb-8">
                                    {[
                                        { title: 'Export Customer Data', icon: Download, desc: 'Generate a CSV/JSON of all visitor records.', color: 'text-primary' },
                                        { title: 'Delete Customer Data', icon: Trash2, desc: 'Permanently remove selected records.', color: 'text-red-500' },
                                        { title: 'Staff Access Permissions', icon: Users2, desc: 'Manage who can view legal documents.', color: 'text-blue-500' }
                                    ].map((item, i) => (
                                        <div key={i} className="group p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform">
                                                    <item.icon size={18} className={item.color} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-main tracking-tight">{item.title}</p>
                                                    <p className="text-[10px] text-text-secondary font-medium italic mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>
                                            <button className="p-2 text-gray-300 hover:text-primary transition-colors">
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-text-secondary font-bold italic text-center uppercase tracking-widest border-t border-gray-100 pt-6">
                                    Granular control over your business data
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Data Retention */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-sm">
                                <div className="px-10 py-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100">
                                            <History size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-display font-bold text-text-main italic">Data Retention Policy</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary italic">Auto-Cleanup Rules</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Automatically Delete Customer Data After</label>
                                        <select className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-6 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none cursor-pointer">
                                            <option>Never (Retain indefinitely)</option>
                                            <option>6 Months of inactivity</option>
                                            <option>1 Year of inactivity</option>
                                            <option>2 Years of inactivity</option>
                                        </select>
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                                                Note: Loyalty members are excluded from automatic deletion to preserve their points and status even after long periods of inactivity.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Consent Management */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-sm">
                                <div className="px-10 py-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-gray-100">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-display font-bold text-text-main italic">Visitor Consent</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary italic">Compliance Controls</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 space-y-10">
                                    <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <div>
                                            <h4 className="font-black text-text-main text-xs uppercase tracking-tight">Mandatory Opt-in</h4>
                                            <p className="text-[10px] text-text-secondary mt-1 font-medium italic">Visitors must explicitly agree to terms before their tap is recorded</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:inset-s-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                        </label>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Custom Privacy Footer</label>
                                        <textarea 
                                            placeholder="e.g. By tapping, you agree to our Terms of Service and Privacy Policy..." 
                                            rows={4} 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-6 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none" 
                                        />
                                        <p className="text-[10px] text-text-secondary font-medium italic px-1 italic text-center uppercase tracking-widest">
                                            This message appears at the bottom of your digital check-in screens
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Actions */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-[2rem] border border-gray-200 p-8 shadow-sm space-y-6">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-main italic border-b border-gray-100 pb-4">Actions</h4>
                                <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                                    Save Changes
                                </button>
                                <button className="w-full py-4 bg-gray-50 text-text-secondary rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-100 transition-all">
                                    Reset to Default
                                </button>
                            </div>

                            <div className="bg-red-50 border border-red-100 rounded-[2rem] p-8 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 text-red-600">
                                    <AlertCircle size={20} />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] italic">Danger Zone</h4>
                                </div>
                                <p className="text-[11px] text-red-800 font-bold leading-relaxed italic">
                                    These actions are permanent and cannot be undone. Always export your data before proceeding with bulk deletions.
                                </p>
                                <div className="space-y-3">
                                    <button className="w-full py-3.5 bg-white border border-red-200 text-red-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all">
                                        Export All Customer Data
                                    </button>
                                    <button className="w-full py-3.5 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200">
                                        Wipe Customer Records
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Common Support Section */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-text-main font-bold">
                            <Gavel size={20} />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-text-main">Enterprise Requests</h2>
                    </div>
                    
                    <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm p-10 grid sm:grid-cols-3 gap-6">
                        {[
                            { title: 'Request Signed DPA', desc: 'Get a copy signed by Vemtap legal.', action: 'Request' },
                            { title: 'Compliance Team', desc: 'Direct access to our security experts.', action: 'Contact' },
                            { title: 'Custom Agreement', desc: 'For specific enterprise requirements.', action: 'Start' }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col h-full">
                                <h4 className="text-sm font-black text-text-main uppercase tracking-tight mb-2">{item.title}</h4>
                                <p className="text-[10px] text-text-secondary font-medium italic leading-relaxed mb-6">{item.desc}</p>
                                <button className="mt-auto py-2.5 px-4 bg-gray-50 hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary transition-all">
                                    {item.action}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                            <Mail size={20} />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-text-main">Contact & Support</h2>
                    </div>

                    <div className="bg-gray-100 rounded-[2.5rem] p-10 text-text-main relative overflow-hidden shadow-sm flex flex-col justify-between h-full border border-gray-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        
                        <div className="space-y-8 relative">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 border border-gray-200 shadow-sm">
                                    <ShieldCheck size={18} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1 italic">Data Protection</p>
                                    <a href="mailto:support@vemtap.com" className="text-sm font-bold text-text-main hover:text-primary transition-colors">support@vemtap.com</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 border border-gray-200 shadow-sm">
                                    <LifeBuoy size={18} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1 italic">Legal Support</p>
                                    <a href="mailto:support@vemtap.com" className="text-sm font-bold text-text-main hover:text-primary transition-colors">support@vemtap.com</a>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200 relative">
                            <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                <ExternalLink size={14} />
                                Visit Support Center
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agreement Preview Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-text-main/40 backdrop-blur-md" onClick={() => setSelectedItem(null)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-display font-bold text-text-main italic">Acceptance Record</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Audit Verification</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-3 bg-white hover:bg-gray-100 rounded-2xl text-text-secondary transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Document</p>
                                    <p className="text-sm font-bold text-text-main italic">{selectedItem.doc}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Version</p>
                                    <span className="inline-block px-3 py-1 bg-primary/5 text-primary text-xs font-black rounded-lg uppercase tracking-widest">{selectedItem.version}</span>
                                </div>
                            </div>

                            <div className="space-y-6 bg-gray-50 rounded-3xl p-8 border border-gray-100">
                                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-orange-500" />
                                        <span className="text-xs font-bold text-text-secondary uppercase tracking-tight">Accepted On</span>
                                    </div>
                                    <span className="text-sm font-black text-text-main italic">{selectedItem.date}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                    <div className="flex items-center gap-3">
                                        <Server size={16} className="text-blue-500" />
                                        <span className="text-xs font-bold text-text-secondary uppercase tracking-tight">IP Address</span>
                                    </div>
                                    <span className="text-sm font-mono font-black text-text-main">{selectedItem.ip}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Monitor size={16} className="text-emerald-500" />
                                        <span className="text-xs font-bold text-text-secondary uppercase tracking-tight">Client Device</span>
                                    </div>
                                    <span className="text-sm font-bold text-text-main italic">{selectedItem.os} / {selectedItem.browser}</span>
                                </div>
                            </div>

                            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-emerald-900 uppercase tracking-tight">Legally Binding</p>
                                    <p className="text-[10px] text-emerald-700 font-medium italic leading-relaxed mt-1">This signature represents a binding agreement. The timestamp and IP verification ensure non-repudiation for audit compliance.</p>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-text-main text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl shadow-gray-200">
                                Download Acceptance Certificate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Tag */}
            <div className="mt-24 pt-10 border-t border-gray-100 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-main italic">Vemtap Infrastructure</span>
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Building Trust Through Transparency & Compliance</p>
            </div>
        </div>
    );
}
