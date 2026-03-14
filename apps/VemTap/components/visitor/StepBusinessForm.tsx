import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { presets } from './presets';

type PreviewField = {
    id?: string;
    type: string;
    question?: string;
    label?: string;
    options?: string[];
    isRequired?: boolean;
    required?: boolean;
    order?: number;
};

type PreviewForm = {
    id: string;
    title: string;
    description?: string;
    instructions?: string;
    type?: string;
    typeLabel?: string;
    businessName?: string;
    businessLogo?: string;
    branchName?: string;
    redirectLabel?: string;
    redirectUrl?: string;
    successTitle?: string;
    successMessage?: string;
    fields: PreviewField[];
};

interface StepBusinessFormProps {
    form: PreviewForm;
    onComplete: (answers: Record<string, any>) => void;
    onSkip: () => void;
    /** When true, hides the internal branding header, title, and description (used when the parent page renders its own header) */
    hideHeader?: boolean;
    brandColor?: string;
}

export const StepBusinessForm: React.FC<StepBusinessFormProps> = ({ form, onComplete, onSkip, hideHeader = false, brandColor = '#2563eb' }) => {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const normalizedFields = useMemo(
        () =>
            [...(form.fields || [])]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((field, index) => ({
                    ...field,
                    key: field.id || `field-${index}`,
                    label: field.question || field.label || `Question ${index + 1}`,
                })),
        [form.fields]
    );

    const requiredMissing = useMemo(() => {
        return normalizedFields.some((field) => {
            if (!(field.isRequired || field.required)) return false;
            const value = answers[field.key];
            if (field.type === 'radio' || field.type === 'select') return !value;
            if (field.type === 'checkbox') return !Array.isArray(value) || value.length === 0;
            return !String(value || '').trim();
        });
    }, [answers, normalizedFields]);

    const updateAnswer = (fieldKey: string, value: any) => {
        setAnswers((prev) => ({ ...prev, [fieldKey]: value }));
    };

    return (
        <motion.div
            key={`dynamic-form-${form.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={hideHeader ? '' : presets.card}
        >
            {isSubmitted ? (
                <div className="py-12 flex flex-col items-center text-center">
                    <div className="size-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{form.successTitle || "Form Submitted"}</h2>
                    <p className="text-sm text-slate-500 mt-4 mb-8 leading-relaxed max-w-[240px] mx-auto">
                        {form.successMessage || "Thank you for sharing your experience with us."}
                    </p>
                    <button
                        onClick={onSkip}
                        className={presets.button}
                        style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}44` }}
                    >
                        Close
                    </button>
                </div>
            ) : (
                <>
                    {!hideHeader && (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <span className={presets.tag} style={{ color: brandColor }}>BUSINESS FORM</span>
                        <button
                            onClick={onSkip}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                        >
                            Skip
                        </button>
                    </div>

                    <div 
                        className="mb-4 rounded-2xl border text-white p-2.5 flex items-center justify-between gap-2 overflow-hidden"
                        style={{ backgroundColor: brandColor, borderColor: `${brandColor}dd` }}
                    >
                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                            <div className="size-8 rounded-full bg-white border border-white/30 overflow-hidden flex items-center justify-center shrink-0">
                                {form.businessLogo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={form.businessLogo} alt={form.businessName || form.title} className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 className="size-4 text-slate-900" />
                                )}
                            </div>
                            <div className="min-w-0 overflow-hidden">
                                <p className="text-[8px] font-bold uppercase tracking-wider text-white/60">Business</p>
                                <p className="text-xs font-bold text-white truncate">{form.businessName || 'Business'}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0 max-w-[40%]">
                            <p className="text-[8px] font-bold uppercase tracking-wider text-white/60">Branch</p>
                            <p className="text-[11px] font-semibold text-white truncate">{form.branchName || 'Main Branch'}</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4 leading-tight">{form.title}</h2>
                    {form.description ? <p className="text-sm text-slate-500 mb-4">{form.description}</p> : null}
                </>
            )}
            {form.instructions ? (
                <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                    {form.instructions}
                </div>
            ) : null}

            <div className="space-y-5 text-left">
                {normalizedFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                            {field.label}
                            {field.isRequired || field.required ? ' *' : ''}
                        </label>

                        {(field.type === 'text' || field.type === 'number' || field.type === 'date') && (
                            <input
                                type={field.type === 'text' ? 'text' : field.type}
                                value={answers[field.key] || ''}
                                onChange={(e) => updateAnswer(field.key, e.target.value)}
                                className="w-full h-12 p-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none text-sm font-medium transition-all"
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                        )}

                        {field.type === 'date-no-year' && (
                            <div className="flex gap-2">
                                <select
                                    value={(answers[field.key] || '').split('-')[0] || ''}
                                    onChange={(e) => {
                                        const day = (answers[field.key] || '').split('-')[1] || '';
                                        updateAnswer(field.key, e.target.value ? `${e.target.value}-${day}` : '');
                                    }}
                                    className="flex-1 h-12 px-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                                >
                                    <option value="">Month</option>
                                    {[
                                        'January', 'February', 'March', 'April', 'May', 'June',
                                        'July', 'August', 'September', 'October', 'November', 'December'
                                    ].map((m, i) => (
                                        <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={(answers[field.key] || '').split('-')[1] || ''}
                                    onChange={(e) => {
                                        const month = (answers[field.key] || '').split('-')[0] || '';
                                        updateAnswer(field.key, month ? `${month}-${e.target.value}` : '');
                                    }}
                                    className="flex-1 h-12 px-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                                >
                                    <option value="">Day</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                        <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {field.type === 'textarea' && (
                            <textarea
                                value={answers[field.key] || ''}
                                onChange={(e) => updateAnswer(field.key, e.target.value)}
                                className="w-full min-h-24 p-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none text-sm font-medium"
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                        )}

                        {(field.type === 'radio' || field.type === 'select') && (
                            <div className="space-y-2">
                                {(field.options || []).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => updateAnswer(field.key, option)}
                                        className={`w-full p-3 rounded-xl border text-left text-sm font-bold transition-all ${
                                            answers[field.key] === option
                                                ? 'bg-white shadow-sm'
                                                : 'border-gray-100 bg-gray-50 text-slate-700 hover:border-gray-200'
                                        }`}
                                        style={answers[field.key] === option ? { borderColor: brandColor, color: brandColor } : {}}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}

                        {field.type === 'checkbox' && (
                            <div className="space-y-2">
                                {(field.options || []).map((option) => {
                                    const selectedOptions: string[] = Array.isArray(answers[field.key]) ? answers[field.key] : [];
                                    const isChecked = selectedOptions.includes(option);
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => {
                                                const next = isChecked
                                                    ? selectedOptions.filter((item) => item !== option)
                                                    : [...selectedOptions, option];
                                                updateAnswer(field.key, next);
                                            }}
                                            className={`w-full p-3 rounded-xl border text-left text-sm font-bold transition-all ${
                                                isChecked
                                                    ? 'bg-white shadow-sm'
                                                    : 'border-gray-100 bg-gray-50 text-slate-700 hover:border-gray-200'
                                            }`}
                                            style={isChecked ? { borderColor: brandColor, color: brandColor } : {}}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={() => {
                    setIsSubmitted(true);
                    onComplete(answers);
                }}
                disabled={requiredMissing}
                className={`${presets.button} mt-8 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={!requiredMissing ? { backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}44` } : {}}
            >
                Submit Form
            </button>

            {form.redirectLabel || form.redirectUrl ? (
                <p className="mt-3 text-center text-[11px] font-medium text-slate-400">
                    After submit, customers continue to {form.redirectLabel || form.redirectUrl}.
                </p>
            ) : null}
                </>
            )}
        </motion.div>
    );
};