"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketingAssetTypes, useCreateMarketingAssetType, useUpdateMarketingAssetType, useDeleteMarketingAssetType } from '@/services/marketing-assets/hooks';
import { Tags, Plus, Trash2, Edit, CheckCircle, XCircle, Search, Save, X, Image as ImageIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminAssetTypesPage() {
  const { data: assetTypes, isLoading } = useMarketingAssetTypes(true);
  const createMutation = useCreateMarketingAssetType();
  const updateMutation = useUpdateMarketingAssetType();
  const deleteMutation = useDeleteMarketingAssetType();

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setPreviewImageUrl('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (type: any) => {
    setEditingId(type.id);
    setName(type.name);
    setDescription(type.description || '');
    setPreviewImageUrl(type.previewImageUrl || '');
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset type? This may affect templates linked to it.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Asset type removed');
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { isActive: !currentStatus } });
      toast.success(`Asset type ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please specify asset type name');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      previewImageUrl: previewImageUrl.trim() || undefined,
      isActive: true
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: payload });
        toast.success('Asset type updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('New asset type registered');
      }
      resetForm();
    } catch (err) {
      toast.error('Failed to save asset type');
    }
  };

  const filteredTypes = assetTypes?.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-6 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Tags className="text-primary size-5" />
              Marketing Asset Types
            </h3>
            <p className="text-xs text-gray-400 font-medium ml-7">Define physical formats like Posters, Flyers, or Table Tents.</p>
          </div>
          <Button 
            onClick={() => {
              if (showAddForm) resetForm();
              else setShowAddForm(true);
            }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showAddForm ? 'Cancel' : 'Register Asset Type'}
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
                {editingId ? 'Edit Asset Type Specs' : 'Register New Asset Type'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Asset Name (e.g. Table Tent)</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Roll-Up Banner"
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Preview Image URL</label>
                    <input 
                      type="text" 
                      value={previewImageUrl} 
                      onChange={(e) => setPreviewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Description</label>
                  <input 
                    type="text" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Large vertical standing banner for events..."
                    className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-primary text-white rounded-xl text-xs font-bold gap-2"
                  >
                    <Save size={12} />
                    {editingId ? 'Save Changes' : 'Save Asset Type'}
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
            placeholder="Search asset types..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
          />
        </div>

        {/* Grid List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[4/3] bg-gray-50 border rounded-2xl" />)}
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="text-center py-20 text-xs font-bold text-gray-400">
            No asset types registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {filteredTypes.map((type) => (
              <div key={type.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col group">
                <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-gray-50">
                   {type.previewImageUrl ? (
                     <img src={type.previewImageUrl} alt={type.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <ImageIcon size={32} className="text-gray-200" />
                   )}
                   <div className="absolute top-2 right-2">
                      <button onClick={() => handleToggleActive(type.id, type.isActive)} className="focus:outline-none">
                         {type.isActive ? (
                           <span className="bg-green-500 size-2 rounded-full block shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Active" />
                         ) : (
                           <span className="bg-gray-300 size-2 rounded-full block" title="Inactive" />
                         )}
                      </button>
                   </div>
                </div>
                
                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <h5 className="font-extrabold text-gray-900 text-sm">{type.name}</h5>
                    <div className="flex items-center gap-1.5 mt-1">
                       <Layers size={10} className="text-primary" />
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{type.templateCount || 0} Templates</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <Button 
                      onClick={() => handleEdit(type)}
                      variant="outline" 
                      className="flex-1 rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-[10px] h-8"
                    >
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDelete(type.id)}
                      variant="outline" 
                      className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 font-bold text-[10px] h-8 px-2"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
