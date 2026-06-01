"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIPrompts, useCreateAIPrompt, useUpdateAIPrompt, useDeleteAIPrompt } from '@/services/marketing-assets/hooks';
import { Sparkles, Plus, Trash2, Edit, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminAIPromptsPage() {
  const { data: prompts, isLoading } = useAIPrompts();
  const createMutation = useCreateAIPrompt();
  const updateMutation = useUpdateAIPrompt();
  const deleteMutation = useDeleteAIPrompt();

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('restaurant');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName('');
    setCategory('restaurant');
    setPromptTemplate('');
    setIsActive(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (prompt: any) => {
    setEditingId(prompt.id);
    setName(prompt.name);
    setCategory(prompt.category);
    setPromptTemplate(prompt.promptTemplate);
    setIsActive(prompt.isActive);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI prompt template?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('AI Prompt template deleted successfully');
    } catch (e) {
      toast.error('Failed to delete prompt template');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !promptTemplate) {
      toast.error('Please specify a prompt name and template content');
      return;
    }

    const payload = {
      name,
      category,
      promptTemplate,
      isActive
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: payload });
        toast.success('AI Prompt template updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('AI Prompt template registered successfully');
      }
      resetForm();
    } catch (err) {
      toast.error('Failed to save AI prompt template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-primary size-5" />
            AI Copywriter Prompt Presets
          </h3>
          <Button 
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2"
          >
            {showForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showForm ? 'Cancel' : 'Register Prompt'}
          </Button>
        </div>

        {/* Dynamic Form Panel */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6 space-y-4 overflow-hidden"
            >
              <h4 className="font-extrabold text-gray-800 text-sm">
                {editingId ? 'Edit AI Copywriter Prompt' : 'Register New AI Prompt Preset'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Prompt Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Google Review Callout"
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Business Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-700 cursor-pointer"
                    >
                      <option value="restaurant">Restaurant / F&B</option>
                      <option value="retail">Retail Store</option>
                      <option value="hospitality">Hospitality / Hotel</option>
                      <option value="salon">Beauty Salon / Spa</option>
                      <option value="fitness">Gym / Fitness Center</option>
                      <option value="general">General Business</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Status</label>
                    <div className="flex items-center h-9">
                      <label className="inline-flex items-center cursor-pointer gap-2">
                        <input 
                          type="checkbox" 
                          checked={isActive} 
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary size-4" 
                        />
                        <span className="text-xs font-bold text-gray-600">Active Preset</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Prompt Template Content</label>
                  <textarea 
                    value={promptTemplate} 
                    onChange={(e) => setPromptTemplate(e.target.value)}
                    placeholder="Write catchy short slogans asking customers to write review for {businessName} based on quality {subject}..."
                    rows={4}
                    className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-gray-700"
                  />
                  <span className="text-[10px] text-gray-400 font-medium block">
                    Use `{'{businessName}'}`, `{'{businessType}'}`, `{'{subject}'}`, and `{'{tone}'}` as variables that will be replaced dynamically on generation.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200/50">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-primary text-white rounded-xl text-xs font-bold gap-2"
                  >
                    <Save size={12} />
                    {editingId ? 'Save Updates' : 'Register Prompt'}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !prompts || prompts.length === 0 ? (
          <div className="text-center py-20 text-xs font-bold text-gray-400">
            No AI prompts custom configured. Click Register Prompt to add.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 bg-purple-50 text-purple-600 rounded-lg">
                      {prompt.category}
                    </span>
                    {prompt.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600">
                        <CheckCircle size={10} />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400">
                        <XCircle size={10} />
                        Inactive
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-sm md:text-base">{prompt.name}</h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100/50 font-mono">
                    "{prompt.promptTemplate}"
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-gray-50 pt-3 mt-2">
                  <Button 
                    onClick={() => handleEdit(prompt)}
                    variant="outline" 
                    className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1 h-8 px-3"
                  >
                    <Edit size={12} />
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDelete(prompt.id)}
                    variant="outline" 
                    className="rounded-xl border-rose-50 text-rose-600 hover:bg-rose-50/50 font-bold text-xs gap-1 h-8 px-3"
                  >
                    <Trash2 size={12} />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
