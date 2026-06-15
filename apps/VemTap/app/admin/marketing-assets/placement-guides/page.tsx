"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlacementGuides, useCreatePlacementGuide, useUpdatePlacementGuide, useDeletePlacementGuide, useMarketingAssetTypes } from '@/services/marketing-assets/hooks';
import { Settings, Plus, Trash2, Edit, CheckCircle, XCircle, Search, Save, X, MapPin, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminPlacementGuidesPage() {
  const { data: guides, isLoading } = usePlacementGuides(true);
  const { data: assetTypes } = useMarketingAssetTypes(true);
  const createMutation = useCreatePlacementGuide();
  const updateMutation = useUpdatePlacementGuide();
  const deleteMutation = useDeletePlacementGuide();

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [assetTypeId, setAssetTypeId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setAssetTypeId('');
    setLocation('');
    setDescription('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (guide: any) => {
    setEditingId(guide.id);
    setAssetTypeId(guide.assetTypeId);
    setLocation(guide.location);
    setDescription(guide.description || '');
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this placement guide?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Guide deleted');
    } catch (e) {
      toast.error('Failed to delete guide');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { isActive: !currentStatus } });
      toast.success(`Guide ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTypeId || !location.trim()) {
      toast.error('Please specify asset type and location');
      return;
    }

    const payload = {
      assetTypeId,
      location: location.trim(),
      description: description.trim() || undefined,
      isActive: true
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: payload });
        toast.success('Guide updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('New placement guide added');
      }
      resetForm();
    } catch (err) {
      toast.error('Failed to save guide');
    }
  };

  const filteredGuides = guides?.filter(guide => {
    const typeName = assetTypes?.find(t => t.id === guide.assetTypeId)?.name || '';
    return guide.location.toLowerCase().includes(search.toLowerCase()) || 
           typeName.toLowerCase().includes(search.toLowerCase());
  }) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-6 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="text-primary size-5" />
              Asset Placement Guides
            </h3>
            <p className="text-xs text-gray-400 font-medium ml-7">Teach businesses exactly where to place their physical assets.</p>
          </div>
          <Button 
            onClick={() => {
              if (showAddForm) resetForm();
              else setShowAddForm(true);
            }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showAddForm ? 'Cancel' : 'Add New Guide'}
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
                {editingId ? 'Edit Placement Details' : 'Register New Guide'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Select Asset Type</label>
                    <select
                      value={assetTypeId}
                      onChange={(e) => setAssetTypeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-700 cursor-pointer"
                    >
                      <option value="">-- Choose Asset Type --</option>
                      {assetTypes?.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Placement Location (e.g. Entrance)</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Customer Tables, Reception Desk, etc."
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Instructional Description</label>
                  <input 
                    type="text" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ensure the QR code is at eye level and not obscured by clutter..."
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
                    {editingId ? 'Save Changes' : 'Register Guide'}
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
            placeholder="Search guides by location or asset type..." 
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
        ) : filteredGuides.length === 0 ? (
          <div className="text-center py-20 text-xs font-bold text-gray-400">
            No placement guides found. Click Add New Guide to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">Asset Type</th>
                  <th className="pb-3">Recommended Location</th>
                  <th className="pb-3">Instructions</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {filteredGuides.map((guide) => {
                  const assetType = assetTypes?.find(t => t.id === guide.assetTypeId);
                  return (
                    <tr key={guide.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 pl-2 font-bold text-primary">
                        {assetType?.name || 'Unknown Type'}
                      </td>
                      <td className="py-4 font-extrabold text-gray-900">
                        <div className="flex items-center gap-1.5">
                           <MapPin size={10} className="text-gray-400" />
                           {guide.location}
                        </div>
                      </td>
                      <td className="py-4 text-xs text-gray-500 max-w-xs">
                        <p className="truncate" title={guide.description}>{guide.description || '-'}</p>
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleToggleActive(guide.id, guide.isActive)}
                          className="focus:outline-none hover:scale-[1.05] transition-transform"
                        >
                          {guide.isActive ? (
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
                            onClick={() => handleEdit(guide)}
                            variant="outline" 
                            className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-[10px] h-8 px-3"
                          >
                            <Edit size={10} />
                            Edit
                          </Button>
                          <Button 
                            onClick={() => handleDelete(guide.id)}
                            variant="outline" 
                            className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 font-bold text-[10px] h-8 px-3"
                          >
                            <Trash2 size={10} />
                            Delete
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
