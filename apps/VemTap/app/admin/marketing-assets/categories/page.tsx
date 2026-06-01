"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketingCategories, useCreateMarketingCategory, useUpdateMarketingCategory, useDeleteMarketingCategory } from '@/services/marketing-assets/hooks';
import { useCategories } from '@/services/categories/hooks';
import { Tags, Plus, Trash2, Edit, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useMarketingCategories(true);
  const createMutation = useCreateMarketingCategory();
  const updateMutation = useUpdateMarketingCategory();
  const deleteMutation = useDeleteMarketingCategory();
  const { data: globalCategoriesData, isLoading: globalCategoriesLoading } = useCategories({ limit: 100 });
  const globalCategories = globalCategoriesData?.items || [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [sortOrder, setSortOrder] = useState(0);

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setIcon('');
    setColor('#2563EB');
    setSortOrder(0);
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (cat: any) => {
    setName(cat.name);
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setIcon(cat.icon || '');
    setColor(cat.color || '#2563EB');
    setSortOrder(cat.sortOrder || 0);
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }
    const payload: any = { name: name.trim(), description: description.trim() || undefined, icon: icon.trim() || undefined, color, sortOrder };
    if (slug.trim()) payload.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: payload });
        toast.success('Category updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Category created');
      }
      resetForm();
    } catch {
      toast.error(editingId ? 'Failed to update category' : 'Failed to create category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Templates assigned to it will lose their category reference.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Category deleted');
    } catch (err: any) {
      const msg = err?.response?.data?.message || '';
      toast.error(msg.includes('templates') ? msg : 'Failed to delete category');
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { isActive: !current } });
      toast.success(`Category ${!current ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Tags className="text-primary size-5" />
            Template Categories
          </h3>
          <Button
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2"
          >
            {showForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showForm ? 'Cancel' : 'Add Category'}
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 space-y-4 overflow-hidden"
            >
              <h4 className="font-extrabold text-gray-800 text-sm">
                {editingId ? 'Edit Category' : 'New Category'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">System Category *</label>
                    {editingId ? (
                      <input 
                        type="text" 
                        value={name} 
                        disabled 
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-100 focus:outline-none text-gray-500 font-bold cursor-not-allowed" 
                      />
                    ) : globalCategoriesLoading ? (
                      <div className="w-full px-3 py-2.5 text-xs border border-gray-100 rounded-xl bg-gray-50 text-gray-400 font-semibold animate-pulse">
                        Loading system categories...
                      </div>
                    ) : (
                      <select
                        value={name}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          setName(selectedName);
                          const cat = globalCategories.find((c: any) => c.name === selectedName);
                          if (cat) {
                            setSlug(cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                            setDescription(cat.description || '');
                          } else {
                            setSlug('');
                            setDescription('');
                          }
                        }}
                        className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-700 cursor-pointer"
                      >
                        <option value="">Select a Category...</option>
                        {globalCategories.map((cat: any) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Slug</label>
                    <input 
                      type="text" 
                      value={slug} 
                      onChange={(e) => setSlug(e.target.value)} 
                      placeholder="restaurant" 
                      disabled={!!editingId}
                      className={`w-full px-3 py-2 text-xs border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono ${
                        editingId ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-700 border-gray-100'
                      }`} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Description</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Templates for restaurants" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Icon</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="">Select Icon...</option>
                      <option value="UtensilsCrossed">🍽️ Restaurant & Fine Dining</option>
                      <option value="Coffee">☕ Cafe, Lounges & Coffee</option>
                      <option value="ShoppingBag">🛍️ Boutique, Fashion & Apparel</option>
                      <option value="Store">🛒 Supermarket & Retail Store</option>
                      <option value="Scissors">✂️ Salon, Barber & Spa</option>
                      <option value="Sparkles">✨ Beauty, Esthetic & Skincare</option>
                      <option value="Hotel">🏨 Hotel, Lodging & Guesthouse</option>
                      <option value="Gift">🎁 Loyalty, Rewards & Discounts</option>
                      <option value="Tags">🏷️ Seasonal Promotions & Sales</option>
                      <option value="MessageSquare">💬 Feedback, Reviews & Audits</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Color</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-8 rounded-lg border border-gray-200 cursor-pointer" />
                      <input type="text" value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono uppercase" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Sort Order</label>
                    <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-white rounded-xl text-xs font-bold gap-2">
                    <Save size={12} />
                    {editingId ? 'Save Changes' : 'Create Category'}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
              <Tags size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900">No categories yet</h4>
              <p className="text-xs text-gray-500">Create your first category to organize templates.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">Category</th>
                  <th className="pb-3">Slug</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Templates</th>
                  <th className="pb-3">Color</th>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {categories.map((cat) => {
                  const tplCount = (cat as any).templateCount ?? 0;
                  return (
                  <tr key={cat.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900">{cat.name}</td>
                    <td className="py-4 text-xs font-mono text-gray-400">{cat.slug || '-'}</td>
                    <td className="py-4 text-xs text-gray-500">{cat.description || '-'}</td>
                    <td className="py-4 text-xs font-mono text-gray-500">{tplCount}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-4 rounded border border-gray-200" style={{ backgroundColor: cat.color || '#ccc' }} />
                        <span className="text-xs font-mono">{cat.color || '-'}</span>
                      </span>
                    </td>
                    <td className="py-4 text-xs text-gray-500">{cat.sortOrder}</td>
                    <td className="py-4">
                      <button onClick={() => handleToggleActive(cat.id, cat.isActive)} className="focus:outline-none hover:scale-[1.05] transition-transform text-left">
                        {cat.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-200">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button onClick={() => openEdit(cat)} variant="outline" className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1 h-9">
                          <Edit size={12} /> Edit
                        </Button>
                        <Button onClick={() => handleDelete(cat.id)} disabled={tplCount > 0} variant="outline" className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs gap-1.5 h-9" title={tplCount > 0 ? `Cannot delete: ${tplCount} template(s) use this category` : 'Delete category'}>
                          <Trash2 size={12} /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
