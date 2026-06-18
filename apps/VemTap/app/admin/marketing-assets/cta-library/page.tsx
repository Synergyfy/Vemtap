"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCTALibrary, useCreateCTALibraryItem, useUpdateCTALibraryItem, useDeleteCTALibraryItem } from '@/services/marketing-assets/hooks';
import { ClipboardList, Plus, Trash2, Edit, CheckCircle, XCircle, Search, Save, X, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminCTALibraryPage() {
  const { data: ctas, isLoading } = useCTALibrary(true);
  const createMutation = useCreateCTALibraryItem();
  const updateMutation = useUpdateCTALibraryItem();
  const deleteMutation = useDeleteCTALibraryItem();

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');

  const resetForm = () => {
    setText('');
    setCategory('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (cta: any) => {
    setEditingId(cta.id);
    setText(cta.text);
    setCategory(cta.category || '');
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this CTA from the library?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('CTA deleted successfully');
    } catch (e) {
      toast.error('Failed to delete CTA');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { isActive: !currentStatus } });
      toast.success(`CTA ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Please specify CTA text');
      return;
    }

    const payload = {
      text: text.trim(),
      category: category.trim() || undefined,
      isActive: true
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: payload });
        toast.success('CTA updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('New CTA added to library');
      }
      resetForm();
    } catch (err) {
      toast.error('Failed to save CTA');
    }
  };

  const filteredCtas = ctas?.filter(cta => 
    cta.text.toLowerCase().includes(search.toLowerCase()) || 
    cta.category?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-6 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="text-primary size-5" />
              Call-To-Action Library
            </h3>
            <p className="text-xs text-gray-400 font-medium ml-7">Manage reusable labels for marketing assets.</p>
          </div>
          <Button 
            onClick={() => {
              if (showAddForm) resetForm();
              else setShowAddForm(true);
            }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showAddForm ? 'Cancel' : 'Add New CTA'}
          </Button>
        </div>

        {/* Modal Overlay Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 space-y-4 overflow-hidden"
            >
              <h4 className="font-extrabold text-gray-800 text-sm">
                {editingId ? 'Edit CTA Details' : 'Register New CTA'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">CTA Text (e.g. Scan To Order)</label>
                    <input 
                      type="text" 
                      value={text} 
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Scan To Order"
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Category (Optional)</label>
                    <input 
                      type="text" 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Sales, Registration, etc."
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-primary text-white rounded-xl text-xs font-bold gap-2"
                  >
                    <Save size={12} />
                    {editingId ? 'Save Changes' : 'Add to Library'}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search CTAs by text or category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-50 border rounded-2xl" />)}
          </div>
        ) : filteredCtas.length === 0 ? (
          <div className="text-center py-20 text-xs font-bold text-gray-400">
            No CTAs found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">CTA Label Text</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {filteredCtas.map((cta) => (
                  <tr key={cta.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900">
                      "{cta.text}"
                    </td>
                    <td className="py-4">
                      {cta.category ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-lg">
                          <Tags size={10} />
                          {cta.category}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleActive(cta.id, cta.isActive)}
                        className="focus:outline-none hover:scale-[1.05] transition-transform"
                      >
                        {cta.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">
                            <CheckCircle size={10} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-400 border border-gray-200">
                            <XCircle size={10} />
                            Disabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => handleEdit(cta)}
                          variant="outline" 
                          className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-[10px] h-8 px-3"
                        >
                          <Edit size={10} />
                          Edit
                        </Button>
                        <Button 
                          onClick={() => handleDelete(cta.id)}
                          variant="outline" 
                          className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 font-bold text-[10px] h-8 px-3"
                        >
                          <Trash2 size={10} />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
