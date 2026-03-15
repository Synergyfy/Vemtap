'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    Moon, BookOpen, Plus, Trash2, 
    Bolt, Handshake, 
    SearchCheck, ArrowLeft, X, Save, AlertTriangle, FileText,
    UserCircle, Building2, Link as LinkIcon, Star, Coins, Calendar
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
import { useActiveBranch } from '@/hooks/useActiveBranch';

const TEMPLATE_CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];

const PLACEHOLDERS = [
    { label: 'First Name', tag: '{FirstName}', icon: <UserCircle size={12} /> },
    { label: 'Full Name', tag: '{Name}', icon: <UserCircle size={12} /> },
    { label: 'Points', tag: '{Points}', icon: <Coins size={12} /> },
    { label: 'Business Name', tag: '{BusinessName}', icon: <Building2 size={12} /> },
    { label: 'Branch Name', tag: '{BranchName}', icon: <Building2 size={12} /> },
    { label: 'Website', tag: '{Website}', icon: <LinkIcon size={12} /> },
    { label: 'Review Link', tag: '{ReviewLink}', icon: <Star size={12} /> },
];

export default function ChatSettingsPanel() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'automation';
    
    const user = useAuthStore(s => s.user);
    const { activeBranchId } = useActiveBranch();
    const branchId = searchParams.get('branchId') || activeBranchId;

    // Queries
    const { data: automation = {} as any, isLoading: autoLoading } = useChatAutomation(branchId || undefined);
    const { data: templates = [], isLoading: templatesLoading } = useChatTemplates(branchId || undefined);
    const { data: categories = [], isLoading: categoriesLoading } = useChatCategories(branchId || undefined);

    // Mutations - Split for individual loading states
    const updateWelcome = useUpdateChatAutomation(branchId || undefined);
    const updateOffHours = useUpdateChatAutomation(branchId || undefined);
    
    const addFaq = useAddFaqKeyword(branchId || undefined);
    const updateFaq = useUpdateFaqKeyword(branchId || undefined);
    const deleteFaq = useDeleteFaqKeyword(branchId || undefined);
    
    const createTmpl = useCreateTemplate();
    const updateTmpl = useUpdateTemplate();
    const deleteTmpl = useDeleteTemplate();
    
    const createCat = useCreateChatCategory(branchId || undefined);
    const updateCat = useUpdateChatCategory(branchId || undefined);
    const deleteCat = useDeleteChatCategory(branchId || undefined);
    
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const { data: business } = useMyBusiness(isAuthenticated);

    const businessName = business?.name || user?.businessName || 'Vemtap';
    const businessLogo = business?.logoUrl || user?.businessLogo;

    // Local UI State
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    
    const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<any | null>(null);
    
    const [newCategoryData, setNewCategoryData] = useState({ name: '', routeTo: '', urgency: 'Medium' });
    const [newTemplateData, setNewTemplateData] = useState({ name: '', category: 'MARKETING', content: '' });

    // Local Automation state for manual submission
    const [localAuto, setLocalAuto] = useState<any>({});

    useEffect(() => {
        if (automation && Object.keys(automation).length > 0) {
            setLocalAuto(automation);
        }
    }, [automation]);

    const modalTextareaRef = useRef<HTMLTextAreaElement>(null);
    const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
    const welcomeTextareaRef = useRef<HTMLTextAreaElement>(null);
    const offHoursTextareaRef = useRef<HTMLTextAreaElement>(null);

    const setTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`?${params.toString()}`);
    };

    const handleSaveAuto = (section: 'welcome' | 'offhours') => {
        if (!branchId) {
            toast.error('Please select a branch first');
            return;
        }

        const data: any = {};
        if (section === 'welcome') {
            if (localAuto.welcomeEnabled && !localAuto.welcomeMessage?.trim()) {
                toast.error('Welcome message content is required when enabled');
                return;
            }
            data.welcomeEnabled = localAuto.welcomeEnabled;
            data.welcomeMessage = localAuto.welcomeMessage;
            updateWelcome.mutate(data, { onSuccess: () => toast.success('Welcome settings saved') });
        } else {
            if (localAuto.offHoursEnabled && !localAuto.offHoursMessage?.trim()) {
                toast.error('Off-hours message content is required when enabled');
                return;
            }
            data.offHoursEnabled = localAuto.offHoursEnabled;
            data.offHoursMessage = localAuto.offHoursMessage;
            data.offHoursSchedule = localAuto.offHoursSchedule;
            updateOffHours.mutate(data, { onSuccess: () => toast.success('Off-hours settings saved') });
        }
    };

    const insertPlaceholder = (tag: string, type: 'modal' | 'editor' | 'welcome' | 'offhours') => {
        let ref;
        if (type === 'modal') ref = modalTextareaRef;
        else if (type === 'editor') ref = editorTextareaRef;
        else if (type === 'welcome') ref = welcomeTextareaRef;
        else ref = offHoursTextareaRef;

        if (!ref.current) return;

        const start = ref.current.selectionStart;
        const end = ref.current.selectionEnd;
        const text = ref.current.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const newValue = before + tag + after;

        if (type === 'modal') {
            setNewTemplateData(prev => ({ ...prev, content: newValue }));
        } else if (type === 'welcome') {
            setLocalAuto((prev: any) => ({ ...prev, welcomeMessage: newValue }));
        } else if (type === 'offhours') {
            setLocalAuto((prev: any) => ({ ...prev, offHoursMessage: newValue }));
        } else if (editingTemplateId) {
            ref.current.value = newValue;
            updateTmpl.mutate({ id: editingTemplateId, data: { content: newValue } });
        }

        setTimeout(() => {
            if (ref.current) {
                ref.current.focus();
                ref.current.selectionStart = ref.current.selectionEnd = start + tag.length;
            }
        }, 0);
    };

    const handleCreateTemplate = () => {
        if (!newTemplateData.name.trim() || !newTemplateData.content.trim()) {
            toast.error('Name and Content are required');
            return;
        }
        createTmpl.mutate({
            ...newTemplateData,
            channel: 'IN_HOUSE',
            branchId,
        }, {
            onSuccess: (data: any) => {
                setIsTemplateModalOpen(false);
                setNewTemplateData({ name: '', category: 'MARKETING', content: '' });
                setEditingTemplateId(data.id);
                toast.success('Template created');
            }
        });
    };

    const handleDeleteTemplate = () => {
        if (!templateToDelete) return;
        deleteTmpl.mutate(templateToDelete.id, {
            onSuccess: () => {
                if (editingTemplateId === templateToDelete.id) setEditingTemplateId(null);
                setTemplateToDelete(null);
                toast.success('Template deleted');
            }
        });
    };

    const handleCreateCategory = () => {
        if (!newCategoryData.name.trim()) {
            toast.error('Category name is required');
            return;
        }
        createCat.mutate({
            ...newCategoryData,
            branchId,
        }, {
            onSuccess: () => {
                setIsCategoryModalOpen(false);
                setNewCategoryData({ name: '', routeTo: '', urgency: 'Medium' });
                toast.success('Category created');
            }
        });
    };

    const handleDeleteCategory = () => {
        if (!categoryToDelete) return;
        deleteCat.mutate(categoryToDelete.id, {
            onSuccess: () => {
                setCategoryToDelete(null);
                toast.success('Category deleted');
            }
        });
    };

    if (!branchId && user?.role !== 'customer') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
                    <div className="size-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bolt size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Select a Branch</h2>
                    <p className="text-slate-500 mb-6">Please select a branch from the sidebar or dashboard to manage chat settings.</p>
                    <Link href="/dashboard" className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            {/* Modals - Template Creation */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Create Message Template</h3>
                            <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name</label>
                                <input 
                                    type="text"
                                    value={newTemplateData.name}
                                    onChange={e => setNewTemplateData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Welcome Message"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                                <select 
                                    value={newTemplateData.category}
                                    onChange={e => setNewTemplateData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                >
                                    {TEMPLATE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-semibold text-slate-700">Content</label>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Smart Placeholders</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {PLACEHOLDERS.map(p => (
                                        <button 
                                            key={p.tag}
                                            onClick={() => insertPlaceholder(p.tag, 'modal')}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-primary hover:text-primary transition-all shadow-sm"
                                        >
                                            {p.icon}
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <textarea 
                                    ref={modalTextareaRef}
                                    value={newTemplateData.content}
                                    onChange={e => setNewTemplateData(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Hi {FirstName}, how can we help you?"
                                    rows={4}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button 
                                onClick={() => setIsTemplateModalOpen(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateTemplate}
                                disabled={createTmpl.isPending}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {createTmpl.isPending ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText size={18} />}
                                Create Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Delete Confirmation */}
            {templateToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-center p-8">
                        <div className="size-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Template?</h3>
                        <p className="text-slate-500 mb-8 text-sm">Are you sure you want to delete <b>{templateToDelete.name}</b>? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setTemplateToDelete(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                            >
                                No, Keep it
                            </button>
                            <button 
                                onClick={handleDeleteTemplate}
                                disabled={deleteTmpl.isPending}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteTmpl.isPending ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={18} />}
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Creation Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Create New Category</h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category Name</label>
                                <input 
                                    type="text"
                                    value={newCategoryData.name}
                                    onChange={e => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Technical Support"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Route To (Team/Queue)</label>
                                <input 
                                    type="text"
                                    value={newCategoryData.routeTo}
                                    onChange={e => setNewCategoryData(prev => ({ ...prev, routeTo: e.target.value }))}
                                    placeholder="e.g. Engineering Team"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Urgency Level</label>
                                <select 
                                    value={newCategoryData.urgency}
                                    onChange={e => setNewCategoryData(prev => ({ ...prev, urgency: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button 
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateCategory}
                                disabled={createCat.isPending}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {createCat.isPending ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                                Create Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Delete Confirmation */}
            {categoryToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-center p-8">
                        <div className="size-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Category?</h3>
                        <p className="text-slate-500 mb-8 text-sm">Are you sure you want to delete <b>{categoryToDelete.name}</b>? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setCategoryToDelete(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                            >
                                No, Keep it
                            </button>
                            <button 
                                onClick={handleDeleteCategory}
                                disabled={deleteCat.isPending}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteCat.isPending ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={18} />}
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    <div className="flex flex-col items-center justify-center p-24 animate-pulse">
                         <div className="size-16 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
                         <p className="text-slate-400 font-medium">Synchronizing settings...</p>
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
                                        enabled={localAuto.welcomeEnabled}
                                        onToggle={() => setLocalAuto((prev: any) => ({ ...prev, welcomeEnabled: !prev.welcomeEnabled }))}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50/50">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-sm font-medium text-slate-700">Response Text</label>
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Smart Tags</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {PLACEHOLDERS.map(p => (
                                                <button 
                                                    key={p.tag}
                                                    onClick={() => insertPlaceholder(p.tag, 'welcome')}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-primary hover:text-primary transition-all shadow-sm"
                                                >
                                                    {p.icon}
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            ref={welcomeTextareaRef}
                                            value={localAuto.welcomeMessage || ''}
                                            onChange={e => setLocalAuto((prev: any) => ({ ...prev, welcomeMessage: e.target.value }))}
                                            className="block w-full px-4 py-3 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50"
                                            placeholder="Hi there! Thanks for reaching out..."
                                            rows={3} 
                                        />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button 
                                            onClick={() => handleSaveAuto('welcome')}
                                            disabled={updateWelcome.isPending}
                                            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark shadow-md shadow-primary/10 transition-all disabled:opacity-50"
                                        >
                                            {updateWelcome.isPending ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                            Save Changes
                                        </button>
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
                                        enabled={localAuto.offHoursEnabled}
                                        onToggle={() => setLocalAuto((prev: any) => ({ ...prev, offHoursEnabled: !prev.offHoursEnabled }))}
                                    />
                                </div>
                                <div className="p-6 bg-slate-50/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-slate-700">Trigger Schedule</label>
                                            <select 
                                                value={localAuto.offHoursSchedule || 'Outside Business Hours'}
                                                onChange={e => setLocalAuto((prev: any) => ({ ...prev, offHoursSchedule: e.target.value }))}
                                                className="block w-full px-4 py-2 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-primary focus:border-primary outline-none disabled:opacity-50"
                                            >
                                                <option>Outside Business Hours</option>
                                                <option>Always On (Away Mode)</option>
                                                <option>Custom Schedule</option>
                                            </select>
                                        </div>
                                        {localAuto.offHoursSchedule === 'Custom Schedule' && (
                                            <div className="animate-in slide-in-from-left-2 duration-200">
                                                <label className="block mb-2 text-sm font-medium text-slate-700 flex items-center gap-2">
                                                    <Calendar size={14} /> Specify Schedule
                                                </label>
                                                <input 
                                                    type="text"
                                                    value={localAuto.offHoursCustomSchedule || ''}
                                                    onChange={e => setLocalAuto((prev: any) => ({ ...prev, offHoursCustomSchedule: e.target.value }))}
                                                    placeholder="e.g. Mon-Fri, 9pm-8am"
                                                    className="block w-full px-4 py-2 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-primary focus:border-primary outline-none transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-sm font-medium text-slate-700">Away Message</label>
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Smart Tags</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {PLACEHOLDERS.map(p => (
                                                <button 
                                                    key={p.tag}
                                                    onClick={() => insertPlaceholder(p.tag, 'offhours')}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-primary hover:text-primary transition-all shadow-sm"
                                                >
                                                    {p.icon}
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea 
                                            ref={offHoursTextareaRef}
                                            value={localAuto.offHoursMessage || ''}
                                            onChange={e => setLocalAuto((prev: any) => ({ ...prev, offHoursMessage: e.target.value }))}
                                            className="block w-full px-4 py-3 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50"
                                            placeholder="We're currently closed but will get back to you soon."
                                            rows={3} 
                                        />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button 
                                            onClick={() => handleSaveAuto('offhours')}
                                            disabled={updateOffHours.isPending}
                                            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark shadow-md shadow-primary/10 transition-all disabled:opacity-50"
                                        >
                                            {updateOffHours.isPending ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                            Save Changes
                                        </button>
                                    </div>
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
                                        <div key={faq.id} className={`p-4 bg-white border border-slate-200 rounded-xl ${!faq.enabled ? 'opacity-60' : ''} transition-all`}>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {faq.keywords.map((kw: string) => (
                                                    <span key={kw} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200 flex items-center gap-1">
                                                        {kw}
                                                    </span>
                                                ))}
                                                <button 
                                                    onClick={() => deleteFaq.mutate(faq.id)} 
                                                    disabled={deleteFaq.isPending}
                                                    className="text-red-500 p-1 hover:bg-red-50 rounded ml-auto transition-colors disabled:opacity-30"
                                                >
                                                    {deleteFaq.isPending ? <div className="size-3 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" /> : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                            <textarea 
                                                defaultValue={faq.response}
                                                onBlur={e => {
                                                    if (e.target.value.trim()) {
                                                        updateFaq.mutate({ id: faq.id, data: { response: e.target.value } });
                                                    } else {
                                                        toast.error('Response cannot be empty');
                                                        e.target.value = faq.response;
                                                    }
                                                }}
                                                disabled={updateFaq.isPending}
                                                className="block w-full px-4 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50"
                                                rows={2} 
                                            />
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => addFaq.mutate({ keywords: ['new-keyword'], response: 'New auto response' })}
                                        disabled={addFaq.isPending}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {addFaq.isPending ? <div className="size-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin" /> : '+ Add New Keyword Trigger'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === 'templates' && !templatesLoading && (
                    <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="col-span-12 lg:col-span-4 space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">My Templates</h2>
                                <button 
                                    onClick={() => setIsTemplateModalOpen(true)}
                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
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
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${editingTemplateId === tmpl.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                {tmpl.category}
                                            </span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setTemplateToDelete(tmpl); }}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-slate-900 mt-2">{tmpl.name}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1 mb-1">{tmpl.content}</p>
                                    </div>
                                ))}
                                {(templates as any[]).length === 0 && (
                                    <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                        No templates found
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-8">
                            {editingTemplateId ? (
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Template Name</label>
                                                <input 
                                                    type="text" 
                                                    defaultValue={(templates as any[]).find(t => t.id === editingTemplateId)?.name || ''} 
                                                    onBlur={e => {
                                                        if (e.target.value.trim()) {
                                                            updateTmpl.mutate({ id: editingTemplateId, data: { name: e.target.value } });
                                                        } else {
                                                            toast.error('Template name cannot be empty');
                                                            e.target.value = (templates as any[]).find(t => t.id === editingTemplateId)?.name || '';
                                                        }
                                                    }}
                                                    disabled={updateTmpl.isPending}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none disabled:opacity-50" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                                                <select 
                                                    defaultValue={(templates as any[]).find(t => t.id === editingTemplateId)?.category || 'MARKETING'}
                                                    onChange={e => updateTmpl.mutate({ id: editingTemplateId, data: { category: e.target.value } })}
                                                    disabled={updateTmpl.isPending}
                                                    className="w-full bg-slate-50 border-slate-200 rounded-lg focus:ring-primary focus:border-primary outline-none disabled:opacity-50" 
                                                >
                                                    {TEMPLATE_CATEGORIES.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-sm font-semibold text-slate-700">Content</label>
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Smart Placeholders</span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {PLACEHOLDERS.map(p => (
                                                    <button 
                                                        key={p.tag}
                                                        onClick={() => insertPlaceholder(p.tag, 'editor')}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-primary hover:text-primary transition-all shadow-sm"
                                                    >
                                                        {p.icon}
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <textarea 
                                                    ref={editorTextareaRef}
                                                    defaultValue={(templates as any[]).find(t => t.id === editingTemplateId)?.content || ''}
                                                    onBlur={e => {
                                                        if (e.target.value.trim()) {
                                                            updateTmpl.mutate({ id: editingTemplateId, data: { content: e.target.value } });
                                                        } else {
                                                            toast.error('Template content cannot be empty');
                                                            e.target.value = (templates as any[]).find(t => t.id === editingTemplateId)?.content || '';
                                                        }
                                                    }}
                                                    disabled={updateTmpl.isPending}
                                                    className="w-full min-h-[350px] p-6 focus:outline-none bg-white text-sm leading-relaxed border rounded-xl disabled:opacity-50"
                                                />
                                                {updateTmpl.isPending && <div className="absolute top-4 right-4"><div className="size-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}
                                            </div>
                                        </div>
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
                                onClick={() => setIsCategoryModalOpen(true)}
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
                                                    disabled={updateCat.isPending}
                                                    className="bg-transparent border-none p-0 font-semibold focus:ring-0 disabled:opacity-50" 
                                                    onBlur={e => {
                                                        if (e.target.value.trim()) {
                                                            updateCat.mutate({ id: cat.id, data: { name: e.target.value } });
                                                        } else {
                                                            toast.error('Category name cannot be empty');
                                                            e.target.value = cat.name;
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <input 
                                                    defaultValue={cat.routeTo} 
                                                    disabled={updateCat.isPending}
                                                    className="bg-transparent border-none p-0 focus:ring-0 disabled:opacity-50" 
                                                    onBlur={e => updateCat.mutate({ id: cat.id, data: { routeTo: e.target.value } })}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    defaultValue={cat.urgency}
                                                    disabled={updateCat.isPending}
                                                    onChange={e => updateCat.mutate({ id: cat.id, data: { urgency: e.target.value } })}
                                                    className="bg-transparent border-none p-0 focus:ring-0 text-xs font-bold disabled:opacity-50"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setCategoryToDelete(cat)} 
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(categories as any[]).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No categories defined for this branch.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function ToggleSwitch({ enabled, onToggle, loading }: { enabled: boolean; onToggle: () => void; loading?: boolean }) {
    return (
        <button
            onClick={onToggle}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
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
