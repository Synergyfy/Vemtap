"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Layers,
  X,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useBranches } from '@/services/branches/hooks';
import { MarketingAssetPreview } from '@/components/dashboard/MarketingAssetPreview';
import Modal from '@/components/ui/Modal';

import { useMyBusiness } from '@/services/businesses/hooks';

export default function MyLibraryPage() {
  const { data: business } = useMyBusiness();
  const searchParams = useSearchParams();
  const router = useRouter();
  const assetIdToView = searchParams.get('view');
  
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

  const businessLogo = business?.logoUrl || (branches && branches.length > 0 ? (branches[0] as any)?.logoUrl : '') || '';

  // Modal State
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle URL-based view
  useEffect(() => {
    if (assetIdToView && assets) {
      const asset = assets.find((a: any) => a.id === assetIdToView);
      if (asset) {
        setSelectedAsset(asset);
        setIsModalOpen(true);
      }
    }
  }, [assetIdToView, assets]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
    // Remove the view param from URL without refreshing
    const params = new URLSearchParams(searchParams.toString());
    params.delete('view');
    router.replace(`/dashboard/marketing-assets/library?${params.toString()}`);
  };

  const handleOpenAsset = (asset: any) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', asset.id);
    router.push(`/dashboard/marketing-assets/library?${params.toString()}`);
  };

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset, idx) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div 
                  onClick={() => handleOpenAsset(asset)}
                  className="cursor-pointer relative overflow-hidden"
                >
                  <MarketingAssetPreview 
                    asset={asset} 
                    scale={0.6} 
                    businessLogo={businessLogo}
                    className="group-hover:scale-[1.02] transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                      <ExternalLink size={16} className="text-primary" />
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-gray-900 line-clamp-1 leading-tight text-sm flex-1">{asset.name}</h4>
                    <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase shrink-0">
                      {asset.type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-400 font-semibold">
                    <div className="flex items-center gap-1"><Calendar size={11} /><span>{new Date(asset.updatedAt).toLocaleDateString()}</span></div>
                    {asset.isActive === false && <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[8px] font-extrabold uppercase border border-rose-200">Archived</span>}
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    <Button 
                      onClick={() => handleOpenAsset(asset)}
                      className="flex-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold h-8 text-[10px] border-none shadow-none"
                    >
                      View
                    </Button>
                    <Link href={`/dashboard/marketing-assets/create?templateId=${asset.templateId}&id=${asset.id}`} className="flex-1">
                      <Button className="w-full rounded-lg bg-primary text-white font-bold h-8 text-[10px]">Edit</Button>
                    </Link>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} 
                      className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 shrink-0 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Asset Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="lg"
      >
        {selectedAsset && (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">{selectedAsset.name}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedAsset.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Calendar size={12} />
                    <span>Created {new Date(selectedAsset.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDuplicate(selectedAsset)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all active:scale-95"
                  title="Duplicate Asset"
                >
                  <Copy size={20} />
                </button>
                <button 
                  onClick={() => handleToggleArchive(selectedAsset)}
                  className={`p-2.5 rounded-xl transition-all active:scale-95 ${selectedAsset.isActive === false ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}
                  title={selectedAsset.isActive === false ? 'Restore Asset' : 'Archive Asset'}
                >
                  <Archive size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
                <MarketingAssetPreview 
                  asset={selectedAsset} 
                  scale={1.2} 
                  businessLogo={businessLogo}
                />
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 space-y-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Asset Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold">Branch</span>
                      <span className="text-xs text-slate-900 font-black">
                        {branches.find(b => b.id === selectedAsset.branchId)?.name || 'Main Branch'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold">Format</span>
                      <span className="text-xs text-slate-900 font-black uppercase">
                        {selectedAsset.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold">Dimensions</span>
                      <span className="text-xs text-slate-900 font-black">
                        {selectedAsset.customConfig?.dimensions?.width}x{selectedAsset.customConfig?.dimensions?.height} {selectedAsset.customConfig?.dimensions?.unit || 'in'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => handleDownload(selectedAsset)}
                    className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-95 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <Download size={20} />
                    Download for Print
                  </Button>
                  <Link 
                    href={`/dashboard/marketing-assets/create?templateId=${selectedAsset.templateId}&id=${selectedAsset.id}`}
                    className="w-full"
                  >
                    <Button 
                      variant="outline"
                      className="w-full h-14 border-2 border-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <Edit3 size={20} />
                      Edit Design
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
