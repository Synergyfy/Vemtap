'use client';

import React, { useRef, useState } from 'react';
import { useProductFormStore } from '@/store/useProductFormStore';
import { Upload, X, Plus, Info, Image as ImageIcon, Trash2, GripVertical, ArrowRight, Video, Link as LinkIcon, Play } from 'lucide-react';

export default function StepMedia() {
    const { formData, updateFormData, nextStep, prevStep } = useProductFormStore();
    const primaryInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'primary' | 'side' | 'detail' | 'packaging') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            updateFormData({
                images: { ...formData.images, [type]: { file, url } }
            });
        }
    };


    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            updateFormData({
                video: { ...formData.video, file: file, url: URL.createObjectURL(file) }
            });
        }
    };

    const addSpec = () => {
        const newSpec = { id: Date.now().toString(), label: '', value: '' };
        updateFormData({ specs: [...formData.specs, newSpec] });
    };

    const removeSpec = (id: string) => {
        const newSpecs = formData.specs.filter(s => s.id !== id);
        updateFormData({ specs: newSpecs });
    };

    const updateSpec = (id: string, field: 'label' | 'value', value: string) => {
        const newSpecs = formData.specs.map(s => s.id === id ? { ...s, [field]: value } : s);
        updateFormData({ specs: newSpecs });
    };

    return (
        <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8">
                <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl border border-gray-100 h-full">
                    {/* Image Upload Section */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold font-display text-text-main">Product Images</h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-wider">JPG, PNG, WEBP</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Primary Image */}
                            <div className="md:col-span-2">
                                <div
                                    onClick={() => primaryInputRef.current?.click()}
                                    className="group relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary/30 transition-all overflow-hidden"
                                >
                                    {formData.images.primary.url ? (
                                        <img src={formData.images.primary.url} alt="Primary" className="w-full h-full object-contain p-4" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                            <div className="size-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Upload size={28} />
                                            </div>
                                            <p className="mb-2 text-sm text-text-main font-bold">Primary Image</p>
                                            <p className="text-xs text-text-secondary">Drag & drop or click to upload</p>
                                        </div>
                                    )}
                                    <input
                                        ref={primaryInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'primary')}
                                    />
                                </div>
                            </div>

                            {/* Secondary Images - Column */}
                            <div className="flex flex-col gap-6 h-80">
                                {(['side', 'detail', 'packaging'] as const).map((type) => (
                                    <label key={type} className="flex-1 relative flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-primary/30 transition-all overflow-hidden">
                                        {formData.images[type].url ? (
                                            <img src={formData.images[type].url} alt={type} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center">
                                                <Plus size={20} className="text-gray-300 mb-1" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{type}</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, type)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>


                    {/* Video Section */}
                    <div className="mb-12 border-t border-gray-100 pt-12">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold font-display text-text-main">Product Video</h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-wider">MP4, WEBM</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Video Upload */}
                            <div
                                onClick={() => videoInputRef.current?.click()}
                                className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-primary/30 transition-all overflow-hidden"
                            >
                                {formData.video.file ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                        <Video size={48} className="text-primary mb-2" />
                                        <p className="text-sm font-bold text-text-main">{formData.video.file.name}</p>
                                        <p className="text-xs text-text-secondary">{(formData.video.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateFormData({ video: { ...formData.video, file: null } });
                                            }}
                                            className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                        <div className="size-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Video size={28} />
                                        </div>
                                        <p className="mb-2 text-sm text-text-main font-bold">Upload Video</p>
                                        <p className="text-xs text-text-secondary">Drag & drop or click</p>
                                    </div>
                                )}
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="video/*"
                                    onChange={handleVideoFileChange}
                                />
                            </div>

                            {/* Video Settings */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-2">Video Link (Optional)</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="url"
                                            placeholder="https://youtube.com/..."
                                            value={formData.video.url}
                                            onChange={(e) => updateFormData({ video: { ...formData.video, url: e.target.value } })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-sm"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Used if no video file is uploaded.</p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-gray-500">
                                            <Play size={18} fill="currentColor" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-main">Autoplay</p>
                                            <p className="text-xs text-text-secondary">Play video automatically on load</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.video.autoplay}
                                            onChange={(e) => updateFormData({ video: { ...formData.video, autoplay: e.target.checked } })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specifications Section */}
                    <div>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold font-display text-text-main">Technical Specifications</h3>
                                <p className="text-sm text-text-secondary mt-1 font-medium">Add key-value pairs for product details.</p>
                            </div>
                            <button
                                onClick={addSpec}
                                className="text-primary hover:text-primary-hover font-bold text-sm flex items-center gap-1 bg-primary/5 px-4 py-2 rounded-xl transition-colors"
                            >
                                <Plus size={16} />
                                Add Field
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.specs.map((spec, index) => (
                                <div key={spec.id} className="flex gap-4 items-center group animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <div className="w-8 flex items-center justify-center text-gray-300 cursor-move">
                                        <GripVertical size={20} />
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Label</label>
                                            <input
                                                type="text"
                                                value={spec.label}
                                                onChange={(e) => updateSpec(spec.id, 'label', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-text-main focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder-gray-300"
                                                placeholder="e.g. Dimensions"
                                            />
                                        </div>
                                        <div className="relative">
                                            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Value</label>
                                            <input
                                                type="text"
                                                value={spec.value}
                                                onChange={(e) => updateSpec(spec.id, 'value', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-text-main focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder-gray-300"
                                                placeholder="e.g. 120mm x 80mm"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeSpec(spec.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            {formData.specs.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl text-gray-300">
                                    No specifications added. Click "Add Field" to start.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Preview */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white/50 backdrop-blur-xl p-8 rounded-xl sticky top-6 shadow-xl space-y-8 border border-white">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <div className="flex gap-3 items-start">
                            <Info className="text-blue-600 mt-0.5 shrink-0" size={18} />
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm mb-1">Image Guidelines</h4>
                                <ul className="text-xs text-blue-800/80 space-y-1 list-disc list-inside font-medium">
                                    <li>High-resolution (min 1000px)</li>
                                    <li>White background preferred</li>
                                    <li>Max 5MB per image</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-text-main mb-4 text-xs uppercase tracking-widest">Live Preview</h4>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 opacity-80">
                            <div className="aspect-4/3 bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                {formData.images.primary.url ? (
                                    <img src={formData.images.primary.url} className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon className="text-gray-300" size={48} />
                                )}
                            </div>
                            <div className="h-4 w-3/4 bg-gray-100 rounded mb-2"></div>
                            <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-3 font-bold uppercase tracking-widest">Minimal Preview</p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={nextStep}
                            className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mb-3"
                        >
                            Next: Pricing
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={prevStep}
                            className="w-full bg-white hover:bg-gray-50 text-text-secondary py-3 rounded-full font-bold border border-gray-200 transition-colors text-sm"
                        >
                            Back to Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
