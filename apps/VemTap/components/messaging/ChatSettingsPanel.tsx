'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    Moon, BookOpen, Plus, Trash2, 
    Bolt, 
    SearchCheck, ArrowLeft, X, Save, AlertTriangle, FileText,
    UserCircle, Building2, Link as LinkIcon, Star, Coins, Clock, Copy,
    Zap, Target, MessageSquare, Eye, EyeOff
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
} from '@/hooks/useMessaging';
import { 
    useAutomations, 
    useCreateAutomation, 
    useUpdateAutomation, 
    useDeleteAutomation 
} from '@/services/messaging/hooks';
import { useCapabilities } from '@/services/subscriptions/hooks';
import { TriggerType, TargetType, ActionType } from '@/services/messaging/types';

const TEMPLATE_CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function TargetModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    availableTags 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: (target: 'all' | string) => void; 
    availableTags: string[];
}) {
    const [selection, setSelection] = useState<'all' | 'tag'>('all');
    const [selectedTag, setSelectedTag] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Set Message Audience</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <button 
                            onClick={() => setSelection('all')}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${selection === 'all' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                        >
                            <div className={`size-5 rounded-full border-2 flex items-center justify-center ${selection === 'all' ? 'border-primary bg-primary' : 'border-slate-300 bg-white'}`}>
                                {selection === 'all' && <div className="size-2 bg-white rounded-full" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Send to All</p>
                                <p className="text-xs text-slate-500">Every visitor who sends a message will receive this.</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => setSelection('tag')}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${selection === 'tag' ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                        >
                            <div className={`size-5 rounded-full border-2 flex items-center justify-center ${selection === 'tag' ? 'border-primary bg-primary' : 'border-slate-300 bg-white'}`}>
                                {selection === 'tag' && <div className="size-2 bg-white rounded-full" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Target Specific Tag</p>
                                <p className="text-xs text-slate-500">Only visitors with the selected tag will receive this.</p>
                            </div>
                        </button>
                    </div>

                    {selection === 'tag' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Tag</label>
                            <select 
                                value={selectedTag}
                                onChange={e => setSelectedTag(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                            >
                                <option value="">Choose a tag...</option>
                                {availableTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-slate-50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl">Cancel</button>
                    <button 
                        disabled={selection === 'tag' && !selectedTag}
                        onClick={() => onConfirm(selection === 'all' ? 'all' : selectedTag)}
                        className="flex-1 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        Confirm & Save
                    </button>
                </div>
            </div>
        </div>
    );
}

const PLACEHOLDERS = [
    { label: 'First Name', tag: '{FirstName}', icon: <UserCircle size={12} /> },
    { label: 'Full Name', tag: '{Name}', icon: <UserCircle size={12} /> },
    { label: 'Points', tag: '{Points}', icon: <Coins size={12} /> },
    { label: 'Business Name', tag: '{BusinessName}', icon: <Building2 size={12} /> },
    { label: 'Branch Name', tag: '{BranchName}', icon: <Building2 size={12} /> },
    { label: 'Website', tag: '{Website}', icon: <LinkIcon size={12} /> },
    { label: 'Review Link', tag: '{ReviewLink}', icon: <Star size={12} /> },
];

function RuleModal({ 
    isOpen, 
    onClose, 
    onSave, 
    isLoading 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: any) => void;
    isLoading: boolean;
}) {
    const [data, setData] = useState({
        name: '',
        triggerType: TriggerType.FIRST_MESSAGE,
        targetType: TargetType.NEW_VISITORS,
        actionType: ActionType.SEND_IN_APP_CHAT,
        message: ''
    });

    if (!isOpen) return null;

    const canSave = data.name.trim() && data.message.trim();

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">Create Automation Rule</h3>
                            <p className="text-xs text-slate-500">Define a new automated workflow trigger</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Rule Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Rule Identification</label>
                        <input 
                            type="text"
                            value={data.name}
                            onChange={e => setData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Welcome Message for VIPs"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Trigger */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Condition Trigger</label>
                            <div className="relative group">
                                <Zap size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <select 
                                    value={data.triggerType}
                                    onChange={e => setData(prev => ({ ...prev, triggerType: e.target.value as TriggerType }))}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-slate-700 appearance-none pointer-events-auto"
                                >
                                    {Object.values(TriggerType).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Target */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Audience Target</label>
                            <div className="relative group">
                                <Target size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <select 
                                    value={data.targetType}
                                    onChange={e => setData(prev => ({ ...prev, targetType: e.target.value as TargetType }))}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-slate-700 appearance-none pointer-events-auto"
                                >
                                    {Object.values(TargetType).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Action to Perform</label>
                        <div className="relative group">
                            <Bolt size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <select 
                                value={data.actionType}
                                onChange={e => setData(prev => ({ ...prev, actionType: e.target.value as ActionType }))}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-slate-700 appearance-none"
                            >
                                {Object.values(ActionType).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between items-center">
                            Response Message
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Supports smart tags</span>
                        </label>
                        <textarea 
                            value={data.message}
                            onChange={e => setData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Type the message that should be automatically sent..."
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium text-slate-700 min-h-[120px] resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Discard
                    </button>
                    <button 
                        disabled={!canSave || isLoading}
                        onClick={() => onSave(data)}
                        className="flex-[2] py-3.5 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                Activate Rule
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ChatSettingsPanel() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'automation';
    
    const user = useAuthStore(s => s.user);
    const branchId = searchParams.get('branchId');

    const { data: capabilities } = useCapabilities();
    const autoLimit = capabilities?.capabilities?.automations;
    const isAutomationsEnabled = autoLimit?.enabled ?? true;
    const isLimitReached = autoLimit?.remaining !== 'unlimited' && (autoLimit?.remaining ?? 1) <= 0;

    // Queries
    const { data: automation = {} as any, isLoading: autoLoading } = useChatAutomation(branchId || undefined);
    const { data: templates = [], isLoading: templatesLoading } = useChatTemplates(branchId || undefined);

    // Mutations
    const updateWelcome = useUpdateChatAutomation(branchId || undefined);
    const updateOffHours = useUpdateChatAutomation(branchId || undefined);
    
    const addFaq = useAddFaqKeyword(branchId || undefined);
    const updateFaq = useUpdateFaqKeyword(branchId || undefined);
    const deleteFaq = useDeleteFaqKeyword(branchId || undefined);
    
    const createTmpl = useCreateTemplate();
    const updateTmpl = useUpdateTemplate();
    const deleteTmpl = useDeleteTemplate();
    
    const { data: advancedRules = [], isLoading: rulesLoading } = useAutomations(branchId || undefined);
    const createRule = useCreateAutomation();
    const updateRuleFull = useUpdateAutomation(); 
    const deleteRule = useDeleteAutomation();
    
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const { data: business } = useMyBusiness(isAuthenticated);

    const businessName = business?.name || user?.businessName || 'Vemtap';
    const businessLogo = business?.logoUrl || user?.businessLogo;

    // Local UI State
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    
    const [templateToDelete, setTemplateToDelete] = useState<any | null>(null);
    
    const [newTemplateData, setNewTemplateData] = useState({ name: '', category: 'MARKETING', content: '' });

    // Local Automation state for manual submission
    const [localAuto, setLocalAuto] = useState<any>({});
    
    // Automation Composing State
    const [isComposing, setIsComposing] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [tempMessage, setTempMessage] = useState('');
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

    const welcomeRules = advancedRules.filter((r: any) => r.triggerType === TriggerType.FIRST_MESSAGE);

    useEffect(() => {
        if (automation && Object.keys(automation).length > 0) {
            setLocalAuto({
                ...automation,
                customSchedule: automation.customSchedule || { days: {} }
            });
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
            const content = editingRule ? editingRule.actionConfig?.message : tempMessage;
            if (!content?.trim()) {
                toast.error('Message content is required');
                return;
            }
            setIsTargetModalOpen(true);
        } else {
            if (localAuto.offHoursEnabled && !localAuto.offHoursMessage?.trim()) {
                toast.error('Off-hours message content is required when enabled');
                return;
            }
            data.offHoursEnabled = localAuto.offHoursEnabled;
            data.offHoursMessage = localAuto.offHoursMessage;
            data.offHoursSchedule = localAuto.offHoursSchedule;
            data.customSchedule = localAuto.customSchedule;
            updateOffHours.mutate(data, { onSuccess: () => toast.success('Off-hours settings saved') });
        }
    };

    const handleConfirmTarget = async (target: 'all' | string) => {
        setIsTargetModalOpen(false);
        const name = editingRule ? editingRule.name : `Welcome Message (${target})`;
        const content = editingRule ? editingRule.actionConfig?.message : tempMessage;
        
        const payload = {
            branchId: branchId || undefined,
            name,
            triggerType: TriggerType.FIRST_MESSAGE,
            targetType: target === 'all' ? TargetType.NEW_VISITORS : TargetType.SPECIFIC_CATEGORY,
            actionType: ActionType.SEND_IN_APP_CHAT,
            isActive: true,
            actionConfig: { 
                message: content,
                targetTag: target !== 'all' ? target : undefined
            }
        };

        try {
            if (editingRule) {
                await updateRuleFull.mutateAsync({ id: editingRule.id, data: payload as any });
                toast.success('Automation updated');
            } else {
                await createRule.mutateAsync(payload);
                toast.success('Automation created');
            }
            setIsComposing(false);
            setEditingRule(null);
            setTempMessage('');
        } catch (err) {
            toast.error('Failed to save automation');
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
            if (editingRule) {
                setEditingRule((prev: any) => ({
                    ...prev,
                    actionConfig: { ...prev.actionConfig, message: newValue }
                }));
            } else {
                setTempMessage(newValue);
            }
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

    const updateDaySchedule = (day: string, field: 'startTime' | 'endTime', value: string) => {
        setLocalAuto((prev: any) => {
            const days = { ...prev.customSchedule?.days };
            days[day] = { 
                startTime: '09:00', 
                endTime: '17:00', 
                ...(days[day] || {}), 
                [field]: value 
            };
            return {
                ...prev,
                customSchedule: { ...prev.customSchedule, days }
            };
        });
    };

    const toggleDay = (day: string) => {
        setLocalAuto((prev: any) => {
            const days = { ...prev.customSchedule?.days };
            if (days[day]) {
                delete days[day];
            } else {
                days[day] = { startTime: '09:00', endTime: '17:00' };
            }
            return {
                ...prev,
                customSchedule: { ...prev.customSchedule, days }
            };
        });
    };

    const copyScheduleToAll = (sourceDay: string) => {
        const source = localAuto.customSchedule?.days?.[sourceDay];
        if (!source) return;

        setLocalAuto((prev: any) => {
            const days: any = {};
            DAYS.forEach(day => {
                days[day] = { ...source };
            });
            return {
                ...prev,
                customSchedule: { ...prev.customSchedule, days }
            };
        });
        toast.success(`Copied ${sourceDay}'s schedule to all days`);
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
        <div className="h-[calc(100vh-64px)] overflow-y-auto bg-slate-50 flex flex-col relative">
            {/* Modals */}
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
                            {activeTab === 'automation' ? 'Basic Settings' : activeTab === 'rules' ? 'Automation Rules' : 'Message Templates'}
                        </h2>
                        <p className="text-xs text-slate-500">Manage your business communication workflow</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        {[
                            { id: 'automation', label: 'Basic' },
                            { id: 'rules', label: 'Rules' },
                            { id: 'templates', label: 'Templates' }
                        ].map(t => (
                            <button 
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === t.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t.label}
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

            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 pb-32">
                {/* Modals */}
                <RuleModal 
                    isOpen={isRuleModalOpen}
                    onClose={() => setIsRuleModalOpen(false)}
                    isLoading={createRule.isPending}
                    onSave={async (data) => {
                        const payload = {
                            branchId: branchId || undefined,
                            name: data.name,                            triggerType: data.triggerType,
                            targetType: data.targetType,
                            actionType: data.actionType,
                            isActive: true,
                            actionConfig: { message: data.message }
                        };
                        
                        try {
                            await createRule.mutateAsync(payload);
                            toast.success('Automation rule created & activated!');
                            setIsRuleModalOpen(false);
                        } catch (err: any) {
                            toast.error(`Creation failed: ${err.message || 'Check connection'}`);
                        }
                    }}
                />

                <TargetModal
                    isOpen={isTargetModalOpen}
                    onClose={() => setIsTargetModalOpen(false)}
                    onConfirm={handleConfirmTarget}
                    availableTags={['New Visitors', 'Returning', 'VIP', 'High Intent', 'Potential Sales']}
                />

                {(autoLoading || templatesLoading || rulesLoading) && (
                    <div className="flex flex-col items-center justify-center p-24 animate-pulse">
                         <div className="size-16 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
                         <p className="text-slate-400 font-medium">Synchronizing settings...</p>
                    </div>
                )}

                {activeTab === 'automation' && !autoLoading && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 gap-8">
                            {/* Automated Message (formerly Welcome) */}
                            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                            <Zap size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Automated Message</h3>
                                            <p className="text-sm text-slate-500">Configure responses triggered by specific events or visitor segments.</p>
                                        </div>
                                    </div>
                                    {!isComposing && (
                                        <button 
                                            onClick={() => {
                                                if (isLimitReached) {
                                                    toast.error('Automation limit reached for your plan. Please upgrade to add more.');
                                                    return;
                                                }
                                                setIsComposing(true); 
                                                setEditingRule(null); 
                                                setTempMessage(''); 
                                            }}
                                            disabled={isLimitReached}
                                            className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg ${isLimitReached ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary-dark shadow-primary/20'}`}
                                        >
                                            <Plus size={14} /> Add Automation
                                        </button>
                                    )}
                                </div>

                                {isLimitReached && (
                                    <div className="bg-amber-50 border-b border-amber-100 p-3 px-6 flex items-center gap-3">
                                        <AlertTriangle size={16} className="text-amber-600" />
                                        <p className="text-[11px] font-bold text-amber-700">
                                            You have reached the limit of {autoLimit?.limit} automations for your plan. 
                                            <Link href="/dashboard/settings/billing" className="ml-2 underline hover:text-amber-900">Upgrade plan &rarr;</Link>
                                        </p>
                                    </div>
                                )}

                                {!isAutomationsEnabled ? (
                                    <div className="p-12 text-center bg-slate-50/50">
                                        <div className="size-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Zap size={32} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-2">Automations Disabled</h4>
                                        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Automated messaging is not available on your current plan. Upgrade to unlock this feature.</p>
                                        <Link href="/dashboard/settings/billing" className="inline-flex items-center px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
                                            View Pricing Plans
                                        </Link>
                                    </div>
                                ) : !isComposing ? (
                                    <div className="p-6 bg-slate-50/50 space-y-4">
                                        {welcomeRules.length === 0 ? (
                                            <div className="py-12 text-center text-slate-400 italic text-sm">No automations defined. Click the plus button to start.</div>
                                        ) : welcomeRules.map((rule: any) => (
                                            <div key={rule.id} className={`bg-white border transition-all rounded-xl p-5 shadow-sm space-y-3 ${!rule.isActive ? 'opacity-50 grayscale pointer-events-none' : 'border-slate-200'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-slate-900 text-sm">{rule.name}</span>
                                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${rule.targetType === TargetType.SPECIFIC_CATEGORY ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                            {rule.targetType === TargetType.SPECIFIC_CATEGORY ? `Tag: ${rule.actionConfig?.targetTag || 'Selected'}` : 'All Visitors'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={() => { setEditingRule(rule); setIsComposing(true); }}
                                                            className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-primary/5 rounded"
                                                        >
                                                            <Bolt size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { if(confirm('Delete automation?')) deleteRule.mutate(rule.id); }}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <ToggleSwitch
                                                            enabled={rule.isActive}
                                                            onToggle={() => updateRuleFull.mutate({ id: rule.id, data: { isActive: !rule.isActive } })}
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded-lg italic">
                                                    &quot;{rule.actionConfig?.message}&quot;
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-slate-50/50 animate-in slide-in-from-right-2 duration-300">
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-sm font-medium text-slate-700">Automation Content</label>
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
                                                value={editingRule ? editingRule.actionConfig?.message : tempMessage}
                                                onChange={e => {
                                                    if (editingRule) setEditingRule((prev: any) => ({ ...prev, actionConfig: { ...prev.actionConfig, message: e.target.value } }));
                                                    else setTempMessage(e.target.value);
                                                }}
                                                className="block w-full px-4 py-3 text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-primary focus:border-primary outline-none transition-all"
                                                placeholder="Hi there! Thanks for reaching out..."
                                                rows={5} 
                                            />
                                        </div>
                                        <div className="mt-4 flex justify-between gap-3">
                                            <button 
                                                onClick={() => { setIsComposing(false); setEditingRule(null); }}
                                                className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => handleSaveAuto('welcome')}
                                                disabled={createRule.isPending || updateRuleFull.isPending}
                                                className="inline-flex items-center gap-2 px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                            >
                                                <Save size={16} /> Save Automation
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                                    </div>

                                    {localAuto.offHoursSchedule === 'Custom Schedule' && (
                                        <div className="mb-8 p-6 bg-white border border-slate-200 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-4 text-slate-800 font-bold">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={18} className="text-primary" />
                                                    <h4>Configure Active Off-Hours</h4>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium">Auto-replies only send during these slots</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {DAYS.map(day => (
                                                    <div key={day} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => toggleDay(day)}
                                                                className={`size-5 rounded border-2 flex items-center justify-center transition-all ${localAuto.customSchedule?.days?.[day] ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'}`}
                                                            >
                                                                {localAuto.customSchedule?.days?.[day] && <Plus size={14} className="rotate-45" />}
                                                            </button>
                                                            <span className="text-sm font-bold capitalize text-slate-700 w-24">{day}</span>
                                                        </div>
                                                        
                                                        {localAuto.customSchedule?.days?.[day] ? (
                                                            <div className="flex items-center gap-3 animate-in fade-in duration-200">
                                                                <div className="flex items-center gap-2">
                                                                    <input 
                                                                        type="time" 
                                                                        value={localAuto.customSchedule.days[day].startTime}
                                                                        onChange={e => updateDaySchedule(day, 'startTime', e.target.value)}
                                                                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-primary/20"
                                                                    />
                                                                    <span className="text-slate-400 text-xs font-bold">to</span>
                                                                    <input 
                                                                        type="time" 
                                                                        value={localAuto.customSchedule.days[day].endTime}
                                                                        onChange={e => updateDaySchedule(day, 'endTime', e.target.value)}
                                                                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-primary/20"
                                                                    />
                                                                </div>
                                                                
                                                                <button 
                                                                    onClick={() => copyScheduleToAll(day)}
                                                                    title="Apply this time slot to all days"
                                                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                                >
                                                                    <Copy size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic font-medium">No auto-reply set for this day</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
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
                                        <div key={faq.id} className={`p-5 bg-white border border-slate-200 rounded-2xl shadow-sm ${!faq.enabled ? 'opacity-60 grayscale-[0.5]' : ''} transition-all space-y-4`}>
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trigger Keywords (comma separated)</label>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => updateFaq.mutate({ id: faq.id, data: { enabled: !faq.enabled } })}
                                                                className={`p-1.5 rounded-lg transition-all ${faq.enabled ? 'text-primary bg-primary/5 hover:bg-primary/10' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                                                                title={faq.enabled ? "Disable Trigger" : "Enable Trigger"}
                                                            >
                                                                {faq.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                                            </button>
                                                            <button 
                                                                onClick={() => { if(confirm('Delete this trigger?')) deleteFaq.mutate(faq.id); }}
                                                                disabled={deleteFaq.isPending}
                                                                className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                                                                title="Delete Trigger"
                                                            >
                                                                {deleteFaq.isPending ? <div className="size-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" /> : <Trash2 size={14} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        type="text"
                                                        defaultValue={faq.keywords.join(', ')}
                                                        placeholder="e.g. price, cost, how much"
                                                        onBlur={e => {
                                                            const val = e.target.value.trim();
                                                            const newKeywords = val.split(',').map(k => k.trim()).filter(Boolean);
                                                            if (newKeywords.length > 0) {
                                                                updateFaq.mutate({ id: faq.id, data: { keywords: newKeywords } });
                                                            } else {
                                                                toast.error('Keywords cannot be empty');
                                                                e.target.value = faq.keywords.join(', ');
                                                            }
                                                        }}
                                                        disabled={updateFaq.isPending}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Auto-Response Message</label>
                                                </div>
                                                <textarea 
                                                    defaultValue={faq.response}
                                                    placeholder="Type the automated reply here..."
                                                    onBlur={e => {
                                                        if (e.target.value.trim()) {
                                                            updateFaq.mutate({ id: faq.id, data: { response: e.target.value } });
                                                        } else {
                                                            toast.error('Response cannot be empty');
                                                            e.target.value = faq.response;
                                                        }
                                                    }}
                                                    disabled={updateFaq.isPending}
                                                    className="block w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all disabled:opacity-50 min-h-[80px] resize-none font-medium"
                                                    rows={2} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <button 
                                        onClick={() => {
                                            const kws = prompt('Enter keywords for this trigger (comma separated):', 'new-keyword');
                                            if (!kws) return;
                                            const keywords = kws.split(',').map(k => k.trim()).filter(Boolean);
                                            if (keywords.length === 0) return;
                                            addFaq.mutate({ keywords, response: 'Hi! Thanks for asking. How can we help you with that?' });
                                        }}
                                        disabled={addFaq.isPending}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 group"
                                    >
                                        {addFaq.isPending ? (
                                            <div className="size-5 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <div className="size-6 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                                    <Plus size={14} />
                                                </div>
                                                Add New Keyword Trigger
                                            </>
                                        )}
                                    </button>
                                </div>
                            </section>

                        </div>
                    </div>
                )}
 
                {activeTab === 'rules' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 gap-8">
                            {/* Rule-based Automations */}
                            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <Zap size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Dynamic Automation Rules</h3>
                                            <p className="text-sm text-slate-500">Configure triggers, targets and actions for custom flows.</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (isLimitReached) {
                                                toast.error('Automation limit reached for your plan.');
                                                return;
                                            }
                                            setIsRuleModalOpen(true);
                                        }}
                                        disabled={isLimitReached}
                                        className={`inline-flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-lg transition-all shadow-md ${isLimitReached ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
                                    >
                                        <Plus size={14} /> New Rule
                                    </button>
                                </div>

                                {isLimitReached && (
                                    <div className="bg-amber-50 border-b border-amber-100 p-3 px-6 flex items-center gap-3">
                                        <AlertTriangle size={16} className="text-amber-600" />
                                        <p className="text-[11px] font-bold text-amber-700">
                                            You have reached the limit of {autoLimit?.limit} automations. 
                                            <Link href="/dashboard/settings/billing" className="ml-2 underline hover:text-amber-900">Upgrade plan &rarr;</Link>
                                        </p>
                                    </div>
                                )}

                                {!isAutomationsEnabled ? (
                                    <div className="p-12 text-center bg-slate-50/50">
                                        <div className="size-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Zap size={32} />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-2">Advanced Rules Disabled</h4>
                                        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Custom automation workflows are not available on your current plan.</p>
                                        <Link href="/dashboard/settings/billing" className="inline-flex items-center px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
                                            Upgrade Plan
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="p-6 bg-slate-50/50 space-y-4">
                                    {rulesLoading ? (
                                        <div className="py-12 flex justify-center"><div className="size-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
                                    ) : (advancedRules as any[]).length === 0 ? (
                                        <div className="py-12 text-center text-slate-400 italic text-sm">No custom automation rules defined. Use the button above to create one.</div>
                                    ) : (advancedRules as any[]).map((rule: any) => (
                                        <div key={rule.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        defaultValue={rule.name}
                                                        onBlur={e => {
                                                            if (e.target.value.trim() && e.target.value !== rule.name) {
                                                                updateRuleFull.mutate({ id: rule.id, data: { name: e.target.value } });
                                                            }
                                                        }}
                                                        className="font-bold text-slate-900 border-none p-0 focus:ring-0 text-sm bg-transparent w-48"
                                                    />
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${rule.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {rule.isActive ? 'Active' : 'Disabled'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this rule?')) {
                                                                deleteRule.mutate(rule.id);
                                                            }
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                        title="Delete rule"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <ToggleSwitch
                                                        enabled={rule.isActive}
                                                        onToggle={() => updateRuleFull.mutate({ id: rule.id, data: { isActive: !rule.isActive } })}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-slate-50 rounded-lg p-3 space-y-1 border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Zap size={10} /> Trigger
                                                    </p>
                                                    <select 
                                                        value={rule.triggerType}
                                                        onChange={e => updateRuleFull.mutate({ id: rule.id, data: { triggerType: e.target.value as TriggerType } })}
                                                        className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer"
                                                    >
                                                        {Object.values(TriggerType).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                                                    </select>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg p-3 space-y-1 border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Target size={10} /> Target
                                                    </p>
                                                    <select 
                                                        value={rule.targetType || TargetType.NEW_VISITORS}
                                                        onChange={e => updateRuleFull.mutate({ id: rule.id, data: { targetType: e.target.value as TargetType } })}
                                                        className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer"
                                                    >
                                                        {Object.values(TargetType).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                                                    </select>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg p-3 space-y-1 border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Bolt size={10} /> Action
                                                    </p>
                                                    <select 
                                                        value={rule.actionType}
                                                        onChange={e => updateRuleFull.mutate({ id: rule.id, data: { actionType: e.target.value as ActionType } })}
                                                        className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer"
                                                    >
                                                        {Object.values(ActionType).map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <MessageSquare size={10} /> Response Content
                                                </label>
                                                <textarea 
                                                    defaultValue={rule.actionConfig?.message || ''}
                                                    onBlur={e => {
                                                        if (e.target.value !== (rule.actionConfig?.message || '')) {
                                                            updateRuleFull.mutate({ 
                                                                id: rule.id, 
                                                                data: { 
                                                                    actionConfig: { ...rule.actionConfig, message: e.target.value } 
                                                                } 
                                                            });
                                                        }
                                                    }}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                    rows={2}
                                                    placeholder="Type the message to send..."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                )}
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
