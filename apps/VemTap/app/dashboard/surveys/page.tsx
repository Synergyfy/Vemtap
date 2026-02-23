'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, GripVertical, CheckCircle2, Layout, Settings, Eye, Save, Type, Star, List, BarChart3 } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { useSurvey, useCreateOrUpdateSurvey } from '@/services/surveys/hooks';
import { SurveyTriggerType, TargetAudience } from '@/services/surveys/types';

export default function SurveyBuilderPage() {
    const { data: serverSurvey, isLoading } = useSurvey();
    const { mutate: saveSurvey, isPending: isSaving } = useCreateOrUpdateSurvey();

    const { surveyQuestions } = useCustomerFlowStore();
    const [questions, setQuestions] = useState<any[]>(surveyQuestions);
    const [previewMode, setPreviewMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'settings'>('editor');
    const [triggerType, setTriggerType] = useState<SurveyTriggerType>(SurveyTriggerType.INSTANT);
    const [targetAudience, setTargetAudience] = useState<TargetAudience>({ new: true, returning: true });

    useEffect(() => {
        if (serverSurvey && Object.keys(serverSurvey).length > 0) {
            if (serverSurvey.questions?.length) setQuestions(serverSurvey.questions);
            if (serverSurvey.triggerType) setTriggerType(serverSurvey.triggerType);
            if (serverSurvey.targetAudience) setTargetAudience(serverSurvey.targetAudience);
        }
    }, [serverSurvey]);

    const addQuestion = () => {
        if (questions.length >= 3) {
            toast.error('Maximum 3 questions allowed for optimal conversion');
            return;
        }
        const newQuestion: any = {
            id: `q-${Date.now()}`,
            text: 'New Question?',
            type: 'rating'
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: string, updates: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const handleSave = () => {
        saveSurvey({
            questions,
            triggerType,
            targetAudience,
            isActive: true,
            triggerDelay: 0
        }, {
            onSuccess: () => {
                useCustomerFlowStore.setState({ surveyQuestions: questions });
                toast.success('Survey configuration saved!');
            },
            onError: () => {
                toast.error('Failed to save survey configuration');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <PageHeader
                title="Survey Builder"
                description="Design quick touch-friendly surveys to capture customer insights"
                actions={
                    <button
                        onClick={() => window.location.href = '/dashboard/surveys/analytics'}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm"
                    >
                        <BarChart3 size={18} />
                        Analytics
                    </button>
                }
            />

            <div className="flex flex-col lg:flex-row gap-8 max-w-6xl">
                {/* Left Panel: Editor */}
                <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Layout size={14} />
                                <span>Questions</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Settings size={14} />
                                <span>Logic</span>
                            </div>
                        </button>
                    </div>

                    {activeTab === 'editor' && (
                        <div className="space-y-4">
                            <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-4">
                                {questions.map((q) => (
                                    <Reorder.Item key={q.id} value={q} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-primary/20 transition-all flex gap-4 group">
                                        <div className="flex flex-col items-center justify-center text-gray-300 group-hover:text-primary cursor-grab active:cursor-grabbing">
                                            <GripVertical size={20} />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={q.type}
                                                        onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                                                        className="h-8 px-3 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer text-text-secondary"
                                                    >
                                                        <option value="rating">Rating (1-5)</option>
                                                        <option value="choice">Multiple Choice</option>
                                                        <option value="text">Short Text</option>
                                                    </select>
                                                    <div className="size-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
                                                        {q.type === 'rating' && <Star size={14} />}
                                                        {q.type === 'choice' && <List size={14} />}
                                                        {q.type === 'text' && <Type size={14} />}
                                                    </div>
                                                </div>
                                                <button onClick={() => removeQuestion(q.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={q.text}
                                                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                                className="w-full text-lg font-bold text-text-main placeholder:text-gray-200 focus:outline-none border-b border-transparent focus:border-primary/20 transition-all pb-1"
                                                placeholder="Enter your question..."
                                            />
                                            {q.type === 'choice' && (
                                                <div className="space-y-2 pt-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Options (Comma separated)</label>
                                                    <input
                                                        type="text"
                                                        value={q.options?.join(', ') || ''}
                                                        onChange={(e) => updateQuestion(q.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                        className="w-full h-9 px-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs font-medium"
                                                        placeholder="Choice A, Choice B, Choice C"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>

                            {questions.length < 3 && (
                                <button
                                    onClick={addQuestion}
                                    className="w-full h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-text-secondary hover:border-primary/50 hover:text-primary transition-all group"
                                >
                                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                                    <span className="text-sm font-bold">Add Question</span>
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-4xl border border-gray-100 p-8 shadow-2xl shadow-primary/5 sticky top-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Trigger Conditions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button className="flex items-center justify-between p-4 rounded-xl border-2 border-primary bg-primary/5 text-left transition-all">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-primary">Instant</p>
                                            <p className="text-[10px] text-primary/60 font-bold">Show after successful capture</p>
                                        </div>
                                        <CheckCircle2 size={16} className="text-primary" />
                                    </button>
                                    <button className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 opacity-50 text-left transition-all cursor-not-allowed">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-text-secondary">Delayed</p>
                                            <p className="text-[10px] text-text-secondary font-bold">Send SMS after 2 hours</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-text-main">Target Audience</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-white transition-all">
                                        <input type="checkbox" checked={targetAudience.new} onChange={(e) => setTargetAudience({ ...targetAudience, new: e.target.checked })} className="size-4 accent-primary" />
                                        <div>
                                            <p className="text-xs font-bold text-text-secondary">First-time visitors</p>
                                            <p className="text-[10px] text-text-secondary font-medium">New customers tagging for the first time</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-white transition-all">
                                        <input type="checkbox" checked={targetAudience.returning} onChange={(e) => setTargetAudience({ ...targetAudience, returning: e.target.checked })} className="size-4 accent-primary" />
                                        <div>
                                            <p className="text-xs font-bold text-text-secondary">Repeat visitors</p>
                                            <p className="text-[10px] text-text-secondary font-medium">Returning loyal customers</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="h-12 px-6 bg-white border border-gray-200 text-text-secondary font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-all"
                        >
                            <Eye size={16} />
                            {previewMode ? 'Close Preview' : 'Preview Live'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isSaving ? <span className="material-icons-round animate-spin text-sm">refresh</span> : <Save size={16} />}
                            {isSaving ? 'Saving...' : 'Save Survey'}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Preview (Sticky Mobile Frame) */}
                <div className="hidden lg:block w-[320px]">
                    <div className="sticky top-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-4 ml-6">Live Preview</h3>
                        <div className="w-[300px] h-[600px] bg-text-main rounded-[3rem] p-4 border-8 border-gray-900 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-20" />
                            <div className="bg-white w-full h-full rounded-4xl overflow-hidden flex flex-col p-6 pt-10 text-center">
                                <div className="size-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                                </div>
                                <div className="flex-1">
                                    {questions.length > 0 ? (
                                        <div className="space-y-6 text-left">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Question 1</p>
                                            <h4 className="text-base font-black text-text-main leading-tight">
                                                {questions[0].text}
                                            </h4>

                                            {questions[0].type === 'rating' && (
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <div key={n} className="size-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-gray-300">
                                                            {n}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {questions[0].type === 'choice' && (
                                                <div className="space-y-2">
                                                    {(questions[0].options || ['Option 1', 'Option 2']).slice(0, 2).map((opt: string, i: number) => (
                                                        <div key={i} className="w-full p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-gray-300">
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {questions[0].type === 'text' && (
                                                <div className="w-full h-20 bg-gray-50 border border-gray-100 rounded-lg p-3 text-[10px] text-gray-300 font-medium">
                                                    Type response...
                                                </div>
                                            )}

                                            <button className="w-full h-11 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl opacity-20 pointer-events-none">
                                                Next Question
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30">
                                            <Layout size={32} className="text-gray-200 mb-2" />
                                            <p className="text-xs font-bold text-text-secondary">Empty Survey</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
