'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, FolderPlus, MoreVertical, 
    Trash2, Archive, Copy, Download, Edit3,
    Play, Pause, ChevronRight, LayoutGrid, List,
    Check, X, Folder, ArrowRight, QrCode
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQrThriveStore } from '@/store/useQrThriveStore';

export function QRThriveManagementView({ codes }: { codes: any[] }) {
    const { folders, createFolder, setView } = useQrThriveStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">Manage QR Codes</h2>
                    <p className="text-sm font-medium text-gray-500 mt-1">Organize and optimize your dynamic experiences.</p>
                </div>
                <div className="flex items-center gap-3">
                   <Button variant="ghost" onClick={() => setView('hub')} className="text-[10px] font-black uppercase tracking-widest text-gray-400">Back to Hub</Button>
                   <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                      <button 
                          onClick={() => setViewMode('grid')}
                          className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600")}
                      >
                         <LayoutGrid size={18} />
                      </button>
                      <button 
                          onClick={() => setViewMode('list')}
                          className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600")}
                      >
                         <List size={18} />
                      </button>
                   </div>
                </div>
            </div>

            {/* FOLDERS SECTION */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Folders</h3>
                    <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-[#066CF4]">
                        <FolderPlus size={14} className="mr-2" /> New Folder
                    </Button>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                    <button 
                        onClick={() => setSelectedFolder(null)}
                        className={cn(
                            "flex flex-col gap-3 p-6 rounded-[32px] min-w-[160px] border transition-all active:scale-95",
                            selectedFolder === null ? "bg-gray-900 text-white border-gray-900 shadow-xl" : "bg-white text-gray-900 border-gray-100 shadow-sm"
                        )}
                    >
                        <div className={cn("size-10 rounded-xl flex items-center justify-center", selectedFolder === null ? "bg-white/10" : "bg-gray-50")}>
                           <Folder size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black">All Codes</p>
                            <p className={cn("text-[9px] font-bold uppercase tracking-widest", selectedFolder === null ? "text-white/40" : "text-gray-400")}>{codes.length} Items</p>
                        </div>
                    </button>
                    {folders.map((f) => (
                        <button 
                            key={f.id}
                            onClick={() => setSelectedFolder(f.id)}
                            className={cn(
                                "flex flex-col gap-3 p-6 rounded-[32px] min-w-[160px] border transition-all active:scale-95",
                                selectedFolder === f.id ? "bg-[#066CF4] text-white border-[#066CF4] shadow-xl shadow-blue-500/20" : "bg-white text-gray-900 border-gray-100 shadow-sm"
                            )}
                        >
                            <div className={cn("size-10 rounded-xl flex items-center justify-center", selectedFolder === f.id ? "bg-white/20" : "bg-gray-50")}>
                               <Folder size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black">{f.name}</p>
                                <p className={cn("text-[9px] font-bold uppercase tracking-widest", selectedFolder === f.id ? "text-white/40" : "text-gray-400")}>{f.count} Items</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or type..."
                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white border border-gray-100 shadow-sm focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-14 px-6 rounded-2xl border-gray-100 bg-white font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#066CF4]">
                        <Filter size={16} className="mr-2" /> Filter
                    </Button>
                    <Button variant="outline" className="h-14 px-6 rounded-2xl border-gray-100 bg-white font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#066CF4]">
                        <Download size={16} className="mr-2" /> Export
                    </Button>
                </div>
            </div>

            {/* QR LIST */}
            <div className={cn(
                "grid gap-6",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
                {codes.length > 0 ? codes.map((qr) => (
                    <QRManagerCard key={qr.id} qr={qr} mode={viewMode} />
                )) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
                        <QrCode size={48} className="mx-auto mb-4 text-gray-200" />
                        <h4 className="text-lg font-black text-gray-900 mb-2">No QR codes yet</h4>
                        <p className="text-sm font-medium text-gray-400">Create your first QR experience to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function QRManagerCard({ qr, mode }: { qr: any, mode: 'grid' | 'list' }) {
    if (mode === 'list') {
        return (
            <div className="group flex items-center gap-6 p-4 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-xl transition-all">
                <div className="size-16 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:scale-105 transition-transform">
                    <QrCode size={32} className="text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-black text-gray-900 truncate">{qr.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{qr.type} • Created {qr.date}</p>
                </div>
                <div className="flex items-center gap-12 px-8 border-x border-gray-50">
                    <div className="text-center">
                        <p className="text-sm font-black text-gray-900">{qr.scans}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-300">Scans</p>
                    </div>
                    <Badge className={cn(
                        "border-none font-black text-[8px] uppercase px-3 py-1",
                        qr.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                        {qr.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <button className="size-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:text-[#066CF4] transition-all"><Edit3 size={18} /></button>
                    <button className="size-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:text-[#066CF4] transition-all"><Download size={18} /></button>
                    <button className="size-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:text-[#066CF4] transition-all"><MoreVertical size={18} /></button>
                </div>
            </div>
        );
    }

    return (
        <div className="group p-8 rounded-[40px] bg-white border border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-8">
                <div className="size-24 rounded-[32px] bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <QrCode size={48} className="text-gray-300" />
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge className={cn(
                        "border-none font-black text-[8px] uppercase px-3 py-1",
                        qr.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                        {qr.status}
                    </Badge>
                    <button className="size-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <h4 className="text-lg font-black text-gray-900 leading-tight mb-1 truncate">{qr.name}</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{qr.type}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-3xl bg-gray-50 border border-gray-100 mb-8">
                <div className="text-center">
                    <p className="text-lg font-black text-gray-900">{qr.scans}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Scans</p>
                </div>
                <div className="text-center border-l border-gray-200">
                    <p className="text-lg font-black text-[#066CF4]">82%</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Conv.</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button className="flex-1 h-12 rounded-2xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest group-hover:bg-[#066CF4] transition-all">
                    Edit QR
                </Button>
                <Button variant="outline" size="icon" className="size-12 rounded-2xl border-gray-100 hover:text-[#066CF4] transition-all">
                    <Download size={18} />
                </Button>
            </div>
        </div>
    );
}
