import React from 'react';
import Modal from '@/components/ui/Modal';
import { QrPreview } from '../components/QrPreview';
import { QrThriveQRCode } from '@/services/qr-thrive/types';
import { Download, ExternalLink, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

interface QrViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  qr: QrThriveQRCode | null;
}

export default function QrViewModal({ isOpen, onClose, qr }: QrViewModalProps) {
  if (!qr) return null;

  const qrRef = React.useRef<any>(null);

  const handleDownload = (format: 'png' | 'svg') => {
    if (qrRef.current) {
      qrRef.current.download({
        name: qr.name,
        extension: format
      });
      toast.success(`${format.toUpperCase()} download started`);
    } else {
      toast.error("QR Code not ready for download");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={qr.name}
      description={`${qr.type.toUpperCase()} • ${qr.isDynamic ? 'Dynamic' : 'Static'} QR Code`}
      size="lg"
    >
      <div className="flex flex-col items-center gap-8">
        <div className="w-full aspect-square max-w-[400px] bg-slate-50 rounded-[3rem] border border-slate-100 overflow-hidden shadow-inner flex items-center justify-center p-4">
          <QrPreview
            data={qr.shortUrl}
            design={qr.design}
            frame={qr.frame}
            logo={qr.logo}
            width={320}
            height={320}
            onReady={(inst) => qrRef.current = inst}
          />
        </div>

        <div className="w-full space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination URL</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{qr.shortUrl}</p>
                </div>
                <a 
                    href={qr.shortUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => handleDownload('png')}
                    className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                    <Download className="w-4 h-4" /> Download PNG
                </button>
                <button
                    onClick={() => handleDownload('svg')}
                    className="flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Download className="w-4 h-4" /> Download SVG
                </button>
            </div>
        </div>
      </div>
    </Modal>
  );
}
