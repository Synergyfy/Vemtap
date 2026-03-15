"use client";

import React, { useMemo, useState } from 'react';
import { BadgeCheck, BookOpen, Info, LayoutTemplate, LayoutList, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { LoyaltyRule } from '@/types/loyalty';
import { LoyaltyTemplate, TemplateReward, TemplateStatus } from '@/services/loyalty/types';
import { cn } from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';
import { notify } from '@/lib/notify';

type Step = 1 | 2 | 3;
type TemplateView = 'grid' | 'list';
type ScreenMode = 'list' | 'builder';

interface LoyaltyTemplateManagerProps {
    templates: LoyaltyTemplate[];
    onCreate: (template: Partial<LoyaltyTemplate>) => void;
    onUpdate: (id: string, updates: Partial<LoyaltyTemplate>) => void;
    onDelete: (id: string) => void;
}

const emptyRules: Partial<LoyaltyRule> = {
    ruleType: 'visit',
    visitPoints: 5,
    visitCooldownHours: 24,
    spendingBaseAmount: 1000,
    spendingBasePoints: 10,
    firstVisitBonus: 0,
    birthdayBonus: 0,
    referralBonus: 0,
    isActive: true,
};

const StepNavigator: React.FC<{
    currentStep: Step;
    onStepChange: (step: Step) => void;
    onSave: () => void;
    onBack: () => void;
}> = ({ currentStep, onStepChange, onSave, onBack }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {currentStep} of 3</p>
                <h3 className="text-lg font-black text-slate-900">Template Builder</h3>
                <p className="text-xs text-slate-500">Complete each step to publish a usable template.</p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl"
                >
                    Back to Templates
                </button>
                <button
                    onClick={onSave}
                    className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2"
                >
                    <Save size={14} /> Save Template
                </button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
                { id: 1, label: 'Core Details' },
                { id: 2, label: 'Earning Rules' },
                { id: 3, label: 'Rewards' },
            ].map((step) => (
                <button
                    key={step.id}
                    onClick={() => onStepChange(step.id as Step)}
                    className={cn(
                        "w-full px-4 py-3 border text-left transition-all rounded-xl",
                        currentStep === step.id
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {step.id}</p>
                    <p className="text-sm font-black text-slate-900">{step.label}</p>
                </button>
            ))}
        </div>
    </div>
);

const GuidanceCards: React.FC<{ cards: { title: string; body: string }[] }> = ({ cards }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((card) => (
            <div key={card.title} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-slate-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.title}</p>
                </div>
                <p className="text-xs text-slate-500">{card.body}</p>
            </div>
        ))}
    </div>
);

const TemplateListItem: React.FC<{
    template: LoyaltyTemplate;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
}> = ({ template, isActive, onSelect, onDelete }) => {
    const previewImage = template.rewards.find((r: TemplateReward) => r.imageUrl)?.imageUrl;
    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full text-left border rounded-xl transition-all overflow-hidden",
                isActive ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:bg-slate-50"
            )}
        >
            <div className="h-36 w-full overflow-hidden relative">
                {previewImage ? (
                    <img src={previewImage} alt={`${template.name} preview`} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <LayoutTemplate size={28} />
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                    {template.rules?.ruleType || 'rules'}
                </div>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-base font-black text-slate-900">{template.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{template.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <BadgeCheck className={cn("w-4 h-4", template.status === 'published' ? "text-emerald-500" : "text-slate-300")} />
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete();
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                            title="Delete template"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                    {template.description || 'No description provided.'}
                </p>
                <div className="flex gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400">
                    <span>{template.rewards.length} rewards</span>
                    <span>&bull;</span>
                    <span>{template.rules?.ruleType || 'rules'}</span>
                </div>
            </div>
        </button>
    );
};

