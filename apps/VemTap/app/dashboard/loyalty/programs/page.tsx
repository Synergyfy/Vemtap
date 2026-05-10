"use client";

import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RewardProgramCard from '@/components/loyalty/RewardProgramCard';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_PROGRAMS = [
    {
        id: '1',
        name: 'Coffee Lover Card',
        description: 'Earn points for every coffee purchase and get a free drink.',
        pointsRule: '₦1,000 = 10 points',
        reward: '100 points = Free Drink',
        active: true
    },
    {
        id: '2',
        name: 'Lunch Special',
        description: 'Collect points during lunch hours for a free meal voucher.',
        pointsRule: '₦2,500 = 25 points',
        reward: '250 points = Free Meal',
        active: true
    },
    {
        id: '3',
        name: 'Weekend Bonus',
        description: 'Double points on all purchases during weekends.',
        pointsRule: '₦1,000 = 20 points',
        reward: 'Store Credit',
        active: false
    }
];

export default function RewardProgramsPage() {
    const [programs, setPrograms] = useState(MOCK_PROGRAMS);
    const [searchQuery, setSearchQuery] = useState('');

    const handleToggle = (id: string, active: boolean) => {
        setPrograms(prev => prev.map(p => p.id === id ? { ...p, active } : p));
    };

    const filteredPrograms = programs.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-100 gap-2 font-bold">
                        <Filter size={18} /> Filter
                    </Button>
                    <Button className="h-12 px-6 rounded-2xl bg-primary text-white gap-2 font-bold shadow-lg shadow-primary/20">
                        <Plus size={18} /> Create Program
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredPrograms.map((program) => (
                        <RewardProgramCard
                            key={program.id}
                            {...program}
                            onToggle={handleToggle}
                            onEdit={(id) => console.log('Edit', id)}
                            onDelete={(id) => setPrograms(prev => prev.filter(p => p.id !== id))}
                        />
                    ))}
                </AnimatePresence>
                
                {filteredPrograms.length === 0 && (
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
                        <Button className="mt-6 rounded-xl bg-primary">Create New Program</Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
