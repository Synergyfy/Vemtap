'use client';

import React from 'react';
import { Users, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function TeamSettingsView() {
    const team = [
        { id: '1', name: 'John Owner', role: 'Owner' },
        { id: '2', name: 'Sarah Manager', role: 'Manager' },
        { id: '3', name: 'Alex Staff', role: 'Staff' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Team Members</h3>
                <Button className="h-10 px-4 rounded-xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white">
                    <Plus size={14} className="mr-2" /> Add Member
                </Button>
            </div>

            <div className="space-y-4">
                {team.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-xs text-gray-400">
                                {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-900">{member.name}</p>
                                <Badge className="bg-gray-100 text-gray-500 border-none font-black text-[9px] uppercase mt-1">{member.role}</Badge>
                            </div>
                        </div>
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
                            <Trash2 size={18} />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
