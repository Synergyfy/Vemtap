'use client';

import React from 'react';
import { useProductFormStore } from '@/store/useProductFormStore';
import { Factory, QrCode, ArrowRight, Save, Plus, Trash2, GripVertical, ListOrdered } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api/admin';

export default function StepDetails() {
    const { formData, updateFormData, nextStep } = useProductFormStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateFormData({ [name]: value });
    };

    const addStep = () => {
        const newStep = { id: Date.now().toString(), title: '', description: '' };
        updateFormData({ howToSteps: [...formData.howToSteps, newStep] });
    };

    const removeStep = (id: string) => {
        updateFormData({ howToSteps: formData.howToSteps.filter(s => s.id !== id) });
    };

    const updateStep = (id: string, field: 'title' | 'description', value: string) => {
        const newSteps = formData.howToSteps.map(s => s.id === id ? { ...s, [field]: value } : s);
        updateFormData({ howToSteps: newSteps });
    };

    const { data: types } = useQuery({
        queryKey: ['admin-product-types'],
        queryFn: () => adminProductsApi.getAllTypes(),
    });

    return (
        <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8">
                <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl border border-gray-100 h-full relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold font-display text-text-main mb-8">Basic Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-text-secondary mb-2" htmlFor="title">Product Title</label>
                                <input
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-text-main placeholder-gray-400"
                                    id="title"
                                    name="title"
                                    placeholder="e.g. GoToTags NFC Reader"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-text-secondary mb-2" htmlFor="manufacturer">Manufacturer</label>
                                <div className="relative">
                                    <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <select
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-text-main appearance-none cursor-pointer"
                                        id="manufacturer"
                                        name="manufacturer"
                                        value={formData.manufacturer}
                                        onChange={handleChange}
                                    >
                                        <option value="" disabled>Select Manufacturer</option>
                                        <option value="entryconnect">EntryConnect</option>
                                        <option value="hid">HID Global</option>
                                        <option value="gototags">GoToTags</option>
                                        <option value="rfideas">rf IDEAS</option>
                                    </select>
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-text-secondary mb-2" htmlFor="sku">SKU</label>
                                <div className="relative">
                                    <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-text-main placeholder-gray-400 font-mono tracking-wide"
                                        id="sku"
                                        name="sku"
                                        placeholder="EC-XXX-00"
                                        type="text"
                                        value={formData.sku}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-text-secondary mb-2" htmlFor="category">Category</label>
                                <select
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-text-main appearance-none cursor-pointer"
                                    id="productTypeId"
                                    name="productTypeId"
                                    value={formData.productTypeId}
                                    onChange={(e) => {
                                        const selectedType = types?.find((t: any) => t.id === e.target.value);
                                        updateFormData({
                                            productTypeId: e.target.value,
                                            category: selectedType?.name || ''
                                        });
                                    }}
                                >
                                    <option value="" disabled>Select Category</option>
                                    {types?.map((type: any) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                    {(!types || types.length === 0) && (
                                        <option value="">No Categories Available</option>
                                    )}
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-text-secondary mb-2" htmlFor="tag">Promo Tag</label>
                                <input
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-text-main placeholder-gray-400"
                                    id="tag"
                                    name="tag"
                                    placeholder="e.g. New Arrival"
                                    type="text"
                                    value={formData.tag}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-text-secondary mb-2" htmlFor="tagColor">Tag Color Class</label>
                                <select
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-text-main appearance-none cursor-pointer"
                                    id="tagColor"
                                    name="tagColor"
                                    value={formData.tagColor}
                                    onChange={handleChange}
                                >
                                    <option value="bg-primary">Primary (Orange)</option>
                                    <option value="bg-blue-600">Blue</option>
                                    <option value="bg-green-600">Green</option>
                                    <option value="bg-slate-900">Black</option>
                                    <option value="bg-red-600">Red</option>
                                </select>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-text-secondary mb-2" htmlFor="description">Description</label>
                                <textarea
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-sans text-text-main placeholder-gray-400 resize-none"
                                    id="description"
                                    name="description"
                                    placeholder="Describe the product features, compatibility, and use cases..."
                                    rows={6}
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                                <p className="text-right text-xs text-gray-400 mt-2">{formData.description.length}/2000 characters</p>
                            </div>
                        </div>

                        {/* How-to Steps Section */}
                        <div className="mt-12 pt-12 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-bold font-display text-text-main">How to Use</h3>
                                    <p className="text-sm text-text-secondary mt-1 font-medium">Add step-by-step instructions for the user.</p>
                                </div>
                                <button
                                    onClick={addStep}
                                    className="text-primary hover:text-primary-hover font-bold text-sm flex items-center gap-1 bg-primary/5 px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Plus size={16} />
                                    Add Step
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.howToSteps?.map((step, index) => (
                                    <div key={step.id} className="flex gap-4 items-start group animate-in slide-in-from-bottom-2 fade-in duration-300">
                                        <div className="w-8 pt-4 flex items-center justify-center text-gray-300 cursor-move">
                                            <span className="font-bold text-sm bg-gray-100 size-6 rounded-full flex items-center justify-center text-gray-500">{index + 1}</span>
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-primary/20 transition-colors">
                                            <input
                                                type="text"
                                                value={step.title}
                                                onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-text-main focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder-gray-300"
                                                placeholder={`Step ${index + 1} Title`}
                                            />
                                            <textarea
                                                value={step.description}
                                                onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-text-secondary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder-gray-300 resize-none"
                                                placeholder="Describe this step..."
                                                rows={2}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeStep(step.id)}
                                            className="p-2 mt-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}

                                {(!formData.howToSteps || formData.howToSteps.length === 0) && (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl text-gray-300">
                                        <ListOrdered size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>No instructions added. Click "Add Step" to start.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-8">
                            <button className="text-text-secondary hover:text-text-main font-bold px-6 py-3 transition-colors flex items-center gap-2">
                                <Save size={18} />
                                Save Draft
                            </button>
                            <button
                                onClick={nextStep}
                                className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                            >
                                Next: Add Media
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Preview / Tips */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-blue-50/50 p-8 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-2">Quick Tips</h3>
                    <ul className="space-y-3 text-sm text-blue-800/80">
                        <li className="flex gap-2">
                            <span className="mt-1 block size-1.5 rounded-full bg-blue-400 shrink-0" />
                            Use a recognizable product title that includes the key feature (e.g., "NFC").
                        </li>
                        <li className="flex gap-2">
                            <span className="mt-1 block size-1.5 rounded-full bg-blue-400 shrink-0" />
                            SKUs must be unique across your organization.
                        </li>
                        <li className="flex gap-2">
                            <span className="mt-1 block size-1.5 rounded-full bg-blue-400 shrink-0" />
                            Detailed descriptions improve search visibility.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
