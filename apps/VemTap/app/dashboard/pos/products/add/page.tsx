'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueCategoriesPublic, useCreateCatalogueItem, useCreateCatalogueCategory } from '@/services/catalogue/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, Tag, Banknote, Image as ImageIcon, CheckCircle2, ArrowRight, ArrowLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Package },
  { id: 2, title: 'Pricing', icon: Banknote },
  { id: 3, title: 'Inventory', icon: Tag },
  { id: 4, title: 'Image', icon: ImageIcon },
];

export default function AddProductWizard() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: categories = [] } = useCatalogueCategoriesPublic(activeBranchId ?? '');
  const createProduct = useCreateCatalogueItem();
  const createCategory = useCreateCatalogueCategory();

  const [currentStep, setCurrentStep] = useState(1);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: '',
    stockQuantity: '',
    sku: '',
  });

  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (e.target.type === 'file') {
      const target = e.target as HTMLInputElement;
      if (target.files?.[0]) {
        const file = target.files[0];
        setProductImage(file);
        setImagePreview(URL.createObjectURL(file));
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(c => c + 1);
    else handleSave();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
    else router.back();
  };

  const handleSave = () => {
    if (!activeBranchId) return;

    const dto = {
      name: formData.name,
      categoryId: formData.categoryId,
      shortDescription: formData.description,
      description: formData.description,
      price: Number(formData.price) || 0,
      mainImage: imagePreview || '',
      stockQuantity: Number(formData.stockQuantity) || 0,
      sku: formData.sku || `SKU-${Math.floor(Math.random() * 9000) + 1000}`,
      branchId: activeBranchId,
    };

    createProduct.mutate(dto, {
      onSuccess: () => router.push('/dashboard/pos/products'),
    });
  };

  const isStepValid = () => {
    if (currentStep === 1) return formData.name.length > 2 && formData.categoryId !== '';
    if (currentStep === 2) return Number(formData.price) > 0;
    if (currentStep === 3) return formData.stockQuantity !== '';
    return true;
  };

  const selectedCategoryName = categories.find((c: any) => c.id === formData.categoryId)?.name || 'Uncategorized';

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader title="Add New Product" showBack={false} />

      <div className="flex items-center justify-between mb-8 px-2 relative">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0" />
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-[#066CF4] rounded-full z-0 transition-all duration-500 ease-out"
          style={{ width: `calc(${((currentStep - 1) / 3) * 100}% - ${currentStep === 1 ? '0px' : '48px'})` }}
        />

        {STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isPast = step.id < currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={cn(
                "size-10 md:size-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
                isActive ? "bg-[#066CF4] border-[#066CF4] text-white shadow-lg shadow-blue-500/20 scale-110" :
                isPast ? "bg-white border-[#066CF4] text-[#066CF4]" :
                "bg-white border-gray-100 text-gray-300"
              )}>
                {isPast ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
              </div>
              <span className={cn(
                "text-[9px] md:text-[10px] font-black uppercase tracking-widest absolute -bottom-6 whitespace-nowrap",
                isActive ? "text-[#066CF4]" : isPast ? "text-gray-900" : "text-gray-300"
              )}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm mb-6 mt-6">

        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Product Name *</label>
              <input
                name="name" value={formData.name} onChange={handleChange} autoFocus
                className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4] focus:ring-4 focus:ring-[#066CF4]/10 transition-all placeholder:font-medium"
                placeholder="e.g. Coca-Cola 50cl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Category *</label>
              {showNewCategoryForm ? (
                <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    autoFocus
                    className="w-full h-12 px-4 rounded-xl border border-blue-200 bg-white text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4] transition-all placeholder:font-medium"
                    placeholder="Category name..."
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (newCategoryName.trim() && activeBranchId) {
                          createCategory.mutate(
                            { name: newCategoryName.trim() },
                            {
                              onSuccess: (newCat: any) => {
                                setFormData(f => ({ ...f, categoryId: newCat.id }));
                                setNewCategoryName('');
                                setShowNewCategoryForm(false);
                              },
                            }
                          );
                        }
                      }}
                      disabled={!newCategoryName.trim() || createCategory.isPending}
                      className={cn(
                        "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        newCategoryName.trim() ? "bg-[#066CF4] text-white hover:bg-blue-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewCategoryForm(false); setNewCategoryName(''); }}
                      className="h-10 px-4 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    name="categoryId" value={formData.categoryId} onChange={handleChange}
                    className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4] transition-all"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryForm(true)}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#066CF4] hover:border-[#066CF4]/30 hover:bg-[#066CF4]/5 transition-all"
                  >
                    <Plus size={14} /> New Category
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Description</label>
              <textarea
                name="description" value={formData.description} onChange={handleChange}
                className="w-full h-24 p-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4] transition-all resize-none placeholder:font-medium"
                placeholder="Brief description of the product..."
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Selling Price (₦) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-blue-400">₦</span>
                <input
                  type="number" name="price" value={formData.price} onChange={handleChange} autoFocus
                  className="w-full h-16 pl-10 pr-4 rounded-2xl border-2 border-blue-200 bg-white text-2xl font-black text-gray-900 focus:outline-none focus:border-[#066CF4] transition-all"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] font-bold text-blue-400 mt-2 uppercase tracking-widest">This is the final price customers will pay</p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Opening Stock *</label>
              <input
                type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} autoFocus
                className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4] transition-all"
                placeholder="0"
              />
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-4">SKU (Optional)</h4>
              <input
                name="sku" value={formData.sku} onChange={handleChange}
                className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4] transition-all"
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-6">
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="size-40 mx-auto rounded-[32px] object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProductImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 size-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white shadow-md transition-all"
                >
                  <ImageIcon size={16} className="text-gray-600" />
                </button>
              </div>
            ) : (
              <label className="size-40 mx-auto block bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-[#066CF4] hover:bg-[#066CF4]/5 hover:border-[#066CF4]/30 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  name="mainImage"
                  onChange={handleChange}
                  className="hidden"
                />
                <ImageIcon size={40} className="mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Upload Image (Optional)</span>
              </label>
            )}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supported: JPG, PNG (Max 5MB)</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <button
          onClick={handleBack}
          className="h-14 px-6 rounded-2xl bg-white border border-gray-200 text-gray-600 flex items-center gap-2 font-black uppercase tracking-widest text-[11px] hover:bg-gray-50 transition-all active:scale-95"
        >
          <ArrowLeft size={16} />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>
        <button
          onClick={handleNext}
          disabled={!isStepValid() || createProduct.isPending}
          className={cn(
            "h-14 px-8 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[11px] transition-all shadow-xl",
            isStepValid() && !createProduct.isPending
              ? "bg-[#066CF4] text-white shadow-blue-500/20 hover:bg-blue-600 active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
          )}
        >
          {currentStep === 4 ? 'Save Product' : 'Next Step'}
          {currentStep < 4 && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
