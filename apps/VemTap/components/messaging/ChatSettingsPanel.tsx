'use client';

import React, { useState, useEffect } from 'react';
import { useChatStore } from '@/lib/store/useChatStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    MessageSquare, Moon, HelpCircle, BookOpen, Plus, Trash2, 
    Settings, ArrowLeft, X, Save, History, Bolt, Handshake, 
    SearchCheck, Headset, CreditCard, Tag,
    ChevronRight, Mail, TrendingUp, Edit,
    ShieldCheck, UserRoundSearch, Eye
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ChatSettingsPanel() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'automation';

    const automatedReplies = useChatStore(s => s.automatedReplies);
    const updateAutomatedReplies = useChatStore(s => s.updateAutomatedReplies);
    const templates = useChatStore(s => s.templates);
    const updateTemplate = useChatStore(s => s.updateTemplate);
    const deleteTemplate = useChatStore(s => s.deleteTemplate);
    const addTemplate = useChatStore(s => s.addTemplate);
    const categories = useChatStore(s => s.categories);
    const updateCategory = useChatStore(s => s.updateCategory);
    const addCategory = useChatStore(s => s.addCategory);
    const deleteCategory = useChatStore(s => s.deleteCategory);
    
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const { data: business } = useMyBusiness(isAuthenticated);
    const user = useAuthStore(s => s.user);

    const businessName = business?.name || user?.businessName || 'Vemtap';
    const businessLogo = business?.logoUrl || user?.businessLogo;

    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    const setTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`?${params.toString()}`);
    };

    const handleToggle = (field: 'welcomeEnabled' | 'offHoursEnabled' | 'faqEnabled') => {
        updateAutomatedReplies({ [field]: !automatedReplies[field] });
        toast.success(`${field.replace('Enabled', '')} ${automatedReplies[field] ? 'disabled' : 'enabled'}`);
    };

    const handleNewTemplate = () => {
        const id = `tmpl_${Date.now()}`;
        addTemplate({
            id,
            name: 'New Template',
            content: 'Hi {{Customer Name}}, ...',
            category: 'General',
            placeholders: ['Customer Name'],
            enabled: true,
            lastEditedAt: Date.now(),
        });
        setEditingTemplateId(id);
        toast.success('Template created');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 md:px-10 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/messaging/chat"
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-white">
                        <Bolt size={24} />
                    </div>
                    <div>
                        <h2 className="text-slate-900 text-lg font-bold leading-tight">
                            {activeTab === 'automation' ? 'Automated Replies' : activeTab === 'templates' ? 'Message Templates' : 'Ticket Categories'}
                        </h2>
                        <p className="text-xs text-slate-500">Manage your business communication workflow</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setTab('automation')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'automation' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Automation
                        </button>
                        <button 
                            onClick={() => setTab('templates')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'templates' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Templates
                        </button>
                        <button 
                            onClick={() => setTab('categories')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'categories' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Categories
                        </button>
                    </nav>

                    <button className="flex items-center justify-center p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        <HelpCircle size={20} />
                    </button>
                    <div className="h-10 w-10 rounded-full border-2 border-primary/20 bg-slate-200 overflow-hidden">
                        {businessLogo ? (
                            <img src={businessLogo} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                                {businessName.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
                {activeTab === 'automation' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Setup Progress Bar */}
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Automation Setup Status</p>
                                <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700">75% COMPLETE</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <p className="mt-3 text-sm text-slate-500">3 of 4 triggers configured and active.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {/* Welcome Message */}
                            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                            <Handshake size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Welcome Message</h3>
                                            <p className="text-sm text-slate-500">Automatically greet new customers when they first contact you.</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        enabled={automatedReplies.welcomeEnabled}
                                        onToggle={() => handleToggle('welcomeEnabled')}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50/50">
                                    <label className="block mb-2 text-sm font-medium text-slate-700">Response Text</label>
                                    <textarea 
                                        value={automatedReplies.welcomeMessage}
                                        onChange={e => updateAutomatedReplies({ welcomeMessage: e.target.value })}
                                        className="block w-full px-4 py-3 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-primary focus:border-primary outline-none transition-all"
                                        placeholder="Hi there! Thanks for reaching out..."
                                        rows={3} 
                                    />
                                    <div className="mt-2 flex justify-end">
                                        <span className="text-xs text-slate-400">{automatedReplies.welcomeMessage.length} / 500 characters</span>
                                    </div>
                                </div>
                            </section>

                            {/* Off-hours */}
                            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                            <Moon size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Off-hours Auto-reply</h3>
                                            <p className="text-sm text-slate-500">Send a response when you&apos;re away or outside business hours.</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        enabled={automatedReplies.offHoursEnabled}
                                        onToggle={() => handleToggle('offHoursEnabled')}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-slate-700">Trigger Schedule</label>
                                            <select 
                                                value={automatedReplies.offHoursSchedule}
                                                onChange={e => updateAutomatedReplies({ offHoursSchedule: e.target.value })}
                                                className="block w-full px-4 py-2 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-primary focus:border-primary outline-none"
                                            >
                                                <option>Outside Business Hours</option>
                                                <option>Always On (Away Mode)</option>
                                                <option>Custom Schedule</option>
                                            </select>
                                        </div>
                                    </div>
                                    <label className="block mb-2 text-sm font-medium text-slate-700">Away Message</label>
                                    <textarea 
                                        value={automatedReplies.offHoursMessage}
                                        onChange={e => updateAutomatedReplies({ offHoursMessage: e.target.value })}
                                        className="block w-full px-4 py-3 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-primary focus:border-primary outline-none transition-all"
                                        placeholder="We're currently closed but will get back to you soon."
                                        rows={3} 
                                    />
                                </div>
                            </section>

                            {/* FAQ Keywords */}
                            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <SearchCheck size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">FAQ Keyword Triggers</h3>
                                            <p className="text-sm text-slate-500">Respond to specific keywords like &quot;pricing&quot;, &quot;shipping&quot;, or &quot;hours&quot;.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleToggle('faqEnabled')}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${automatedReplies.faqEnabled ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                        {automatedReplies.faqEnabled ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                                <div className="p-6 bg-slate-50/50 space-y-4">
                                    {automatedReplies.faqKeywords.map((faq, i) => (
                                        <div key={i} className={`p-4 bg-white border border-slate-200 rounded-xl ${!faq.enabled ? 'opacity-60' : ''}`}>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {faq.keywords.map(kw => (
                                                    <span key={kw} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200 flex items-center gap-1">
                                                        {kw} <X size={12} className="cursor-pointer" />
                                                    </span>
                                                ))}
                                                <button className="text-primary font-bold text-xs">+ Add</button>
                                            </div>
                                            <textarea 
                                                value={faq.response}
                                                onChange={e => {
                                                    const newFaqs = [...automatedReplies.faqKeywords];
                                                    newFaqs[i].response = e.target.value;
                                                    updateAutomatedReplies({ faqKeywords: newFaqs });
                                                }}
                                                className="block w-full px-4 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none"
                                                rows={2} 
                                            />
                                            {!faq.enabled && <div className="mt-2 text-[10px] text-primary font-bold uppercase tracking-widest">Configuration Inactive</div>}
                                        </div>
                                    ))}
                                    <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:border-primary/50 hover:text-primary transition-all">
                                        + Add New Keyword Trigger
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Left Column: Template List */}
                        <div className="col-span-12 lg:col-span-4 space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">My Templates</h2>
                                <button 
                                    onClick={handleNewTemplate}
                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                                >
                                    <Plus size={16} /> Create New
                                </button>
                            </div>
                            <div className="space-y-3">
                                {templates.map(tmpl => (
                                    <div 
                                        key={tmpl.id} 
                                        onClick={() => setEditingTemplateId(tmpl.id)}
                                        className={`p-4 bg-white border-2 rounded-xl shadow-sm cursor-pointer group transition-all ${editingTemplateId === tmpl.id ? 'border-primary' : 'border-transparent hover:border-primary/30'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-semibold uppercase tracking-wider ${editingTemplateId === tmpl.id ? 'text-primary' : 'text-slate-400'}`}>
                                                {tmpl.category}
                                            </span>
                                            <button className="text-slate-400 hover:text-slate-600">
                                                <Trash2 size={16} onClick={(e) => { e.stopPropagation(); deleteTemplate(tmpl.id); }} />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-slate-900">{tmpl.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-1 mb-3">{tmpl.content}</p>
                                        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                                            <span className="flex items-center gap-1"><History size={12} /> 2h ago</span>
                                            {tmpl.openRate && <span className="flex items-center gap-1"><TrendingUp size={12} /> {tmpl.openRate}% open</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Editor Interface */}
                        <div className="col-span-12 lg:col-span-8">
                            {editingTemplateId ? (
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                                        <div>
                                            <h2 className="font-bold text-lg text-slate-900">Editing Template</h2>
                                            <p className="text-xs text-slate-500">Last saved today at 10:42 AM</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">Preview</button>
                                            <button 
                                                onClick={() => { setEditingTemplateId(null); toast.success('Changes saved'); }}
                                                className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name</label>
                                                <input 
                                                    type="text" 
                                                    value={templates.find(t => t.id === editingTemplateId)?.name || ''} 
                                                    onChange={e => updateTemplate(editingTemplateId, { name: e.target.value })}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                                                <select 
                                                    value={templates.find(t => t.id === editingTemplateId)?.category || ''}
                                                    onChange={e => updateTemplate(editingTemplateId, { category: e.target.value })}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none"
                                                >
                                                    <option>Transactional</option>
                                                    <option>Marketing</option>
                                                    <option>Support</option>
                                                    <option>General</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                                            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Available Dynamic Placeholders</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {['Customer Name', 'Order ID', 'Order Total', 'Delivery Date', 'Store Name'].map(p => (
                                                    <button key={p} className="px-3 py-1.5 bg-white border border-primary/30 rounded text-xs font-mono font-medium hover:bg-primary hover:text-white transition-all text-primary">
                                                        {`{{${p}}}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                                            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-1 overflow-x-auto">
                                                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors"><Plus size={18} /></button>
                                                <div className="w-px h-6 bg-slate-300 mx-1"></div>
                                                <button className="p-1.5 hover:bg-slate-200 rounded transition-colors" title="Rich text tools coming soon">
                                                    <Edit size={18} />
                                                </button>
                                            </div>
                                            <textarea 
                                                value={templates.find(t => t.id === editingTemplateId)?.content || ''}
                                                onChange={e => updateTemplate(editingTemplateId, { content: e.target.value })}
                                                className="w-full min-h-[300px] p-6 focus:outline-none bg-white text-sm leading-relaxed resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-slate-400 min-h-[500px]">
                                    <BookOpen size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">Select a template to edit</p>
                                    <p className="text-sm">Or create a new one to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Ticket Categories</h1>
                                <p className="text-slate-600 mt-1">Define how incoming requests are classified and routed across your support team.</p>
                            </div>
                            <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all">
                                <Plus size={20} /> New Category
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Active Categories</p>
                                        <p className="text-2xl font-bold">{categories.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 text-primary rounded-lg">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Top Queue</p>
                                        <p className="text-2xl font-bold">Tech Support</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
                                        <Bolt size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Auto-routed</p>
                                        <p className="text-2xl font-bold">84%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categories Table */}
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Category Name</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Route To</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Default Urgency</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Team Access</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {categories.map(cat => (
                                            <tr key={cat.id} className="hover:bg-slate-50 transition-colors group text-sm">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                            <Headset size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="block font-semibold text-slate-900">{cat.name}</span>
                                                            <span className="text-xs text-slate-500">{cat.slug}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{cat.routeTo}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        cat.urgency === 'High' ? 'bg-red-100 text-red-700' :
                                                        cat.urgency === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {cat.urgency}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-2 overflow-hidden">
                                                        {cat.teamAccess.map((user, i) => (
                                                            <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                                {user.charAt(0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-slate-400 hover:text-primary transition-colors">
                                                        <Edit size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Secondary Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900">Queue Management</h3>
                                    <button className="text-primary text-sm font-semibold hover:underline">View All</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="text-slate-400" size={20} />
                                            <div>
                                                <p className="font-medium text-sm">Enterprise Support</p>
                                                <p className="text-xs text-slate-500">Wait time: <span className="text-green-600">2m</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            <span className="text-xs font-medium text-slate-600">Online</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <Mail className="text-slate-400" size={20} />
                                            <div>
                                                <p className="font-medium text-sm">General Ticketing</p>
                                                <p className="text-xs text-slate-500">Active tickets: <span className="text-primary font-medium">142</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                            <span className="text-xs font-medium text-slate-600">Offline</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900">Active Team Roles</h3>
                                    <button className="text-primary text-sm font-semibold hover:underline">Manage Access</button>
                                </div>
                                <div className="space-y-4">
                                    <RoleRow icon={ShieldCheck} name="Super Admin" count="3 team members" />
                                    <RoleRow icon={Headset} name="Tier 2 Support" count="12 team members" />
                                    <RoleRow icon={UserRoundSearch} name="ReadOnly Auditor" count="2 team members" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sticky Footer */}
                <div className="mt-10 mb-20 flex items-center justify-between border-t border-slate-200 pt-8">
                    <div className="flex items-center gap-2 text-slate-500">
                        <History size={16} />
                        <span className="text-xs">Last saved: 2 minutes ago</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
                            Discard Changes
                        </button>
                        <button 
                            onClick={() => toast.success('Automation settings saved!')}
                            className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-primary' : 'bg-slate-200'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}

function RoleRow({ icon: Icon, name, count }: { icon: any; name: string; count: string }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Icon size={20} />
                </div>
                <div>
                    <p className="font-medium text-sm text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{count}</p>
                </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
        </div>
    );
}
