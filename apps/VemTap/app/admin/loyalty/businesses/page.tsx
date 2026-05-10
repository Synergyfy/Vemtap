"use client";

import React, { useState } from 'react';
import { Search, Building2, ExternalLink, MoreVertical, Ban, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MOCK_BUSINESSES = [
    { id: '1', name: 'Brew & Co', programs: 3, customers: 1204, points: '45.2k', redemptions: 842, status: 'Active' },
    { id: '2', name: 'Urban Salon', programs: 1, customers: 450, points: '12.8k', redemptions: 120, status: 'Active' },
    { id: '3', name: 'Metro Grocery', programs: 5, customers: 3402, points: '180k', redemptions: 2405, status: 'Active' },
    { id: '4', name: 'Tech Hub', programs: 2, customers: 890, points: '24k', redemptions: 310, status: 'Suspended' },
    { id: '5', name: 'Green Cafe', programs: 1, customers: 210, points: '8.4k', redemptions: 45, status: 'Active' },
];

export default function AdminBusinessesLoyaltyPage() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                        placeholder="Search by business name..." 
                        className="pl-11 h-12 rounded-2xl border-gray-100 bg-white shadow-sm focus:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead className="py-5 px-6 font-bold text-gray-900">Business Name</TableHead>
                            <TableHead className="py-5 px-6 font-bold text-gray-900">Active Programs</TableHead>
                            <TableHead className="py-5 px-6 font-bold text-gray-900">Customers</TableHead>
                            <TableHead className="py-5 px-6 font-bold text-gray-900">Points Issued</TableHead>
                            <TableHead className="py-5 px-6 font-bold text-gray-900">Redemptions</TableHead>
                            <TableHead className="py-5 px-6 font-bold text-gray-900">Status</TableHead>
                            <TableHead className="py-5 px-6 font-bold text-gray-900 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {MOCK_BUSINESSES.map((biz) => (
                            <TableRow key={biz.id} className="hover:bg-gray-50/50 border-gray-50 transition-colors group">
                                <TableCell className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                                            <Building2 size={20} />
                                        </div>
                                        <span className="font-bold text-gray-900">{biz.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 px-6 font-medium text-gray-600">{biz.programs}</TableCell>
                                <TableCell className="py-4 px-6 font-medium text-gray-600">{biz.customers.toLocaleString()}</TableCell>
                                <TableCell className="py-4 px-6 font-bold text-primary">{biz.points}</TableCell>
                                <TableCell className="py-4 px-6 font-medium text-gray-600">{biz.redemptions.toLocaleString()}</TableCell>
                                <TableCell className="py-4 px-6">
                                    <Badge className={`rounded-lg px-2.5 py-0.5 border-none ${
                                        biz.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                        {biz.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-4 px-6 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <Button variant="ghost" size="icon" className="rounded-xl">
                                                <MoreVertical size={20} className="text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl p-2 border-gray-100 shadow-xl">
                                            <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer">
                                                <ExternalLink size={16} /> View Dashboard
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl gap-2 text-red-600 cursor-pointer">
                                                <Ban size={16} /> Suspend System
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
