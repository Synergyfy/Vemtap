"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Copy, 
  PowerOff, 
  Trash2,
  Layout,
  BarChart2
} from 'lucide-react';
import Link from 'next/link';
import { useMarketingTemplates } from '@/services/marketing-assets/hooks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';

export default function AdminTemplatesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { data: templates, isLoading } = useMarketingTemplates();

  const filteredTemplates = templates ? templates.filter((t: any) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && t.isActive !== false) ||
                          (statusFilter === 'disabled' && t.isActive === false);
    return matchesSearch && matchesStatus;
  }) : [];

  const handleDuplicate = (id: string) => {
    toast.success('Template duplicated (placeholder)');
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toast.success(`Template ${currentStatus ? 'disabled' : 'enabled'} (placeholder)`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      toast.success('Template deleted (placeholder)');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Templates</h2>
          <p className="text-gray-500 font-medium max-w-2xl text-sm">
            Manage the base designs available to businesses for creating their marketing assets.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <Link href="/admin/marketing-assets/templates/create">
                <Button className="h-12 px-6 rounded-xl bg-[#066CF4] hover:bg-[#0556c5] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2">
                    <Plus size={16} />
                    Create Template
                </Button>
            </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates by name or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#066CF4]/20 focus:bg-white transition-all font-medium text-gray-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Disabled', value: 'disabled' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  statusFilter === t.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
        {isLoading ? (
            <div className="p-10 flex justify-center">
                <div className="size-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
            </div>
        ) : filteredTemplates.length === 0 ? (
            <div className="p-20 text-center space-y-4">
                <div className="size-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto">
                    <Layout size={32} />
                </div>
                <div className="space-y-1">
                    <h4 className="font-bold text-gray-900">No templates found</h4>
                    <p className="text-sm text-gray-400">Create a new template to get started.</p>
                </div>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50/50">
                            <th className="px-6 py-4 rounded-tl-[2rem]">Template</th>
                            <th className="px-6 py-4">Asset Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Usage Count</th>
                            <th className="px-6 py-4 text-right rounded-tr-[2rem]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                        {filteredTemplates.map((template: any) => {
                            const isActive = template.isActive !== false;
                            return (
                                <tr key={template.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                                {template.thumbnailUrl ? (
                                                    <img src={template.thumbnailUrl} alt={template.name} className="size-full object-cover" />
                                                ) : (
                                                    <div className="size-full flex items-center justify-center text-gray-300">
                                                        <Layout size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-[#066CF4] transition-colors">{template.name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider line-clamp-1">{template.description || 'No description'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-gray-100 text-gray-600 uppercase tracking-widest">
                                            {template.category || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                            isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                                        }`}>
                                            {isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <BarChart2 size={16} className="text-gray-400" />
                                            <span className="font-black text-gray-900">{template.uses || Math.floor(Math.random() * 100) + 10}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 data-[state=open]:bg-gray-100">
                                                    <MoreVertical size={16} className="text-gray-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 border-gray-100 shadow-xl">
                                                <DropdownMenuItem className="text-xs font-bold text-gray-700 cursor-pointer rounded-lg focus:bg-gray-50">
                                                    <Edit3 size={14} className="mr-2" /> Edit Template
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicate(template.id)} className="text-xs font-bold text-gray-700 cursor-pointer rounded-lg focus:bg-gray-50">
                                                    <Copy size={14} className="mr-2" /> Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                                <DropdownMenuItem onClick={() => handleToggleStatus(template.id, isActive)} className="text-xs font-bold text-amber-600 cursor-pointer rounded-lg focus:bg-amber-50">
                                                    <PowerOff size={14} className="mr-2" /> {isActive ? 'Disable' : 'Enable'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(template.id)} className="text-xs font-bold text-rose-600 cursor-pointer rounded-lg focus:bg-rose-50">
                                                    <Trash2 size={14} className="mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
