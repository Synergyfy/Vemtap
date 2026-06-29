"use client";

import React, { useState } from 'react';
import { Plus, Search, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RewardProgramCard from '@/components/loyalty/RewardProgramCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useRewards, useUpdateReward, useDeleteReward } from '@/services/loyalty/hooks';
import type { Reward } from '@/types/loyalty';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RewardProgramsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', pointCost: 0 });

    const { data: rewards, isLoading } = useRewards();
    const updateRewardMutation = useUpdateReward();
    const deleteRewardMutation = useDeleteReward();

    const handleToggle = async (id: string, active: boolean) => {
        try {
            await updateRewardMutation.mutateAsync({ id, updates: { isActive: active } });
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update program');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this program?')) return;
        try {
            await deleteRewardMutation.mutateAsync(id);
            toast.success('Program deleted');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete program');
        }
    };

    const handleEdit = (reward: Reward) => {
        setEditingReward(reward);
        setEditForm({ name: reward.name, description: reward.description, pointCost: reward.pointCost });
    };

    const handleSaveEdit = async () => {
        if (!editingReward) return;
        try {
            await updateRewardMutation.mutateAsync({
                id: editingReward.id,
                updates: { name: editForm.name, description: editForm.description, pointCost: editForm.pointCost },
            });
            setEditingReward(null);
            toast.success('Program updated');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update program');
        }
    };

    const filteredRewards = (rewards || []).filter((r: Reward) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                        placeholder="Search programs..." 
                        className="pl-11 h-12 rounded-2xl border-gray-100 bg-white shadow-sm focus:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/loyalty/rewards">
                        <Button className="h-12 px-6 rounded-2xl bg-primary text-white gap-2 font-bold shadow-lg shadow-primary/20">
                            <Plus size={18} /> Create Program
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredRewards.map((reward: Reward) => (
                        <RewardProgramCard
                            key={reward.id}
                            id={reward.id}
                            name={reward.name}
                            description={reward.description}
                            pointsRule={`${reward.pointCost} pts required`}
                            reward={reward.name}
                            active={reward.isActive}
                            onToggle={handleToggle}
                            onEdit={() => handleEdit(reward)}
                            onDelete={handleDelete}
                        />
                    ))}
                    
                    {filteredRewards.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200"
                        >
                            <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                                <Plus size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No programs found</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your search or create a new program.</p>
                            <Link href="/dashboard/loyalty/rewards">
                                <Button className="mt-6 rounded-xl bg-primary">Create New Program</Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingReward && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setEditingReward(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Edit Program</h3>
                                <button onClick={() => setEditingReward(null)} className="size-10 rounded-xl hover:bg-gray-100 flex items-center justify-center">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Points Required</label>
                                    <input
                                        type="number"
                                        value={editForm.pointCost}
                                        onChange={(e) => setEditForm({ ...editForm, pointCost: Number(e.target.value) })}
                                        className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <Button onClick={() => setEditingReward(null)} variant="outline" className="flex-1 h-12 rounded-2xl font-bold">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={updateRewardMutation.isPending}
                                    className="flex-1 h-12 rounded-2xl bg-primary text-white font-bold gap-2"
                                >
                                    {updateRewardMutation.isPending ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
