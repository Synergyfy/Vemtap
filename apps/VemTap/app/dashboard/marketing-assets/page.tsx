"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, QrCode, Plus, Layout, 
  Trash2, Copy, Archive, Calendar, ExternalLink, Edit3, Layers
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useMarketingAssets,
  useAnalyticsOverview,
  useDeleteMarketingAsset,
  useCreateMarketingAsset,
  useUpdateMarketingAsset
} from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { MarketingAssetPreview } from '@/components/dashboard/MarketingAssetPreview';
import toast from 'react-hot-toast';

export default function MarketingAssetsDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetIdToView = searchParams.get('view');

  const { data: assets, isLoading: assetsLoading } = useMarketingAssets();
  const { data: analytics } = useAnalyticsOverview();
  const { data: business } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  const { activeBranchId } = useActiveBranch();
  
  const deleteMutation = useDeleteMarketingAsset();
  const createMutation = useCreateMarketingAsset();
  const updateMutation = useUpdateMarketingAsset();

  const activeBranch = branches.find((b: any) => b.id === activeBranchId) || branches[0];
  const businessLogo = business?.logoUrl || activeBranch?.logoUrl || '';
  const branchName = activeBranch?.name || business?.name || 'Vemtap';

  const totals = analytics?.totals || { scans: 0, views: 0, downloads: 0 };
  const createdAssetsCount = assets?.filter((a: any) => !a.isMock && a.isActive !== false).length || 0;

  // Modal State for viewing asset
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const params = new URLSearchParams(searchParams.toString());
    params.delete('view');
    router.replace(`/dashboard/marketing-assets?${params.toString()}`);
  };

  const handleOpenAsset = (asset: any) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', asset.id);
    router.push(`/dashboard/marketing-assets?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this marketing asset?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Asset deleted successfully');
      if (selectedAsset?.id === id) handleCloseModal();
    } catch (e) {
      toast.error('Failed to delete asset');
    }
  };

  const handleDownload = async (asset: any) => {
    toast.success(`Opening print export for ${asset.name}`);
    const params = new URLSearchParams();
    if (asset.templateId) params.set('templateId', asset.templateId);
    params.set('id', asset.id);
    params.set('export', 'png');
    router.push(`/dashboard/marketing-assets/create?${params.toString()}`);
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

  const filteredAssets = assets ? assets.filter((a: any) => !a.isMock && a.isActive !== false) : [];

  if (assetsLoading) {
    return (
        <div className="flex items-center justify-center h-[50vh] bg-transparent">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );
  }

  return (
    <div className="pb-32 space-y-12">
      {/* Header Section */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Marketing Kit
        </h1>
        <p className="text-sm font-medium text-gray-500 max-w-lg mx-auto leading-relaxed">
            Create posters, flyers, banners, business cards, and social graphics using your QR code.
        </p>
      </section>

      {/* Primary Action */}
      <section className="flex justify-center">
        <Link href="/dashboard/marketing-assets/create">
            <Button className="h-16 px-10 rounded-2xl bg-[#066CF4] text-white text-sm font-bold uppercase tracking-wider shadow-xl shadow-blue-500/20 hover:bg-[#0556c5] transition-all active:scale-95 group flex items-center gap-3">
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                Create Kit
            </Button>
        </Link>
      </section>

      {/* Stats Summary - ONLY 3 Cards as requested */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          { label: 'Assets Created', value: createdAssetsCount, icon: Layout, color: 'bg-blue-50 text-[#066CF4]' },
          { label: 'Downloads', value: totals.downloads || 0, icon: Download, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total Scans', value: totals.scans || 0, icon: QrCode, color: 'bg-amber-50 text-amber-600' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3"
          >
            <div className={cn("size-12 rounded-xl flex items-center justify-center", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      <hr className="border-gray-100" />

      {/* Existing Assets List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-gray-900">Your Assets</h2>
        </div>
        
        {filteredAssets.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                <div className="inline-flex size-16 bg-gray-50 text-gray-300 rounded-3xl items-center justify-center">
                    <Layers size={32} />
                </div>
                <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 text-lg">Your first marketing asset is waiting to be created</h4>
                    <p className="text-sm text-gray-400 font-medium">Click the button above to get started.</p>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAssets.map((asset, idx) => (
                    <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-gray-200 transition-all group flex flex-col justify-between"
                    >
                        <div 
                            onClick={() => handleOpenAsset(asset)}
                            className="cursor-pointer relative overflow-hidden bg-gray-50 aspect-[4/5] flex items-center justify-center border-b border-gray-50"
                        >
                            <MarketingAssetPreview 
                                asset={asset} 
                                scale={0.7} 
                                businessLogo={businessLogo}
                                className="group-hover:scale-[1.03] transition-transform duration-500 shadow-sm" 
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl text-primary font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                                    <ExternalLink size={14} /> View Details
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-bold text-gray-900 text-base line-clamp-1 flex-1">{asset.name}</h4>
                                    <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg uppercase shrink-0">
                                        {asset.type.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(asset.updatedAt).toLocaleDateString()}</div>
                                    <div className="flex items-center gap-1 text-amber-500"><QrCode size={12} /> {(asset as any).scanCount || 0} Scans</div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <Button 
                                    onClick={() => handleDownload(asset)}
                                    className="flex-1 rounded-xl bg-gray-900 hover:bg-black text-white font-bold h-10 text-[10px] uppercase tracking-wider"
                                >
                                    Download
                                </Button>
                                <Link href={`/dashboard/marketing-assets/create?${asset.templateId ? `templateId=${asset.templateId}&` : ''}id=${asset.id}`} className="flex-1">
                                    <Button className="w-full rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 font-bold h-10 text-[10px] uppercase tracking-wider">
                                        Edit
                                    </Button>
                                </Link>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} 
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white shrink-0 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </section>

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
                <h2 className="text-2xl font-bold text-gray-900">{selectedAsset.name}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-[#066CF4] bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-wider">
                    {selectedAsset.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                    <Calendar size={14} />
                    <span>Created {new Date(selectedAsset.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDuplicate(selectedAsset)}
                  className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all active:scale-95"
                  title="Duplicate Asset"
                >
                  <Copy size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(selectedAsset.id)}
                  className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all active:scale-95"
                  title="Delete Asset"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-gray-50 flex items-center justify-center py-8">
                <MarketingAssetPreview 
                  asset={selectedAsset} 
                  scale={1.0} 
                  businessLogo={businessLogo}
                />
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Asset Details</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500 font-bold">Branch</span>
                      <span className="text-xs text-gray-900 font-bold">
                        {branches.find(b => b.id === selectedAsset.branchId)?.name || 'Main Branch'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500 font-bold">Total Scans</span>
                      <span className="text-xs text-emerald-600 font-bold">
                        {selectedAsset.scanCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-bold">Dimensions</span>
                      <span className="text-xs text-gray-900 font-bold uppercase">
                        {selectedAsset.customConfig?.dimensions?.width}x{selectedAsset.customConfig?.dimensions?.height} {selectedAsset.customConfig?.dimensions?.unit || 'in'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => handleDownload(selectedAsset)}
                    className="w-full h-14 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-2xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-black/10"
                  >
                    <Download size={18} />
                    Download PNG
                  </Button>
                  <Link 
                    href={`/dashboard/marketing-assets/create?${selectedAsset.templateId ? `templateId=${selectedAsset.templateId}&` : ''}id=${selectedAsset.id}`}
                    className="w-full"
                  >
                    <Button 
                      variant="outline"
                      className="w-full h-14 border-2 border-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <Edit3 size={18} />
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
