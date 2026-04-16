'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, MoreVertical, ExternalLink, BarChart3, 
  Trash2, Edit2, Globe, Copy, Archive, Loader2, Download,
  X, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QrThriveQRCode } from '@/services/qr-thrive/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface QrGridProps {
  codes: QrThriveQRCode[];
  onEdit: (code: QrThriveQRCode) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string, currentStatus: string) => void;
  onViewStats: (code: QrThriveQRCode) => void;
  onDownload?: (code: QrThriveQRCode, format: 'png' | 'svg' | 'jpeg') => void;
  isLoading?: boolean;
}

export const QrGrid: React.FC<QrGridProps> = ({ 
  codes, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onArchive, 
  onViewStats,
  onDownload,
  isLoading 
}) => {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this QR code? This action cannot be undone.')) {
      onDelete(id);
      toast.success('QR Code deleted');
      setMenuOpen(null);
    }
  };

  const handleDuplicate = (id: string) => {
    onDuplicate(id);
    toast.success('QR Code duplicated');
    setMenuOpen(null);
  };

  const handleArchive = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
    onArchive(id, newStatus);
    toast.success(newStatus === 'archived' ? 'QR Code archived' : 'QR Code restored');
    setMenuOpen(null);
  };

  const handleDownload = (id: string, format: 'png' | 'svg' | 'jpeg') => {
    const qr = codes.find(c => c.id === id);
    if (qr && onDownload) {
      onDownload(qr, format);
    } else if (qr) {
      const link = document.createElement('a');
      link.href = qr.shortUrl;
      link.download = `${qr.name}.${format}`;
      link.click();
      toast.success('Download started');
    }
    setMenuOpen(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading your QR codes...</p>
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
          <QrCode className="w-10 h-10 text-slate-200" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No QR Codes yet</h3>
        <p className="text-slate-400 max-w-sm text-center mb-8">
          Start by creating your first branded QR code. It only takes a few seconds!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {codes.map((qr) => (
        <div 
          key={qr.id} 
          className="bg-white rounded-[32px] border border-slate-100 p-6 hover:shadow-xl hover:shadow-blue-900/5 transition-all group flex flex-col relative"
        >
          {qr.status === 'archived' && (
            <div className="absolute top-4 right-20 px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full">
              Archived
            </div>
          )}

          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[160px]">
                  {qr.name}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {qr.type} • {qr.isDynamic ? 'Dynamic' : 'Static'}
                </p>
              </div>
            </div>
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setMenuOpen(menuOpen === qr.id ? null : qr.id)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {menuOpen === qr.id && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => { onEdit(qr); setMenuOpen(null); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDuplicate(qr.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                  <button 
                    onClick={() => handleArchive(qr.id, qr.status)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Archive className="w-4 h-4" /> {qr.status === 'archived' ? 'Restore' : 'Archive'}
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <div className="px-4 py-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Download</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDownload(qr.id, 'png')}
                        className="flex-1 flex items-center justify-center py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        PNG
                      </button>
                      <button 
                        onClick={() => handleDownload(qr.id, 'svg')}
                        className="flex-1 flex items-center justify-center py-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        SVG
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 my-1" />
                  <button 
                    onClick={() => handleDelete(qr.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-slate-50 rounded-2xl p-4 mb-6 flex items-center gap-4 border border-slate-100">
            <div className="w-20 h-20 bg-white rounded-xl shadow-inner flex items-center justify-center p-3 relative group/qr">
               <QrCode className="w-full h-full text-slate-900" />
               <a 
                href={qr.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-xl flex items-center justify-center"
              >
                <ExternalLink className="w-6 h-6 text-blue-600" />
               </a>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Updated</p>
              <p className="text-xs font-bold text-slate-600">{format(new Date(qr.updatedAt), 'MMM d, yyyy')}</p>
              <a 
                href={qr.shortUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] font-bold text-blue-600 hover:underline truncate block"
              >
                {qr.shortUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
            <button 
              onClick={() => onViewStats(qr)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{qr.scans} Scans</span>
            </button>
            <button 
              onClick={() => onEdit(qr)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QrGrid;