const TemplateListRow: React.FC<{
    template: LoyaltyTemplate;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
}> = ({ template, isActive, onSelect, onDelete }) => (
    <div
        className={cn(
            "grid grid-cols-12 items-center gap-3 border px-4 py-3 text-sm rounded-xl",
            isActive ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:bg-slate-50"
        )}
    >
        <button onClick={onSelect} className="col-span-5 text-left flex items-center gap-3">
            <div className="size-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                {template.rewards.find((r: TemplateReward) => r.imageUrl)?.imageUrl ? (
                    <img
                        src={template.rewards.find((r: TemplateReward) => r.imageUrl)?.imageUrl as string}
                        alt={`${template.name} preview`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <LayoutTemplate size={16} />
                    </div>
                )}
            </div>
            <div>
                <p className="font-black text-slate-900">{template.name}</p>
                <p className="text-xs text-slate-500">{template.description || 'No description provided.'}</p>
            </div>
        </button>
        <div className="col-span-2 text-xs font-black uppercase tracking-widest text-slate-400">
            {template.rules?.ruleType || 'rules'}
        </div>
        <div className="col-span-2 text-xs font-black uppercase tracking-widest text-slate-400">
            {template.rewards.length} rewards
        </div>
        <div className="col-span-2 text-xs font-black uppercase tracking-widest text-slate-400">
            {template.status}
        </div>
        <div className="col-span-1 flex items-center justify-end gap-2">
            <BadgeCheck className={cn("w-4 h-4", template.status === 'published' ? "text-emerald-500" : "text-slate-300")} />
            <button
                onClick={onDelete}
                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                title="Delete template"
            >
                <Trash2 size={14} />
            </button>
        </div>
    </div>
);

