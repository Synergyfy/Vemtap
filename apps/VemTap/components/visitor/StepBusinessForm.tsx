import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { presets } from './presets';
import { BusinessForm } from '@/store/useBusinessFormsStore';

interface StepBusinessFormProps {
    form: BusinessForm;
    onComplete: (answers: Record<string, any>) => void;
    onSkip: () => void;
}

export const StepBusinessForm: React.FC<StepBusinessFormProps> = ({ form, onComplete, onSkip }) => {
    const [answers, setAnswers] = useState<Record<string, any>>({});

    const requiredMissing = useMemo(() => {
        return form.fields.some((field) => {
            if (!field.required) return false;
            const value = answers[field.id];
            if (field.type === 'choice') return !value;
            if (field.type === 'rating') return !value;
            return !String(value || '').trim();
        });
    }, [answers, form.fields]);

    const updateAnswer = (fieldId: string, value: any) => {
        setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    };

    return (
        <motion.div
            key={`dynamic-form-${form.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={presets.card}
        >
            <div className="flex items-center justify-between mb-6">
                <span className={presets.tag}>{form.type.toUpperCase()} FORM</span>
                <button
                    onClick={onSkip}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                >
                    Skip
                </button>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">{form.title}</h2>

            <div className="space-y-5 text-left">
                {form.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                            {field.label}
                            {field.required ? ' *' : ''}
                        </label>

                        {(field.type === 'short_text' || field.type === 'email' || field.type === 'phone' || field.type === 'url') && (
                            <input
                                type={field.type === 'short_text' ? 'text' : field.type}
                                value={answers[field.id] || ''}
                                onChange={(e) => updateAnswer(field.id, e.target.value)}
                                className="w-full h-12 p-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none text-sm font-medium"
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                        )}

                        {field.type === 'long_text' && (
                            <textarea
                                value={answers[field.id] || ''}
                                onChange={(e) => updateAnswer(field.id, e.target.value)}
                                className="w-full min-h-24 p-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none text-sm font-medium"
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                        )}

                        {field.type === 'choice' && (
                            <div className="space-y-2">
                                {(field.options || []).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => updateAnswer(field.id, option)}
                                        className={`w-full p-3 rounded-xl border text-left text-sm font-bold transition-all ${answers[field.id] === option
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-gray-100 bg-gray-50 text-slate-700 hover:border-primary/30'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}

                        {field.type === 'rating' && (
                            <div className="flex justify-between gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                        key={rating}
                                        onClick={() => updateAnswer(field.id, rating)}
                                        className={`flex-1 h-11 rounded-xl border font-black transition-all ${answers[field.id] === rating
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-gray-50 text-slate-500 border-gray-100 hover:border-primary/30'
                                            }`}
                                    >
                                        {rating}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={() => onComplete(answers)}
                disabled={requiredMissing}
                className={`${presets.button} mt-8 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                Submit Form
            </button>
        </motion.div>
    );
};
