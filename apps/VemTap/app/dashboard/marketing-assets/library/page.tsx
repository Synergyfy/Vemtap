"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  useMarketingAssets, 
  useDeleteMarketingAsset, 
  useCreateMarketingAsset, 
  useUpdateMarketingAsset 
} from '@/services/marketing-assets/hooks';
import { 
  QrCode, 
  Search, 
  Trash2, 
  Download, 
  Calendar, 
  Copy, 
  Archive, 
  Filter,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { useBranches } from '@/services/branches/hooks';

export default function MyLibraryPage() {
  const { data: assets, isLoading } = useMarketingAssets();
  const deleteMutation = useDeleteMarketingAsset();
  const createMutation = useCreateMarketingAsset();
  const updateMutation = useUpdateMarketingAsset();
  const { data: branches = [] } = useBranches();

  // Toolbar filters states
  const [search, setSearch] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');


  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this marketing asset from your library?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Asset deleted successfully');
    } catch (e) {
      toast.error('Failed to delete asset');
    }
  };

  const handleDownload = async (asset: any) => {
    toast.success(`Opening print export for ${asset.name}`);
    window.location.href = `/dashboard/marketing-assets/create?templateId=${asset.templateId}&id=${asset.id}&export=png`;
  };

  const handleDuplicate = async (asset: any) => {
    try {
      const payload = {
        name: `Copy of ${asset.name}`,
        templateId: asset.templateId || undefined,
        type: asset.type,
        qrCodeContent: asset.qrCodeContent,
        customConfig: asset.customConfig,
        qrCodeConfig: asset.qrCodeConfig,
        branchId: asset.branchId || undefined,
        isActive: true
      };
      await createMutation.mutateAsync(payload);
      toast.success('Asset duplicated successfully!');
    } catch (e) {
      toast.error('Failed to duplicate asset');
    }
  };

  const handleToggleArchive = async (asset: any) => {
    const isArchiving = asset.isActive !== false;
    try {
      await updateMutation.mutateAsync({ 
        id: asset.id, 
        updates: { isActive: !isArchiving } 
      });
      toast.success(`Asset ${isArchiving ? 'archived' : 'restored'} successfully`);
    } catch (e) {
      toast.error('Failed to update asset status');
    }
  };

  // Local filtering logic
  const filteredAssets = assets ? assets.filter((asset: any) => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                          asset.qrCodeContent.toLowerCase().includes(search.toLowerCase());
    const matchesFormat = selectedFormat === 'all' || asset.type === selectedFormat;
    const matchesBranch = selectedBranch === 'all' || asset.branchId === selectedBranch;
    
    const assetIsActive = asset.isActive !== false;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && assetIsActive) ||
                          (statusFilter === 'archived' && !assetIsActive);
                          
    return matchesSearch && matchesFormat && matchesBranch && matchesStatus;
  }) : [];

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search custom layouts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium text-gray-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          {/* Format Filter */}
          <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
            <Filter size={13} className="text-gray-400" />
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="text-xs bg-transparent font-bold focus:outline-none text-gray-700 cursor-pointer"
            >
              <option value="all">All Formats</option>
              <option value="table_tent">Table Stand</option>
              <option value="poster_a4">A4 Poster</option>
              <option value="poster_a5">A5 Poster</option>
              <option value="flyer">Flyer</option>
              <option value="social_media">Social Media Post</option>
            </select>
          </div>

          {/* Branch Filter if multi-branch */}
          {branches.length > 1 && (
            <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs bg-transparent font-bold focus:outline-none text-gray-700 cursor-pointer"
              >
                <option value="all">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
            {[
              { label: 'Active', value: 'active' },
              { label: 'Archived', value: 'archived' },
              { label: 'All', value: 'all' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === t.value
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] bg-gray-50 border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 space-y-4">
          <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
            <Layers size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900">You have not created any assets yet.</h4>
          </div>
          <Link href="/dashboard/marketing-assets/templates">
            <Button className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl px-5">
              Create Your First Asset
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredAssets.map((asset, idx) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div 
                  style={{ backgroundColor: asset.customConfig?.backgroundColor || '#0F172A' }}
                  className="aspect-[4/5] relative overflow-hidden flex items-center justify-center p-6 border-b border-gray-50 select-none"
                >
                  {asset.customConfig?.elements ? (
                    <div className="relative w-full h-full overflow-hidden rounded-lg pointer-events-none">
                      <div style={{ backgroundColor: asset.customConfig.accentColor || '#2563EB' }} className="absolute top-0 left-0 right-0 h-1" />
                      {asset.customConfig.elements.map((el: any) => {
                        if (el.type === 'logo') {
                          return (
                            <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: `${el.width || 30}%`, height: `${el.height || 8}%` }}
                              className="flex items-center justify-center overflow-hidden">
                              <div style={{ backgroundColor: asset.customConfig.accentColor || '#2563EB' }} className="size-3 rounded-full flex items-center justify-center font-bold text-white text-[5px]">L</div>
                            </div>
                          );
                        }
                        if (el.type === 'text') {
                          return (
                            <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, fontSize: `${Math.max(4.5, el.fontSize * 0.35)}px`, color: el.color || '#FFFFFF', fontWeight: el.fontWeight || 'normal', textAlign: el.alignment || 'left', width: '100%', maxWidth: `${100 - el.x * 2}%` }}
                              className="truncate leading-none pointer-events-none select-none font-bold">{el.text}</div>
                          );
                        }
                        if (el.type === 'qr_code') {
                          return (
                            <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: `${el.size ? el.size * 0.35 : 40}%`, aspectRatio: '1/1' }}
                              className="bg-white p-1 rounded-md shadow-sm flex items-center justify-center">
                              <QRCodeSVG value={asset.qrCodeContent || 'https://vemtap.com'} size={45} fgColor={asset.qrCodeConfig?.color || '#000000'} bgColor={asset.qrCodeConfig?.backgroundColor || '#FFFFFF'} />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-200/20">
                      <QRCodeSVG value={asset.qrCodeContent} size={110} fgColor={asset.qrCodeConfig?.color || '#000000'} bgColor={asset.qrCodeConfig?.backgroundColor || '#FFFFFF'} />
                    </div>
                  )}
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/20 backdrop-blur text-[8px] font-extrabold text-white rounded-md uppercase tracking-wider">{asset.type.replace('_', ' ')}</span>
                  {branches.length > 1 && asset.branchId && (
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-slate-900/80 backdrop-blur text-[8px] font-extrabold text-white rounded-md uppercase">
                      {branches.find(b => b.id === asset.branchId)?.name || 'Main'}
                    </span>
                  )}
                </div>
                <div className="p-3 md:p-4 space-y-2">
                  <h4 className="font-extrabold text-gray-900 line-clamp-1 leading-tight text-sm">{asset.name}</h4>
                  <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-400 font-semibold">
                    <div className="flex items-center gap-1"><Calendar size={11} /><span>{new Date(asset.updatedAt).toLocaleDateString()}</span></div>
                    {asset.isActive === false && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[8px] font-extrabold uppercase border border-rose-200">Archived</span>}
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-gray-50">
                    <Link href={`/dashboard/marketing-assets/create?templateId=${asset.templateId}&id=${asset.id}`} className="flex-1">
                      <Button className="w-full rounded-lg bg-primary text-white font-bold h-7 text-[10px]">Edit</Button>
                    </Link>
                    <Button onClick={() => handleDownload(asset)} variant="outline" className="rounded-lg font-bold h-7 text-[10px] border-gray-100 px-2">Download</Button>
                    <button onClick={() => handleDelete(asset.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
