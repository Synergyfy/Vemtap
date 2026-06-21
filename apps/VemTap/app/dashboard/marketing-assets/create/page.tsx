"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Layout,
  Download,
  Printer,
  Save
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Button } from '@/components/ui/button';
import MarketingAssetEditor, { EditorElement } from '@/components/dashboard/marketing/MarketingAssetEditor';
import {
  useCreateMarketingAsset,
  useMarketingTemplates,
} from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

type CreateStep = 'gallery' | 'editor' | 'preview';

export default function CreateAssetWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'poster';
  const templateId = searchParams.get('templateId');

  // API Hooks
  const { data: templates = [], isLoading: templatesLoading } = useMarketingTemplates(undefined, type);
  const { data: business } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  const { activeBranchId } = useActiveBranch();
  const activeBranch = branches.find((b: any) => b.id === activeBranchId) || branches[0];
  const createAssetMutation = useCreateMarketingAsset();

  // Navigation State
  const [step, setStep] = useState<CreateStep>(templateId ? 'editor' : 'gallery');

  // Editor State
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [bgImage, setBgImage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const qrUrl = useMemo(() => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vemtap.com';
      return activeBranch?.uniqueCode ? `${origin}/${activeBranch.uniqueCode}` : `${origin}/your-business`;
  }, [activeBranch]);

  const businessLogo = activeBranch?.logoUrl || business?.logoUrl || '';

  // Initial template load if templateId provided
  useEffect(() => {
    if (templateId && templates.length > 0) {
        const t = templates.find((tpl: any) => tpl.id === templateId);
        if (t && step !== 'preview') {
          handleSelectTemplate(t);
        }
    }
  }, [templateId, templates]);

  const handleBack = () => {
    if (step === 'preview') {
      setStep('editor');
    } else if (step === 'editor' && !templateId) {
      setStep('gallery');
    } else {
      router.push('/dashboard/marketing-assets');
    }
  };

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    const config = tpl.layoutConfig || {};
    setElements(config.elements || []);
    setBgColor(config.backgroundColor || '#FFFFFF');
    setBgImage(config.backgroundImage || '');
    setStep('editor');
    window.scrollTo(0, 0);
  };

  const handleSaveAndPreview = () => {
    setStep('preview');
    window.scrollTo(0, 0);
  };

  const [isExporting, setIsGeneratingExport] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  const handleSaveAndExport = async (format: 'png' | 'pdf') => {
    if (!downloadRef.current) return;
    setIsGeneratingExport(true);
    const toastId = toast.loading(format === 'pdf' ? 'Preparing PDF...' : 'Saving & Exporting...');

    try {
        const dataUrl = await htmlToImage.toPng(downloadRef.current, { quality: 1, pixelRatio: 3 });
        
        if (format === 'pdf') {
            const win = window.open('', '_blank');
            win?.document.write(`<html><body style="margin:0;display:flex;justify-content:center;"><img src="${dataUrl}" style="max-width:100%; height:auto;" onload="window.print(); window.close();"/></body></html>`);
            win?.document.close();
        } else {
            const link = document.createElement('a');
            link.download = `${type}-asset.png`;
            link.href = dataUrl;
            link.click();
        }

        // Save to Library seamlessly
        await createAssetMutation.mutateAsync({
            name: selectedTemplate?.name || `${type.replace('_', ' ')} Design`,
            templateId: selectedTemplate?.id,
            type: type,
            branchId: activeBranchId as string,
            customConfig: { elements, backgroundColor: bgColor, backgroundImage: bgImage },
            qrCodeContent: qrUrl
        });

        toast.success('Asset saved to library!', { id: toastId });
        
        if (format === 'png') {
            router.push('/dashboard/marketing-assets');
        }
    } catch (err) {
        toast.error('Export failed', { id: toastId });
    } finally {
        setIsGeneratingExport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
              <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Create Kit</h1>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">
                {step === 'gallery' ? 'STEP 1: CHOOSE TEMPLATE' : step === 'editor' ? 'STEP 2: CUSTOMIZE' : 'STEP 3: PREVIEW & DOWNLOAD'}
              </p>
          </div>
        </div>
        {step === 'editor' && (
          <Button onClick={handleSaveAndPreview} className="h-10 px-6 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Preview <ChevronRight size={14} className="ml-1" />
          </Button>
        )}
      </header>

      <main className="max-w-6xl mx-auto pt-8 px-4 sm:px-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: TEMPLATE GALLERY */}
          {step === 'gallery' && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex flex-col space-y-2">
                    <h2 className="text-2xl font-black text-gray-900">Choose a Template</h2>
                    <p className="text-sm font-medium text-gray-500">Select a design. Your QR code will be automatically added.</p>
                </div>

                {templatesLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-[4/5] bg-gray-100 rounded-3xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {templates.map((tpl: any) => (
                          <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)} className="group space-y-4 text-left">
                              <div className="aspect-[4/5] bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative group-hover:border-[#066CF4]/40 group-hover:shadow-xl transition-all">
                                  {tpl.thumbnailUrl ? (
                                      <img src={tpl.thumbnailUrl} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  ) : (
                                      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                          <Layout size={40} className="text-gray-200" />
                                      </div>
                                  )}
                              </div>
                              <div className="px-2">
                                  <h4 className="text-sm font-black text-gray-900 group-hover:text-[#066CF4] transition-colors">{tpl.name}</h4>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{tpl.category || type.replace('_', ' ')}</p>
                              </div>
                          </button>
                      ))}
                  </div>
                )}
            </motion.div>
          )}

          {/* STEP 2: EDITOR */}
          {step === 'editor' && (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <div className="min-h-[700px]">
                    <MarketingAssetEditor 
                        initialElements={elements}
                        backgroundColor={bgColor}
                        backgroundImage={bgImage}
                        businessLogo={businessLogo}
                        qrUrl={qrUrl}
                        mode="business"
                        onChange={(data) => {
                            setElements(data.elements);
                            setBgColor(data.backgroundColor);
                            setBgImage(data.backgroundImage || '');
                        }}
                    />
                </div>
            </motion.div>
          )}

          {/* STEP 3: PREVIEW & DOWNLOAD */}
          {step === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-12 pb-20">
                <div className="flex flex-col lg:flex-row items-start gap-12">
                    <div className="flex-1 w-full flex justify-center">
                        <div id="export-container" ref={downloadRef} className="shadow-2xl ring-[16px] ring-white rounded-[2rem] overflow-hidden" style={{ width: 320, backgroundColor: bgColor }}>
                            <div className="w-full aspect-[4/6] relative overflow-hidden" style={{ backgroundColor: bgColor, backgroundImage: bgImage ? `url(${bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {elements.map(el => (
                                    <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: el.width ? `${el.width}%` : 'auto', zIndex: el.type === 'logo' ? 30 : 10 }}>
                                        {el.type === 'text' && <div style={{ color: el.color, fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight, textAlign: el.alignment }} className="w-full leading-tight">{el.text}</div>}
                                        {el.type === 'qr' && <div className="bg-white p-2 rounded-2xl flex items-center justify-center"><QRCodeSVG value={el.qrContent || qrUrl} size={el.size} /></div>}
                                        {el.type === 'logo' && businessLogo && <img src={businessLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-80 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                            <div className="space-y-2 text-center">
                              <h3 className="text-xl font-black text-gray-900">Looking Good!</h3>
                              <p className="text-xs text-gray-500 font-medium">Your design is ready to be shared with the world.</p>
                            </div>
                            
                            <div className="space-y-3 pt-4 border-t border-gray-50">
                              <Button 
                                onClick={() => handleSaveAndExport('png')} 
                                disabled={isExporting}
                                className="w-full h-14 bg-[#066CF4] hover:bg-[#0556c5] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl gap-3 shadow-xl shadow-blue-500/20"
                              >
                                  <Download size={16} /> Download Image
                              </Button>
                              <Button 
                                onClick={() => handleSaveAndExport('pdf')} 
                                disabled={isExporting}
                                variant="outline" 
                                className="w-full h-14 border-2 border-gray-100 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 gap-3"
                              >
                                  <Printer size={16} /> Print as PDF
                              </Button>
                            </div>
                        </div>
                        <button onClick={() => setStep('editor')} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">
                            <ChevronLeft size={16} /> Back to Editor
                        </button>
                    </div>
                </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
