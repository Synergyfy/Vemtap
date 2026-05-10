"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Users, Gift, MoreVertical, Edit2, Trash2, Power } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RewardProgramCardProps {
    id: string;
    name: string;
    description: string;
    pointsRule: string;
    reward: string;
    active: boolean;
    onToggle: (id: string, active: boolean) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function RewardProgramCard({
    id,
    name,
    description,
    pointsRule,
    reward,
    active,
    onToggle,
    onEdit,
    onDelete
}: RewardProgramCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 relative group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/5 rounded-2xl text-primary">
                    <Gift size={24} />
                </div>
                <div className="flex items-center gap-2">
                    <Switch 
                        checked={active} 
                        onCheckedChange={(checked) => onToggle(id, checked)}
                        className="data-[state=checked]:bg-primary"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <MoreVertical size={20} className="text-gray-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-gray-100 shadow-xl">
                            <DropdownMenuItem onClick={() => onEdit(id)} className="rounded-xl gap-2 cursor-pointer">
                                <Edit2 size={16} /> Edit Program
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(id)} className="rounded-xl gap-2 text-red-600 cursor-pointer">
                                <Trash2 size={16} /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rule</p>
                    <p className="text-sm font-semibold text-gray-700">{pointsRule}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reward</p>
                    <p className="text-sm font-semibold text-primary">{reward}</p>
                </div>
            </div>
        </motion.div>
    );
}
