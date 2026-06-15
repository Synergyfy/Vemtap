"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecommendationRules, useCreateRecommendationRule, useUpdateRecommendationRule, useDeleteRecommendationRule } from '@/services/marketing-assets/hooks';
import { Sparkles, Plus, Trash2, Edit, CheckCircle, XCircle, Search, Save, X, Lightbulb, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminRecommendationsPage() {
  const { data: rules, isLoading } = useRecommendationRules(true);
  const createMutation = useCreateRecommendationRule();
  const updateMutation = useUpdateRecommendationRule();
  const deleteMutation = useDeleteRecommendationRule();

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [condition, setCondition] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const resetForm = () => {
    setName('');
    setCondition('');
    setRecommendation('');
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (rule: any) => {
    setEditingId(rule.id);
    setName(rule.name);
    setCondition(rule.condition);
    setRecommendation(rule.recommendation);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recommendation rule?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Rule deleted');
    } catch (e) {
      toast.error('Failed to delete rule');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { isActive: !currentStatus } });
      toast.success(`Rule ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !condition.trim() || !recommendation.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      name: name.trim(),
      condition: condition.trim(),
      recommendation: recommendation.trim(),
      isActive: true
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: payload });
        toast.success('Rule updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('New rule registered');
      }
      resetForm();
    } catch (err) {
      toast.error('Failed to save rule');
    }
  };

  const filteredRules = rules?.filter(rule => 
    rule.name.toLowerCase().includes(search.toLowerCase()) || 
    rule.condition.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 mb-6 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-primary size-5" />
              Smart Recommendations Engine
            </h3>
            <p className="text-xs text-gray-400 font-medium ml-7">Manage "If/Then" logic to suggest marketing assets to businesses.</p>
          </div>
          <Button 
            onClick={() => {
              if (showAddForm) resetForm();
              else setShowAddForm(true);
            }}
            className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} className="stroke-[3px]" />}
            {showAddForm ? 'Cancel' : 'Add New Rule'}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-slate-900 rounded-2xl p-4 mb-6 flex items-start gap-3 border border-slate-800">
           <div className="bg-primary/20 p-2 rounded-xl">
             <Zap size={18} className="text-primary" />
           </div>
           <div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wider">Logic System Overview</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Recommendations appear on the Business Dashboard. Use conditions like <code className="text-primary font-bold">assets_count == 0</code> or <code className="text-primary font-bold">last_scan_days &gt; 30</code> to trigger personalized advice.
              </p>
           </div>
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
                {editingId ? 'Edit Rule Parameters' : 'Register New Suggestion Rule'}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Rule Title (Admin Reference)</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New Business Onboarding Suggestion"
                    className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                      Trigger Condition (Syntax)
                      <Info size={12} className="text-gray-300" />
                    </label>
                    <input 
                      type="text" 
                      value={condition} 
                      onChange={(e) => setCondition(e.target.value)}
                      placeholder="assets_count == 0"
                      className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-bold">Recommendation Message (User Facing)</label>
                    <input 
                      type="text" 
                      value={recommendation} 
                      onChange={(e) => setRecommendation(e.target.value)}
                      placeholder="Create your first Table Tent to boost scans!"
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
                    {editingId ? 'Update Rule' : 'Save Rule'}
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
            placeholder="Search rules by name or condition..." 
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
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-20 text-xs font-bold text-gray-400">
            No rules registered. Click Add New Rule to start building logic.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">Rule Name</th>
                  <th className="pb-3">Condition (Internal)</th>
                  <th className="pb-3">Message (Public)</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900">
                      {rule.name}
                    </td>
                    <td className="py-4">
                      <code className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-mono font-bold">
                        {rule.condition}
                      </code>
                    </td>
                    <td className="py-4 text-xs text-gray-500 italic max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <Lightbulb size={12} className="text-amber-400" />
                        <span className="line-clamp-1">"{rule.recommendation}"</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleActive(rule.id, rule.isActive)}
                        className="focus:outline-none hover:scale-[1.05] transition-transform"
                      >
                        {rule.isActive ? (
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
                          onClick={() => handleEdit(rule)}
                          variant="outline" 
                          className="rounded-xl border-gray-100 text-gray-700 hover:bg-gray-50 font-bold text-[10px] h-8 px-3"
                        >
                          <Edit size={10} />
                          Edit
                        </Button>
                        <Button 
                          onClick={() => handleDelete(rule.id)}
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
