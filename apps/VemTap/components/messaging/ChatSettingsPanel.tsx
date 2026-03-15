'use client';

import React, { useState } from 'react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    Moon, HelpCircle, BookOpen, Plus, Trash2, 
    Settings, ArrowLeft, X, Save, History, Bolt, Handshake, 
    SearchCheck, Headset, TrendingUp, Edit,
    ShieldCheck, UserRoundSearch, ChevronRight, Mail
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
    useChatAutomation, 
    useUpdateChatAutomation,
    useAddFaqKeyword,
    useUpdateFaqKeyword,
    useDeleteFaqKeyword,
    useChatTemplates,
    useCreateTemplate,
    useUpdateTemplate,
    useDeleteTemplate,
    useChatCategories,
    useCreateChatCategory,
    useUpdateChatCategory,
    useDeleteChatCategory
} from '@/hooks/useMessaging';

export default function ChatSettingsPanel() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'automation';
    
    const user = useAuthStore(s => s.user);
    const branchId = searchParams.get('branchId') || user?.branchId;

    // Queries
    const { data: automation = {} as any, isLoading: autoLoading } = useChatAutomation(branchId);
    const { data: templates = [], isLoading: templatesLoading } = useChatTemplates(branchId);
    const { data: categories = [], isLoading: categoriesLoading } = useChatCategories(branchId);

    // Mutations
    const updateAuto = useUpdateChatAutomation(branchId);
    const addFaq = useAddFaqKeyword(branchId);
    const updateFaq = useUpdateFaqKeyword(branchId);
    const deleteFaq = useDeleteFaqKeyword(branchId);
    
    const createTmpl = useCreateTemplate(); // Created template will use its own branchId in DTO
    const updateTmpl = useUpdateTemplate();
    const deleteTmpl = useDeleteTemplate();
    
    const createCat = useCreateChatCategory(branchId);
    const updateCat = useUpdateChatCategory(branchId);
    const deleteCat = useDeleteChatCategory(branchId);
    
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const { data: business } = useMyBusiness(isAuthenticated);

    const businessName = business?.name || user?.businessName || 'Vemtap';
    const businessLogo = business?.logoUrl || user?.businessLogo;

    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    const setTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`?${params.toString()}`);
    };

    const handleToggle = (field: string, value: boolean) => {
        updateAuto.mutate({ [field]: !value });
        toast.success(`Setting updated`);
    };

    const handleNewTemplate = () => {
        createTmpl.mutate({
            name: 'New Template',
            content: 'Hi {FirstName}, ...',
            category: 'General',
            channel: 'IN_HOUSE',
            branchId,
        }, {
            onSuccess: (data: any) => {
                setEditingTemplateId(data.id);
                toast.success('Template created');
            }
        });
    };

    const handleNewCategory = () => {
        createCat.mutate({
            name: 'New Category',
            routeTo: 'Default Queue',
            urgency: 'Medium',
            branchId,
        });
        toast.success('Category created');
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
                        {['automation', 'templates', 'categories'].map(t => (
                            <button 
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === t ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </nav>

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
                {(autoLoading || templatesLoading || categoriesLoading) && (
                    <div className="flex justify-center p-12">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                )}

                {activeTab === 'automation' && !autoLoading && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                        enabled={automation.welcomeEnabled}
                                        onToggle={() => handleToggle('welcomeEnabled', automation.welcomeEnabled)}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50/50">
                                    <label className="block mb-2 text-sm font-medium text-slate-700">Response Text</label>
                                    <textarea 
                                        defaultValue={automation.welcomeMessage}
                                        onBlur={e => updateAuto.mutate({ welcomeMessage: e.target.value })}
                                        className="block w-full px-4 py-3 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-primary focus:border-primary outline-none transition-all"
                                        placeholder="Hi there! Thanks for reaching out..."
                                        rows={3} 
                                    />
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
                                        enabled={automation.offHoursEnabled}
                                        onToggle={() => handleToggle('offHoursEnabled', automation.offHoursEnabled)}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-slate-700">Trigger Schedule</label>
                                            <select 
                                                value={automation.offHoursSchedule}
                                                onChange={e => updateAuto.mutate({ offHoursSchedule: e.target.value })}
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
                                        defaultValue={automation.offHoursMessage}
                                        onBlur={e => updateAuto.mutate({ offHoursMessage: e.target.value })}
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
                                </div>
                                <div className="p-6 bg-slate-50/50 space-y-4">
                                    {(automation.faqKeywords || []).map((faq: any, i: number) => (
                                        <div key={faq.id} className={`p-4 bg-white border border-slate-200 rounded-xl ${!faq.enabled ? 'opacity-60' : ''}`}>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {faq.keywords.map((kw: string) => (
                                                    <span key={kw} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200 flex items-center gap-1">
                                                        {kw}
                                                    </span>
                                                ))}
                                                <button onClick={() => deleteFaq.mutate(faq.id)} className="text-red-500 p-1 hover:bg-red-50 rounded ml-auto">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <textarea 
                                                defaultValue={faq.response}
                                                onBlur={e => updateFaq.mutate({ id: faq.id, data: { response: e.target.value } })}
                                                className="block w-full px-4 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none"
                                                rows={2} 
                                            />
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => addFaq.mutate({ keywords: ['new-keyword'], response: 'New auto response' })}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:border-primary/50 hover:text-primary transition-all"
                                    >
                                        + Add New Keyword Trigger
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === 'templates' && !templatesLoading && (
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
                                {(templates as any[]).map(tmpl => (
                                    <div 
                                        key={tmpl.id} 
                                        onClick={() => setEditingTemplateId(tmpl.id)}
                                        className={`p-4 bg-white border-2 rounded-xl shadow-sm cursor-pointer group transition-all ${editingTemplateId === tmpl.id ? 'border-primary' : 'border-transparent hover:border-primary/30'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-semibold uppercase tracking-wider ${editingTemplateId === tmpl.id ? 'text-primary' : 'text-slate-400'}`}>
                                                {tmpl.category}
                                            </span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteTmpl.mutate(tmpl.id); }}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-slate-900">{tmpl.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-1 mb-3">{tmpl.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Editor */}
                        <div className="col-span-12 lg:col-span-8">
                            {editingTemplateId ? (
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name</label>
                                                <input 
                                                    type="text" 
                                                    defaultValue={(templates as any[]).find(t => t.id === editingTemplateId)?.name || ''} 
                                                    onBlur={e => updateTmpl.mutate({ id: editingTemplateId, data: { name: e.target.value } })}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none" 
                                                />
                                            </div>
                                        </div>
                                        <textarea 
                                            defaultValue={(templates as any[]).find(t => t.id === editingTemplateId)?.content || ''}
                                            onBlur={e => updateTmpl.mutate({ id: editingTemplateId, data: { content: e.target.value } })}
                                            className="w-full min-h-[300px] p-6 focus:outline-none bg-white text-sm leading-relaxed border rounded-xl"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-slate-400 min-h-[500px]">
                                    <BookOpen size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">Select a template to edit</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'categories' && !categoriesLoading && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end">
                            <h1 className="text-3xl font-bold text-slate-900">Ticket Categories</h1>
                            <button 
                                onClick={handleNewCategory}
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all"
                            >
                                <Plus size={20} /> New Category
                            </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Category Name</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Route To</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Urgency</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {(categories as any[]).map(cat => (
                                        <tr key={cat.id} className="hover:bg-slate-50 transition-colors group text-sm">
                                            <td className="px-6 py-4">
                                                <input 
                                                    defaultValue={cat.name} 
                                                    className="bg-transparent border-none p-0 font-semibold focus:ring-0" 
                                                    onBlur={e => updateCat.mutate({ id: cat.id, data: { name: e.target.value } })}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <input 
                                                    defaultValue={cat.routeTo} 
                                                    className="bg-transparent border-none p-0 focus:ring-0" 
                                                    onBlur={e => updateCat.mutate({ id: cat.id, data: { routeTo: e.target.value } })}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    defaultValue={cat.urgency}
                                                    onChange={e => updateCat.mutate({ id: cat.id, data: { urgency: e.target.value } })}
                                                    className="bg-transparent border-none p-0 focus:ring-0 text-xs font-bold"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => deleteCat.mutate(cat.id)} className="text-slate-400 hover:text-red-500">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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
