"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMockups, useCreateMockup, useUpdateMockup, useDeleteMockup } from '@/services/marketing-assets/hooks';
import { Image as ImageIcon, Plus, Trash2, Edit, CheckCircle, XCircle, Grid, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminMockupsPage() {
  const { data: mockups, isLoading } = useMockups(undefined, true);
  const createMutation = useCreateMockup();
  const updateMutation = useUpdateMockup();
  const deleteMutation = useDeleteMockup();

  // Create/Edit Mockup form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('table_tent');
  const [imageUrl, setImageUrl] = useState('');
  const [overlayX, setOverlayX] = useState(30);
  const [overlayY, setOverlayY] = useState(40);
  const [overlayW, setOverlayW] = useState(40);
  const [overlayH, setOverlayH] = useState(60);
  const [rotateY, setRotateY] = useState(15);
  const [perspective, setPerspective] = useState(1000);

  const resetForm = () => {
    setName('');
    setType('table_tent');
    setImageUrl('');
    setOverlayX(30);
    setOverlayY(40);
    setOverlayW(40);
    setOverlayH(60);
    setRotateY(15);
    setPerspective(1000);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (mockup: any) => {
    setEditingId(mockup.id);
    setName(mockup.name);
    setType(mockup.type);
    setImageUrl(mockup.imageUrl);
    setOverlayX(mockup.overlayConfig?.x || 30);
    setOverlayY(mockup.overlayConfig?.y || 40);
    setOverlayW(mockup.overlayConfig?.width || 40);
    setOverlayH(mockup.overlayConfig?.height || 60);
    setRotateY(mockup.overlayConfig?.rotateY ?? 15);
    setPerspective(mockup.overlayConfig?.perspective || 1000);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mockup preset?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Mockup deleted successfully');
    } catch (e) {
      toast.error('Failed to delete mockup');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) {
      toast.error('Please specify mockup name and backdrop image URL');
      return;
    }

    const payload = {
      name,
      type,
      imageUrl,
      overlayConfig: {
        x: Number(overlayX),
        y: Number(overlayY),
        width: Number(overlayW),
        height: Number(overlayH),
        rotateY: Number(rotateY),
        perspective: Number(perspective)
      }
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: payload });
        toast.success('Mockup updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Photorealistic mockup registered successfully');
      }
      resetForm();
    } catch (err) {
      toast.error('Failed to save mockup preset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="text-primary size-5" />
            Mockup Scene Backdrops
          </h3>
          <Button 
            onClick={() => {
              if (showAddForm) resetForm();
              else setShowAddForm(true);
            }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showAddForm ? 'Cancel' : 'Register Backdrop'}
          </Button>
        </div>

        {/* Modal Overlay Form to Register mockup */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 space-y-4 overflow-hidden"
            >
              <h4 className="font-extrabold text-gray-800 text-sm">
                {editingId ? 'Edit Backdrop Specs' : 'Register Backdrop Specs'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Backdrop Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Wooden Table Tent Stand"
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Backdrop Image URL</label>
                    <input 
                      type="text" 
                      value={imageUrl} 
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Mockup Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-700 cursor-pointer"
                    >
                      <option value="table_tent">Table Stand</option>
                      <option value="wall_poster">Wall Poster</option>
                      <option value="counter_display">Counter Display</option>
                      <option value="window_sticker">Window Sticker</option>
                      <option value="roll_up_banner">Roll-Up Banner</option>
                      <option value="outdoor_banner">Outdoor Banner</option>
                      <option value="social_media">Social Media</option>
                      <option value="flyer">Flyer</option>
                      <option value="square_acrylic">Square Acrylic</option>
                      <option value="rectangle_acrylic">Rectangle Acrylic</option>
                    </select>
                  </div>
                </div>

                {/* Overlay perspective grids mapping */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold">Overlay X (%)</label>
                    <input type="number" value={overlayX} onChange={(e) => setOverlayX(Number(e.target.value))} className="w-full px-3 py-1.5 text-xs border border-gray-100 rounded-xl text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold">Overlay Y (%)</label>
                    <input type="number" value={overlayY} onChange={(e) => setOverlayY(Number(e.target.value))} className="w-full px-3 py-1.5 text-xs border border-gray-100 rounded-xl text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold">Width (%)</label>
                    <input type="number" value={overlayW} onChange={(e) => setOverlayW(Number(e.target.value))} className="w-full px-3 py-1.5 text-xs border border-gray-100 rounded-xl text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold">Height (%)</label>
                    <input type="number" value={overlayH} onChange={(e) => setOverlayH(Number(e.target.value))} className="w-full px-3 py-1.5 text-xs border border-gray-100 rounded-xl text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold">Rotate Y (deg)</label>
                    <input type="number" value={rotateY} onChange={(e) => setRotateY(Number(e.target.value))} className="w-full px-3 py-1.5 text-xs border border-gray-100 rounded-xl text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold">Perspective (px)</label>
                    <input type="number" value={perspective} onChange={(e) => setPerspective(Number(e.target.value))} className="w-full px-3 py-1.5 text-xs border border-gray-100 rounded-xl text-center" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-primary text-white rounded-xl text-xs font-bold gap-2"
                  >
                    <Save size={12} />
                    {editingId ? 'Save Changes' : 'Save Preset Mockup'}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mockups list */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-gray-50 border rounded-2xl" />
            ))}
          </div>
        ) : !mockups || mockups.length === 0 ? (
          <div className="text-center py-20 text-xs font-bold text-gray-400">
            No mockup presets registered. Click Register Backdrop to add.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {mockups.map((mockup) => (
              <div key={mockup.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group">
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  <img src={mockup.imageUrl} alt={mockup.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/90 text-[9px] font-extrabold uppercase rounded border border-gray-100">
                    {mockup.type.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <h5 className="font-extrabold text-gray-900 text-sm">{mockup.name}</h5>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      Overlay: X{mockup.overlayConfig.x}% Y{mockup.overlayConfig.y}% W{mockup.overlayConfig.width}% H{mockup.overlayConfig.height}%
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 border-t border-gray-50 pt-2.5">
                    <Button 
                      onClick={() => handleEdit(mockup)}
                      variant="outline" 
                      className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1 h-8 px-3"
                    >
                      <Edit size={12} />
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDelete(mockup.id)}
                      variant="outline" 
                      className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 font-bold text-xs gap-1 h-8 px-3"
                    >
                      <Trash2 size={12} />
                      Delete
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
