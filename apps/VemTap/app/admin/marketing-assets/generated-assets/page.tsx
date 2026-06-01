"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMarketingAssets, useDeleteMarketingAsset } from '@/services/marketing-assets/hooks';
import { FileText, Search, Trash2, Eye, Download, Layers, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminGeneratedAssetsPage() {
  const { data: assets, isLoading } = useMarketingAssets();
  const deleteMutation = useDeleteMarketingAsset();
  const [search, setSearch] = useState('');

  const filteredAssets = assets
    ? assets.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset from the platform?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Asset deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white font-medium text-gray-800"
          />
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
          <h4 className="font-bold text-gray-900">No generated assets found.</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredAssets.map((asset, idx) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div
                style={{ backgroundColor: asset.customConfig?.backgroundColor || '#0F172A' }}
                className="aspect-[4/5] relative overflow-hidden flex items-center justify-center p-6 border-b border-gray-50"
              >
                {asset.customConfig?.elements ? (
                  <div className="relative w-full h-full overflow-hidden rounded-lg pointer-events-none">
                    <div style={{ backgroundColor: asset.customConfig.accentColor || '#2563EB' }} className="absolute top-0 left-0 right-0 h-1" />
                    {asset.customConfig.elements.map((el: any) => {
                      if (el.type === 'text') {
                        return (
                          <div
                            key={el.id}
                            style={{
                              position: 'absolute',
                              left: `${el.x}%`, top: `${el.y}%`,
                              fontSize: `${Math.max(4.5, el.fontSize * 0.35)}px`,
                              color: el.color || '#FFFFFF',
                              fontWeight: el.fontWeight || 'normal',
                              textAlign: el.alignment || 'left',
                              width: '100%', maxWidth: `${100 - el.x * 2}%`,
                            }}
                            className="truncate leading-none font-bold"
                          >
                            {el.text}
                          </div>
                        );
                      }
                      if (el.type === 'qr_code') {
                        return (
                          <div
                            key={el.id}
                            style={{
                              position: 'absolute', left: `${el.x}%`, top: `${el.y}%`,
                              width: `${el.size ? el.size * 0.35 : 40}%`, aspectRatio: '1/1',
                            }}
                            className="bg-white p-1 rounded-md shadow-sm flex items-center justify-center"
                          >
                            <QRCodeSVG value={asset.qrCodeContent || 'https://vemtap.com'} size={45} fgColor={asset.qrCodeConfig?.color || '#000000'} bgColor={asset.qrCodeConfig?.backgroundColor || '#FFFFFF'} />
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-2xl shadow-lg">
                    <QRCodeSVG value={asset.qrCodeContent} size={110} fgColor={asset.qrCodeConfig?.color || '#000000'} bgColor={asset.qrCodeConfig?.backgroundColor || '#FFFFFF'} />
                  </div>
                )}
                <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/20 backdrop-blur text-[8px] font-extrabold text-white rounded-md uppercase">
                  {asset.type.replace('_', ' ')}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <h4 className="font-extrabold text-gray-900 text-sm line-clamp-1">{asset.name}</h4>
                <p className="text-xs text-gray-400 font-mono line-clamp-1 flex items-center gap-1">
                  <ExternalLink size={12} />
                  {asset.qrCodeContent}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400 font-semibold border-t border-gray-50 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>{new Date(asset.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button
                      onClick={() => window.open(`/dashboard/marketing-assets/create?templateId=${asset.templateId}&id=${asset.id}`, '_blank')}
                      variant="outline" className="flex-1 rounded-xl text-[10px] font-bold h-7 border-gray-100 gap-1 px-2"
                    >
                      <Eye size={11} /> View
                    </Button>
                    <Button
                      onClick={() => window.open(`/dashboard/marketing-assets/create?templateId=${asset.templateId}&id=${asset.id}&export=png`, '_blank')}
                      variant="outline" className="rounded-xl text-[10px] font-bold h-7 border-blue-100 text-blue-600 gap-1 px-2 hover:bg-blue-50"
                      title="Download PNG"
                    >
                      <Download size={11} /> PNG
                    </Button>
                    <Button
                      onClick={() => window.open(`/dashboard/marketing-assets/create?templateId=${asset.templateId}&id=${asset.id}&export=pdf`, '_blank')}
                      variant="outline" className="rounded-xl text-[10px] font-bold h-7 border-green-100 text-green-600 gap-1 px-2 hover:bg-green-50"
                      title="Download PDF"
                    >
                      <Download size={11} /> PDF
                    </Button>
                    <Button
                      onClick={() => handleDelete(asset.id)}
                      variant="outline" className="rounded-xl text-[10px] font-bold h-7 border-rose-100 text-rose-500 gap-1 px-2 hover:bg-rose-50"
                    >
                      <Trash2 size={11} />
                    </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
