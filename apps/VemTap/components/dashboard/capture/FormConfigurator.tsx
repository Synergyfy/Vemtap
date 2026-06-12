'use client';

import React from 'react';
import { 
    User, Phone, Mail, Cake, Users2, Heart, 
    Lock, Info, Check, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { useCustomerCaptureStore, FormConfig } from '@/store/useCustomerCaptureStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function FormConfigurator() {
    const { formConfig, updateFormConfig, setStep } = useCustomerCaptureStore();

    const toggleField = (field: keyof FormConfig['fields']) => {
        // Locked fields cannot be toggled
        if (['name', 'phone', 'email'].includes(field)) return;
        
        updateFormConfig({
            fields: {
                ...formConfig.fields,
                [field]: !formConfig.fields[field]
            }
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Customer Registration Form</h1>
                <p className="mt-2 text-sm font-medium text-gray-500">Choose what information customers should provide when they scan.</p>
            </div>

            {/* Form Builder Section */}
            <div className="space-y-6">
                {/* Required Fields */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Required Fields</h3>
                        <Badge variant="outline" className="text-[9px] font-black border-blue-100 text-blue-600 bg-blue-50">Always Enabled</Badge>
                    </div>

                    <div className="space-y-3">
                        {[
                            { id: 'name', label: 'Full Name', icon: User },
                            { id: 'phone', label: 'Phone Number', icon: Phone },
                            { id: 'email', label: 'Email Address', icon: Mail },
                        ].map((field) => (
                            <div key={field.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 opacity-60">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl text-gray-400">
                                        <field.icon size={18} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-900">{field.label}</span>
                                </div>
                                <Lock size={14} className="text-gray-400 mr-2" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Optional Fields */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Optional Fields</h3>
                        <p className="text-[10px] font-bold text-gray-400">Enable to collect more data</p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { id: 'birthday', label: 'Birthday', icon: Cake, desc: 'Send birthday promotions later.' },
                            { id: 'gender', label: 'Gender', icon: Users2, desc: 'Understand your audience better.' },
                            { id: 'interests', label: 'Interests', icon: Heart, desc: 'Send personalized offers.' },
                        ].map((field) => (
                            <button 
                                key={field.id}
                                onClick={() => toggleField(field.id as any)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
                                    formConfig.fields[field.id as keyof FormConfig['fields']] 
                                        ? "bg-blue-50/50 border-blue-100" 
                                        : "bg-white border-gray-100 hover:border-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-xl transition-all",
                                        formConfig.fields[field.id as keyof FormConfig['fields']] 
                                            ? "bg-[#066CF4] text-white" 
                                            : "bg-gray-50 text-gray-400"
                                    )}>
                                        <field.icon size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-900">{field.label}</p>
                                        <p className="text-[10px] text-gray-500">{field.desc}</p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "h-6 w-12 rounded-full transition-all relative",
                                    formConfig.fields[field.id as keyof FormConfig['fields']] ? "bg-[#066CF4]" : "bg-gray-200"
                                )}>
                                    <div className={cn(
                                        "absolute top-1 size-4 rounded-full bg-white transition-all",
                                        formConfig.fields[field.id as keyof FormConfig['fields']] ? "left-7" : "left-1"
                                    )} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Consent & Privacy */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <ShieldCheck size={18} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Consent & Privacy</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Consent Checkbox Text</label>
                            <textarea 
                                value={formConfig.consentText}
                                onChange={(e) => updateFormConfig({ consentText: e.target.value })}
                                className="w-full min-h-[80px] rounded-2xl bg-gray-50 border-none p-4 text-xs font-bold text-gray-900 resize-none focus:ring-2 focus:ring-[#066CF4]/20 transition-all"
                            />
                        </div>
                        
                        <div className="p-4 rounded-2xl bg-blue-50/30 border border-blue-50 flex gap-3">
                            <Info size={16} className="text-[#066CF4] shrink-0 mt-0.5" />
                            <p className="text-[10px] font-medium text-gray-600 leading-relaxed">
                                Customer information is securely stored and managed according to global data protection and privacy regulations.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-4 flex gap-4">
                <Button 
                    variant="ghost"
                    onClick={() => setStep(3)}
                    className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                    Back
                </Button>
                <Button 
                    onClick={() => setStep(5)}
                    className="h-14 flex-[2] rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20"
                >
                    Preview Experience
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
