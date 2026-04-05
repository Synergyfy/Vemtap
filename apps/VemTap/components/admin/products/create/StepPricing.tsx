'use client';

import React from 'react';
import { useProductFormStore } from '@/store/useProductFormStore';
import { Percent, Trash2, Plus, Info, LayoutGrid, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { TbCurrencyNaira } from "react-icons/tb";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';
import { uploadToCloudinary } from '@/lib/cloudinary';

export default function StepPricing() {
    const { formData, updateFormData, nextStep, prevStep, editingProductId, setSubmissionResult } = useProductFormStore();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            // 1. Handle Image Uploads
            const imageKeys: (keyof typeof formData.images)[] = ['primary', 'side', 'detail', 'packaging'];
            const uploadPromises = imageKeys.map(async (key) => {
                const img = formData.images[key];
                if (img.file instanceof File) {
                    try {
                        return await uploadToCloudinary(img.file);
                    } catch (error) {
                        console.error(`Failed to upload ${key} image:`, error);
                        return null;
                    }
                }
                return img.url;
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const imagesArray = uploadedImages.filter((img): img is string => typeof img === 'string' && img.startsWith('http'));

            // 2. Handle Video Upload
            let videoUrl = formData.video.url;
            if (formData.video.file instanceof File) {
                try {
                    videoUrl = await uploadToCloudinary(formData.video.file);
                } catch (error) {
                    console.error('Failed to upload video:', error);
                    videoUrl = ''; // Avoid sending blob URL
                }
            } else if (videoUrl.startsWith('blob:')) {
                videoUrl = ''; // Clean up stale blob URLs
            }

            if (imagesArray.length === 0) {
                imagesArray.push('https://placehold.co/600x400/png?text=Hardware+Product');
            }

            // 3. Construct Payload
            const payload = {
                name: formData.title,
                sku: formData.sku,
                nfcType: formData.nfcType,
                description: formData.description,
                productTypeId: formData.productTypeId,
                category: formData.category,
                price: formData.msrp,
                originalPrice: formData.originalPrice,
                costPrice: formData.costPrice,
                customizationFee: formData.customizationFee,
                images: imagesArray,
                image: imagesArray[0] || 'https://placehold.co/600x400/png?text=Hardware+Product',
                tag: formData.tag,
                tagColor: formData.tagColor,
                moq: formData.volumeDiscounts[0]?.minQty || 1,
                priceTiers: formData.volumeDiscounts.map(tier => ({
                    min: tier.minQty,
                    max: Number.isFinite(tier.maxQty as number) ? tier.maxQty : null,
                    price: parseFloat((formData.msrp * (1 - tier.discountPercent / 100)).toFixed(2))
                })),
                status: 'Published',
                customBrandedCards: formData.customBrandingEnabled,
                technicalSpecifications: formData.specs.reduce((acc, spec) => {
                    if (spec.label && spec.value) {
                        acc[spec.label] = spec.value;
                    }
                    return acc;
                }, {} as Record<string, string>),
                videos: videoUrl ? [videoUrl] : [],
                howToUse: formData.howToSteps.map(step => ({
                    title: step.title,
                    description: step.description
                })),
                rating: 5, // Default rating
                requestQuoteThreshold: formData.bulkQuotesEnabled ? 100 : null
            };



            if (editingProductId) {
                return adminProductsApi.update(editingProductId, payload);
            }
            return adminProductsApi.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['admin-product-stats'] });
            setSubmissionResult('success', null);
            nextStep();
        },
        onError: (error) => {
            console.error('Operation failed:', error);
            const message = error instanceof Error
                ? error.message
                : `Failed to ${editingProductId ? 'update' : 'publish'} product. Please check your connection and try again.`;
            setSubmissionResult('error', message);
            nextStep();
            notify.error(message);
        }
    });

    const handlePublish = async () => {
        if (!formData.title || !formData.description) {
            notify.warning('Please fill in the basic product details in Step 1.');
            return;
        }
        setSubmissionResult('idle', null);
        mutation.mutate();
    };

    const handleDiscountChange = (id: string, field: 'minQty' | 'maxQty' | 'discountPercent', value: string) => {
        const normalizedValue = value.trim();
        const parsed = normalizedValue === '' ? NaN : parseInt(normalizedValue, 10);
        const newDiscounts = formData.volumeDiscounts.map((d) => {
            if (d.id !== id) return d;

            if (field === 'maxQty') {
                return { ...d, maxQty: Number.isNaN(parsed) ? (Number.NaN as unknown as number) : parsed };
            }

            if (field === 'minQty') {
                return { ...d, minQty: Number.isNaN(parsed) ? 1 : Math.max(1, parsed) };
            }

            return { ...d, discountPercent: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) };
        });

        updateFormData({ volumeDiscounts: newDiscounts });
    };

    const setTierOpenEnded = (id: string) => {
        updateFormData({
            volumeDiscounts: formData.volumeDiscounts.map((tier) =>
                tier.id === id ? { ...tier, maxQty: null } : tier
            ),
        });
    };

    const setTierFiniteMax = (id: string) => {
        updateFormData({
            volumeDiscounts: formData.volumeDiscounts.map((tier) => {
                if (tier.id !== id) return tier;
                const minQty = Number.isFinite(tier.minQty) ? tier.minQty : 1;
                return { ...tier, maxQty: Math.max(minQty, minQty + 1) };
            }),
        });
    };

    const addDiscountTier = () => {
        const newTier = { id: Date.now().toString(), minQty: 100, maxQty: null, discountPercent: 15 };
        updateFormData({ volumeDiscounts: [...formData.volumeDiscounts, newTier] });
    };

    const removeDiscountTier = (id: string) => {
        updateFormData({ volumeDiscounts: formData.volumeDiscounts.filter(d => d.id !== id) });
    };

    const calculatePrice = (discountValues: number) => {
        return (formData.msrp * (1 - discountValues / 100)).toFixed(2);
    };

    return (
        <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-7 space-y-8">
                {/* Base Pricing */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold font-display text-text-main mb-6 flex items-center gap-2">
                        <TbCurrencyNaira className="text-primary" size={24} />
                        Base Pricing
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-2">MSRP (Selling Price)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"><TbCurrencyNaira /></span>
                                <input
                                    type="number"
                                    value={formData.msrp === 0 ? '' : formData.msrp}
                                    onChange={(e) => updateFormData({ msrp: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none font-bold text-text-main text-lg transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-text-secondary mb-2">Original Price (Strike-through)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"><TbCurrencyNaira /></span>
                                <input
                                    type="number"
                                    value={formData.originalPrice === 0 ? '' : formData.originalPrice}
                                    onChange={(e) => updateFormData({ originalPrice: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none font-bold text-text-main text-lg transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-text-secondary mb-2">Cost Price (Internal Only)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"><TbCurrencyNaira /></span>
                                <input
                                    type="number"
                                    value={formData.costPrice === 0 ? '' : formData.costPrice}
                                    onChange={(e) => updateFormData({ costPrice: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none font-bold text-text-main text-lg transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-3 rounded-xl text-blue-600 shadow-sm">
                                <LayoutGrid size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-text-main text-sm">Enable Bulk Quote Requests</p>
                                <p className="text-xs text-text-secondary font-medium mt-0.5">Allow customers to request custom quotes for orders &gt; 100 units</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.bulkQuotesEnabled}
                                onChange={(e) => updateFormData({ bulkQuotesEnabled: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 p-5 bg-purple-50/50 rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-3 rounded-xl text-purple-600 shadow-sm">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-text-main text-sm">Custom Branded Cards</p>
                                    <p className="text-xs text-text-secondary font-medium mt-0.5">Enable logo printing and custom artwork for this product</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.customBrandingEnabled}
                                    onChange={(e) => updateFormData({ customBrandingEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        {formData.customBrandingEnabled && (
                            <div className="pt-4 border-t border-purple-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-purple-700">Customization Setup Fee</label>
                                    <div className="relative w-32">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-xs font-bold"><TbCurrencyNaira /></span>
                                        <input
                                            type="number"
                                            value={formData.customizationFee === 0 ? '' : formData.customizationFee}
                                            onChange={(e) => updateFormData({ customizationFee: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                            className="w-full pl-7 pr-3 py-2 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none font-bold text-text-main text-sm transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Volume Discounts */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold font-display text-text-main flex items-center gap-2">
                            <Percent className="text-primary" size={24} />
                            Volume Discounts
                        </h3>
                        <button
                            onClick={addDiscountTier}
                            className="text-sm text-primary font-bold hover:underline flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus size={16} /> Add Tier
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200">
                        <table className="w-full text-left text-sm text-text-secondary">
                            <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Quantity Range</th>
                                    <th className="px-6 py-4">Discount %</th>
                                    <th className="px-6 py-4">Unit Price</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.volumeDiscounts.map((tier) => {
                                    const isOpenEndedTier = tier.maxQty === null;
                                    return (
                                        <tr key={tier.id} className="bg-white hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-text-main">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={tier.minQty}
                                                        onChange={(e) => handleDiscountChange(tier.id, 'minQty', e.target.value)}
                                                        className="w-16 px-2 py-1 text-xs border border-gray-200 rounded font-bold text-center focus:ring-1 focus:ring-primary focus:border-primary"
                                                    />
                                                    <span className="text-gray-400">-</span>
                                                    {!isOpenEndedTier ? (
                                                        <>
                                                            <input
                                                                type="number"
                                                                value={Number.isFinite(tier.maxQty as number) ? (tier.maxQty as number) : ''}
                                                                onChange={(e) => handleDiscountChange(tier.id, 'maxQty', e.target.value)}
                                                                className="w-16 px-2 py-1 text-xs border border-gray-200 rounded font-bold text-center focus:ring-1 focus:ring-primary focus:border-primary"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setTierOpenEnded(tier.id)}
                                                                className="px-2 py-1 text-[10px] font-black rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                                                title="Set open-ended (+)"
                                                            >
                                                                +
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-xl px-2 text-gray-400">+</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setTierFiniteMax(tier.id)}
                                                                className="px-2 py-1 text-[10px] font-black rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                                title="Set numeric max"
                                                            >
                                                                Set Max
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded w-fit">
                                                    <input
                                                        type="number"
                                                        value={tier.discountPercent === 0 ? '' : tier.discountPercent}
                                                        onChange={(e) => handleDiscountChange(tier.id, 'discountPercent', e.target.value)}
                                                        className="w-10 bg-transparent text-xs font-bold text-right outline-none"
                                                    />
                                                    <span className="text-gray-400 font-bold text-xs">%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-primary inline-flex items-center gap-2">
                                                <TbCurrencyNaira /> {calculatePrice(tier.discountPercent)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => removeDiscountTier(tier.id)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-4 flex items-center gap-2 font-bold">
                        <Info size={14} />
                        Prices automatically update based on discount percentage relative to MSRP.
                    </p>
                </div>
            </div>

            {/* Sidebar / Preview */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
                <div className="bg-white rounded-xl p-8 shadow-xl border border-gray-100 sticky top-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-text-main font-display text-lg">Marketplace Preview</h3>
                        <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm shadow-green-200">Live Preview</span>
                    </div>

                    <div className="border border-gray-100 rounded-2xl overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 bg-white">
                        <div className="bg-gray-50 p-8 flex items-center justify-center relative h-64 overflow-hidden">
                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                <span className={`${formData.tagColor} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-sm`}>{formData.tag}</span>
                                <span className="bg-white/90 backdrop-blur text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-gray-100 shadow-sm text-text-main">{formData.category}</span>
                            </div>
                            {formData.images.primary.url ? (
                                <img src={formData.images.primary.url} className="w-40 h-40 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 font-bold text-xs uppercase">No Image</div>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-xl text-text-main leading-tight mb-1">{formData.title || 'Product Title'}</h4>
                                </div>
                                <div className="text-right">
                                    {formData.originalPrice > 0 && (
                                        <p className="text-[10px] text-gray-400 line-through font-bold inline-flex items-center"><TbCurrencyNaira />{formData.originalPrice.toFixed(2)}</p>
                                    )}
                                    <div className="flex items-center justify-end">
                                        <span className=" font-black text-xl text-primary inline-flex items-center "><TbCurrencyNaira />{formData.msrp.toFixed(2)}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">per unit</span>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary font-medium line-clamp-2 mb-6 leading-relaxed">
                                {formData.description || 'Product description will appear here...'}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-text-secondary mb-6 font-medium">
                                <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle size={14} /> In Stock</span>
                                <span className="size-1 bg-gray-300 rounded-full"></span>
                                <span className="font-mono text-gray-400">{formData.sku || 'SKU-000'}</span>
                            </div>
                            <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-text-main font-bold text-sm transition-colors border border-gray-100">View Details</button>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <button
                            onClick={handlePublish}
                            disabled={mutation.isPending}
                            className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group mb-3 disabled:opacity-50 disabled:scale-100"
                        >
                            {mutation.isPending ? (
                                <>
                                    {editingProductId ? 'Saving Changes...' : 'Publishing...'}
                                    <Loader2 className="ml-1 animate-spin" size={20} />
                                </>
                            ) : (
                                <>
                                    {editingProductId ? 'Save Changes' : 'Publish to Marketplace'}
                                    <CheckCircle className="ml-1" size={20} />
                                </>
                            )}
                        </button>
                        <button
                            onClick={prevStep}
                            disabled={mutation.isPending}
                            className="w-full bg-white hover:bg-gray-50 text-text-secondary py-3 rounded-full font-bold border border-gray-200 transition-colors text-sm disabled:opacity-50"
                        >
                            Back to Media
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