const CoreDetailsStep: React.FC<{
    template: LoyaltyTemplate;
    onChange: (updates: Partial<LoyaltyTemplate>) => void;
}> = ({ template, onChange }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Template Identity</p>
                <h3 className="text-lg font-black text-slate-900">Core Details</h3>
            </div>
            <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl">
                Step 1
            </div>
        </div>
        <GuidanceCards
            cards={[
                { title: 'Name Clearly', body: 'Use a label that tells businesses the goal at a glance.' },
                { title: 'Describe Outcome', body: 'Summarize the rewards + earning style in one sentence.' },
                { title: 'Publish When Ready', body: 'Drafts are hidden; publish to make it visible to businesses.' },
            ]}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    Template Name
                    <Tooltip content="Give the template a clear, descriptive name.">
                        <Info className="w-3 h-3 text-slate-300" />
                    </Tooltip>
                </label>
                <input
                    value={template.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-primary outline-none"
                    placeholder="VIP Retail Loyalty"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    Status
                    <Tooltip content="Draft is hidden. Published is visible to businesses.">
                        <Info className="w-3 h-3 text-slate-300" />
                    </Tooltip>
                </label>
                <select
                    value={template.status}
                    onChange={(e) => onChange({ status: e.target.value as TemplateStatus })}
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-primary outline-none"
                >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </div>
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                Description
                <Tooltip content="Explain who this template is for and what it offers.">
                    <Info className="w-3 h-3 text-slate-300" />
                </Tooltip>
            </label>
            <textarea
                value={template.description}
                onChange={(e) => onChange({ description: e.target.value })}
                className="w-full min-h-[90px] px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-700 focus:border-primary outline-none"
                placeholder="Describe who this template is for and how it works."
            />
        </div>
    </div>
);

const EarningRulesStep: React.FC<{
    template: LoyaltyTemplate;
    onRulesChange: (rules: Partial<LoyaltyRule>) => void;
}> = ({ template, onRulesChange }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Earning Rules</p>
                <h3 className="text-lg font-black text-slate-900">How Points Are Earned</h3>
            </div>
            <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl">
                Step 2
            </div>
        </div>
        <GuidanceCards
            cards={[
                { title: 'Pick a Rule Type', body: 'Choose visit, spending, or hybrid to define how points start.' },
                { title: 'Set Cooldowns', body: 'Use cooldown hours to prevent rapid abuse and protect margins.' },
                { title: 'Add Bonus Moments', body: 'Use bonuses for first visits, birthdays, or referrals.' },
            ]}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
                { key: 'visit', label: 'Visit-Based', tip: 'Awards points for each visit.' },
                { key: 'spending', label: 'Spending-Based', tip: 'Awards points for each amount spent.' },
                { key: 'hybrid', label: 'Hybrid', tip: 'Combines visit and spending rules.' },
            ].map((item) => (
                <button
                    key={item.key}
                    onClick={() => onRulesChange({ ...template.rules, ruleType: item.key as LoyaltyRule['ruleType'] })}
                    className={cn(
                        "p-4 border rounded-xl text-left transition-all",
                        template.rules?.ruleType === item.key
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                        <Tooltip content={item.tip}>
                            <Info className="w-3 h-3 text-slate-300" />
                        </Tooltip>
                    </div>
                    <p className="text-xs text-slate-500">{item.tip}</p>
                </button>
            ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                { label: 'Visit Points', key: 'visitPoints', tip: 'Points awarded per visit.' },
                { label: 'Visit Cooldown (Hours)', key: 'visitCooldownHours', tip: 'How long before another visit can earn points.' },
                { label: 'Spending Base Amount', key: 'spendingBaseAmount', tip: 'Amount spent to earn base points.' },
                { label: 'Spending Base Points', key: 'spendingBasePoints', tip: 'Points awarded for the base amount.' },
            ].map((field) => (
                <div key={field.key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {field.label}
                        <Tooltip content={field.tip}>
                            <Info className="w-3 h-3 text-slate-300" />
                        </Tooltip>
                    </div>
                    <input
                        type="number"
                        value={(template.rules?.[field.key as keyof LoyaltyRule] as number | undefined) ?? ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            onRulesChange({
                                ...template.rules,
                                [field.key]: value === '' ? undefined : Number(value),
                            });
                        }}
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
                { key: 'firstVisitBonus', label: 'First Visit Bonus' },
                { key: 'birthdayBonus', label: 'Birthday Bonus' },
                { key: 'referralBonus', label: 'Referral Bonus' },
            ].map((bonus) => (
                <div key={bonus.key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {bonus.label}
                        <Tooltip content={`Extra points for ${bonus.label.toLowerCase()}.`}>
                            <Info className="w-3 h-3 text-slate-300" />
                        </Tooltip>
                    </div>
                    <input
                        type="number"
                        value={(template.rules?.[bonus.key as keyof LoyaltyRule] as number | undefined) ?? ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            onRulesChange({
                                ...template.rules,
                                [bonus.key]: value === '' ? undefined : Number(value),
                            });
                        }}
                        className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                </div>
            ))}
        </div>
    </div>
);

const RewardsStep: React.FC<{
    rewards: TemplateReward[];
    onAdd: () => void;
    onUpdate: (id: string, updates: Partial<TemplateReward>) => void;
    onDelete: (id: string) => void;
}> = ({ rewards, onAdd, onUpdate, onDelete }) => {
    const handleImageUpload = (id: string, file?: File) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            onUpdate(id, { imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Rewards</p>
                <h3 className="text-lg font-black text-slate-900">What Customers Can Redeem</h3>
            </div>
            <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl">
                Step 3
            </div>
            <button
                onClick={onAdd}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2"
            >
                <Plus size={14} /> Add Reward
            </button>
        </div>
        <GuidanceCards
            cards={[
                { title: 'Start Simple', body: 'Add 1-2 rewards that are easy to redeem.' },
                { title: 'Balance Costs', body: 'Use point cost to protect margins while staying attractive.' },
                { title: 'Set Validity', body: 'Encourage return visits with shorter validity windows.' },
            ]}
        />
        <div className="space-y-3">
            {rewards.length === 0 && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Add rewards to complete this template.
                </div>
            )}
            {rewards.map((reward) => (
                <div key={reward.id} className="p-4 border border-slate-200 rounded-xl bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Reward</span>
                            <Tooltip content="Rewards are copied to business catalogs when a template is applied.">
                                <Info className="w-3 h-3 text-slate-300" />
                            </Tooltip>
                        </div>
                        <button
                            onClick={() => onDelete(reward.id)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            { label: 'Reward Name', key: 'name', placeholder: 'Reward name', tip: 'Short title customers will see.' },
                            { label: 'Point Cost', key: 'pointCost', placeholder: 'Points', tip: 'Points required to redeem this reward.' },
                            { label: 'Validity Days', key: 'validityDays', placeholder: 'Validity days', tip: 'How long the reward is valid once earned.' },
                        ].map((field) => (
                            <div key={field.key} className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    {field.label}
                                    <Tooltip content={field.tip}>
                                        <Info className="w-3 h-3 text-slate-300" />
                                    </Tooltip>
                                </label>
                                <input
                                    value={
                                        field.key === 'name'
                                            ? (reward[field.key as keyof TemplateReward] as string) || ''
                                            : (reward[field.key as keyof TemplateReward] as number | undefined) ?? ''
                                    }
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        onUpdate(
                                            reward.id,
                                            {
                                                [field.key]:
                                                    field.key === 'name'
                                                        ? value
                                                        : value === ''
                                                            ? undefined
                                                            : Number(value),
                                            } as Partial<TemplateReward>
                                        );
                                    }}
                                    type={field.key === 'name' ? 'text' : 'number'}
                                    className="h-10 px-3 border border-slate-200 rounded-lg font-bold text-slate-900"
                                    placeholder={field.placeholder}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            Description
                            <Tooltip content="Explain the reward clearly for customers.">
                                <Info className="w-3 h-3 text-slate-300" />
                            </Tooltip>
                        </label>
                        <input
                            value={reward.description}
                            onChange={(e) => onUpdate(reward.id, { description: e.target.value })}
                            className="h-10 px-3 border border-slate-200 rounded-lg font-medium text-slate-700"
                            placeholder="Reward description"
                        />
                    </div>
                    <div className="mt-3 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            Reward Image
                            <Tooltip content="Upload a reward image. This is saved as a preview in the template.">
                                <Info className="w-3 h-3 text-slate-300" />
                            </Tooltip>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                            <label className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-black uppercase tracking-widest text-slate-600 cursor-pointer hover:bg-slate-50">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(reward.id, e.target.files?.[0])}
                                />
                                Upload Image
                            </label>
                            <div className="w-full sm:w-28 h-16 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                                {reward.imageUrl ? (
                                    <img
                                        src={reward.imageUrl}
                                        alt={`${reward.name} preview`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Preview</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
    );
};

const DeleteConfirmModal: React.FC<{
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ open, onCancel, onConfirm }) =>
    open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Delete</p>
                        <h3 className="text-lg font-black text-slate-900">Delete this template?</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            This will remove the template from the business template list.
                        </p>
                    </div>
                    <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    ) : null;

export const LoyaltyTemplateManager: React.FC<LoyaltyTemplateManagerProps> = ({
    templates,
    onCreate,
    onUpdate,
    onDelete,
}) => {
    const [activeId, setActiveId] = useState<string | null>(templates[0]?.id ?? null);
    const [localDraft, setLocalDraft] = useState<LoyaltyTemplate | null>(null);
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [viewType, setViewType] = useState<TemplateView>('grid');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [screenMode, setScreenMode] = useState<ScreenMode>('list');
    const pageSize = 6;

    const filteredTemplates = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return templates;
        return templates.filter((t: LoyaltyTemplate) =>
            `${t.name} ${t.description || ''}`.toLowerCase().includes(q)
        );
    }, [templates, query]);

    const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const pageTemplates = filteredTemplates.slice(pageStart, pageStart + pageSize);

    const goPrevPage = () => setPage((p) => Math.max(1, p - 1));
    const goNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

    const activeTemplate = useMemo(() => {
        if (localDraft) return localDraft;
        return templates.find((t: LoyaltyTemplate) => t.id === activeId) || null;
    }, [templates, activeId, localDraft]);

    const startNew = () => {
        const now = new Date().toISOString();
        setLocalDraft({
            id: `tmpl-${Math.random().toString(36).slice(2, 8)}`,
            name: '',
            description: '',
            status: 'draft',
            rewards: [],
            rules: emptyRules,
            createdAt: now,
        });
        setActiveId(null);
        setCurrentStep(1);
        setScreenMode('builder');
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setPage(1);
    };

    const updateDraft = (updates: Partial<LoyaltyTemplate>) => {
        if (!activeTemplate) return;
        const next = { ...activeTemplate, ...updates };
        if (localDraft) {
            setLocalDraft(next);
        } else {
            onUpdate(activeTemplate.id, updates);
        }
    };

    const handleSave = () => {
        if (!activeTemplate) return;
        if (localDraft) {
            onCreate(activeTemplate);
            setLocalDraft(null);
            setActiveId(activeTemplate.id);
            notify.success('Template created');
        } else {
            onUpdate(activeTemplate.id, activeTemplate);
            notify.success('Template updated');
        }
        setScreenMode('list');
    };

    const handleRewardUpdate = (id: string, updates: Partial<TemplateReward>) => {
        if (!activeTemplate) return;
        const nextRewards = activeTemplate.rewards.map((r: TemplateReward) => (r.id === id ? { ...r, ...updates } : r));
        updateDraft({ rewards: nextRewards });
    };

    const handleRewardAdd = () => {
        if (!activeTemplate) return;
        const nextReward: TemplateReward = {
            id: `reward-${Math.random().toString(36).slice(2, 8)}`,
            name: 'New Reward',
            description: 'Describe the reward.',
            rewardType: 'free_item',
            pointCost: 100,
            value: 0,
            validityDays: 30,
            usageLimitPerUser: 1,
            totalAvailable: 0,
            isActive: true,
        };
        updateDraft({ rewards: [...activeTemplate.rewards, nextReward] });
    };

    const handleRewardDelete = (id: string) => {
        if (!activeTemplate) return;
        updateDraft({ rewards: activeTemplate.rewards.filter((r: TemplateReward) => r.id !== id) });
    };

    const handleDeleteTemplate = (id: string) => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = () => {
        if (!confirmDeleteId) return;
        onDelete(confirmDeleteId);
        if (activeId === confirmDeleteId) {
            setActiveId(null);
        }
        setConfirmDeleteId(null);
        notify.success('Template deleted');
    };

    const goNext = () => setCurrentStep((prev) => (prev < 3 ? (prev + 1) as Step : prev));
    const goPrev = () => setCurrentStep((prev) => (prev > 1 ? (prev - 1) as Step : prev));

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-black text-slate-900">Loyalty Templates</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                        Build reusable reward + earning rule blueprints for businesses
                    </p>
                </div>
                <button
                    onClick={startNew}
                    className="px-5 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <Plus size={14} /> New Template
                </button>
            </div>

            {screenMode === 'list' && (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                value={query}
                                onChange={(e) => handleQueryChange(e.target.value)}
                                placeholder="Search templates..."
                                className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setViewType('grid')}
                                className={cn(
                                    "h-9 rounded-xl border text-xs font-black uppercase tracking-widest",
                                    viewType === 'grid' ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-500"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <LayoutTemplate size={14} /> Grid
                                </div>
                            </button>
                            <button
                                onClick={() => setViewType('list')}
                                className={cn(
                                    "h-9 rounded-xl border text-xs font-black uppercase tracking-widest",
                                    viewType === 'list' ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-500"
                                )}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <LayoutList size={14} /> List
                                </div>
                            </button>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Showing {filteredTemplates.length === 0 ? 0 : Math.min(pageStart + 1, filteredTemplates.length)}-
                            {Math.min(pageStart + pageSize, filteredTemplates.length)} of {filteredTemplates.length}
                        </div>
                    </div>

                    {viewType === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {pageTemplates.length === 0 ? (
                                <div className="col-span-full border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    No templates found.
                                </div>
                            ) : (
                                pageTemplates.map((template) => (
                                    <TemplateListItem
                                        key={template.id}
                                        template={template}
                                        isActive={activeId === template.id && !localDraft}
                                        onSelect={() => {
                                            setLocalDraft(null);
                                            setActiveId(template.id);
                                            setCurrentStep(1);
                                            setScreenMode('builder');
                                        }}
                                        onDelete={() => handleDeleteTemplate(template.id)}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
                                <div className="col-span-5">Template</div>
                                <div className="col-span-2">Rule</div>
                                <div className="col-span-2">Rewards</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-1 text-right">Action</div>
                            </div>
                            {pageTemplates.length === 0 ? (
                                <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    No templates found.
                                </div>
                            ) : (
                                pageTemplates.map((template) => (
                                    <TemplateListRow
                                        key={template.id}
                                        template={template}
                                        isActive={activeId === template.id && !localDraft}
                                        onSelect={() => {
                                            setLocalDraft(null);
                                            setActiveId(template.id);
                                            setCurrentStep(1);
                                            setScreenMode('builder');
                                        }}
                                        onDelete={() => handleDeleteTemplate(template.id)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <button
                            onClick={goPrevPage}
                            disabled={page === 1}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Page {page} of {totalPages}
                        </div>
                        <button
                            onClick={goNextPage}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {screenMode === 'builder' && (
                <div className="space-y-6">
                    {!activeTemplate ? (
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                            <BookOpen className="w-10 h-10 mx-auto mb-3" />
                            <p className="text-sm font-bold uppercase tracking-widest">Select a template to edit</p>
                        </div>
                    ) : (
                        <>
                            <StepNavigator
                                currentStep={currentStep}
                                onStepChange={setCurrentStep}
                                onSave={handleSave}
                                onBack={() => setScreenMode('list')}
                            />

                            {currentStep === 1 && (
                                <CoreDetailsStep template={activeTemplate} onChange={updateDraft} />
                            )}

                            {currentStep === 2 && (
                                <EarningRulesStep
                                    template={activeTemplate}
                                    onRulesChange={(rules) => updateDraft({ rules })}
                                />
                            )}

                            {currentStep === 3 && (
                                <RewardsStep
                                    rewards={activeTemplate.rewards}
                                    onAdd={handleRewardAdd}
                                    onUpdate={handleRewardUpdate}
                                    onDelete={handleRewardDelete}
                                />
                            )}

                            <div className="flex items-center justify-between">
                                <button
                                    onClick={goPrev}
                                    disabled={currentStep === 1}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={goNext}
                                    disabled={currentStep === 3}
                                    className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-60"
                                >
                                    Next
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setScreenMode('list')}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl"
                                >
                                    Back to Templates
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <DeleteConfirmModal
                open={!!confirmDeleteId}
                onCancel={() => setConfirmDeleteId(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

