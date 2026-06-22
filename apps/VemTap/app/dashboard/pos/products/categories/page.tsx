'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueCategoriesPublic, useCatalogueItemsPublic, useCreateCatalogueCategory, useUpdateCatalogueCategory, useDeleteCatalogueCategory } from '@/services/catalogue/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Plus, LayoutGrid, MoreVertical, Edit2, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CategoriesList() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const { data: categories = [] } = useCatalogueCategoriesPublic(activeBranchId ?? '');
  const { data: productsData } = useCatalogueItemsPublic(activeBranchId ?? '');
  const products = productsData?.data ?? [];
  const createCategory = useCreateCatalogueCategory();
  const updateCategory = useUpdateCatalogueCategory();
  const deleteCategory = useDeleteCatalogueCategory();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setMenuOpen(null);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (!activeBranchId) return;

    if (editingCategory) {
      updateCategory.mutate(
        { id: editingCategory.id, data: { name: name.trim() } },
        { onSuccess: () => toast.success('Category updated') }
      );
    } else {
      createCategory.mutate(
        { name: name.trim() },
        { onSuccess: () => toast.success('Category created') }
      );
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const catProducts = products.filter((p: any) => p.categoryId === id);
    if (catProducts.length > 0) {
      toast.error(`Cannot delete — ${catProducts.length} products are using this category`);
      return;
    }
    if (confirm('Delete this category?')) {
      deleteCategory.mutate(id, { onSuccess: () => toast.success('Category deleted') });
    }
    setMenuOpen(null);
  };

  const getProductCount = (catId: string) => products.filter((p: any) => p.categoryId === catId && p.status !== 'suspended').length;

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Categories"
        subtitle={`${categories.length} categories · Products organized for your POS`}
        actions={
          <button
            onClick={openAddModal}
            className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Add Category</span>
          </button>
        }
      />

      {categories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="size-24 rounded-[28px] bg-gray-50 border border-gray-100 flex items-center justify-center mb-6">
            <LayoutGrid size={40} className="text-gray-300" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No categories yet</h3>
          <p className="text-sm font-medium text-gray-500 mb-8 max-w-sm">Create your first category to organize products in your POS system.</p>
          <button
            onClick={openAddModal}
            className="h-14 px-8 rounded-2xl bg-[#066CF4] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Create First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-2">
          {categories.map((cat: any) => {
            const count = getProductCount(cat.id);
            return (
              <div key={cat.id} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-md hover:border-[#066CF4]/20 transition-all flex flex-col relative group">
                <div className="absolute top-6 right-6">
                  <button
                    onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}
                    className="text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {menuOpen === cat.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-20 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <Edit2 size={14} /> Edit Category
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="size-16 rounded-[20px] bg-blue-500 text-white flex items-center justify-center text-2xl shadow-lg mb-6">
                  📦
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-2">{cat.name}</h3>
                <p className="text-xs font-medium text-gray-500 mb-6 line-clamp-2">{cat.description || 'No description'}</p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Products</span>
                  <span className="text-sm font-black text-[#066CF4] bg-blue-50 px-3 py-1 rounded-lg">{count}</span>
                </div>
              </div>
            );
          })}

          <button
            onClick={openAddModal}
            className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-6 flex flex-col items-center justify-center text-gray-400 hover:text-[#066CF4] hover:border-[#066CF4]/30 hover:bg-[#066CF4]/5 transition-all min-h-[240px]"
          >
            <div className="size-16 rounded-[20px] bg-white border border-gray-100 flex items-center justify-center mb-4 shadow-sm">
              <Plus size={24} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">Create New Category</span>
          </button>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-gray-900">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {editingCategory ? 'Update category details' : 'This will appear in your POS'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Category Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4] focus:ring-4 focus:ring-[#066CF4]/10 transition-all placeholder:font-medium"
                placeholder="e.g. Fast Food, Beverages, Desserts..."
              />
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#066CF4] transition-all placeholder:font-medium"
                placeholder="Brief description..."
              />
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
              <div className="size-14 rounded-[16px] bg-blue-500 text-white flex items-center justify-center text-xl shadow-md">
                📦
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900">{name || 'Category Name'}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{description || 'Description'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-14 rounded-2xl border border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || (editingCategory ? updateCategory.isPending : createCategory.isPending)}
                className={cn(
                  "flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2",
                  name.trim() ? "bg-[#066CF4] text-white shadow-blue-500/20 hover:bg-blue-600 active:scale-95" : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                )}
              >
                <Check size={16} />
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
