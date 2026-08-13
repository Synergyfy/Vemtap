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
  ImageIcon,
  Save,
  ArrowLeft,
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import MarketingAssetEditor, { EditorElement } from '@/components/dashboard/marketing/MarketingAssetEditor';
import {
  useCreateMarketingAsset,
  useMarketingTemplates,
  useMarketingAsset,
} from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

type CreateStep = 'gallery' | 'size_selection' | 'editor' | 'preview';

export default function CreateAssetWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'poster';
  const rawTemplateId = searchParams.get('templateId');
  const templateId = rawTemplateId && rawTemplateId !== 'null' && rawTemplateId !== 'undefined' ? rawTemplateId : null;
  const qrSource = searchParams.get('qrSource');
  const exportParam = searchParams.get('export');
  const assetId = searchParams.get('id');

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

  // Design Dimensions State
  const [sizeType, setSizeType] = useState<'portrait'|'landscape'|'square'>('portrait');
  const [designW, setDesignW] = useState(1080);
  const [designH, setDesignH] = useState(1350);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(320);

  const RATIOS: Record<string, number> = { square: 1, portrait: 1350/1080, landscape: 1080/1920 };

  const handleSizeTypeChange = (t: 'portrait'|'landscape'|'square') => {
      setSizeType(t);
      if (t === 'square') { setDesignW(1080); setDesignH(1080); }
      else if (t === 'portrait') { setDesignW(1080); setDesignH(1350); }
      else if (t === 'landscape') { setDesignW(1920); setDesignH(1080); }
  };

  const handleWidthChange = (val: number) => {
      setDesignW(val);
      if (maintainAspectRatio) {
          const r = RATIOS[sizeType];
          if (sizeType === 'square') setDesignH(val);
          else if (sizeType === 'portrait') setDesignH(Math.round(val * r));
          else if (sizeType === 'landscape') setDesignH(Math.round(val * r));
      }
  };

  const handleHeightChange = (val: number) => {
      setDesignH(val);
      if (maintainAspectRatio) {
          const r = RATIOS[sizeType];
          if (sizeType === 'square') setDesignW(val);
          else if (sizeType === 'portrait') setDesignW(Math.round(val / r));
          else if (sizeType === 'landscape') setDesignW(Math.round(val / r));
      }
  };

  const detectActualType = (w: number, h: number): 'square' | 'portrait' | 'landscape' => {
      if (w === 0 || h === 0) return sizeType;
      const ratio = w / h;
      if (ratio > 1.1) return 'landscape';
      if (ratio < 0.9) return 'portrait';
      return 'square';
  };

  const actualType = detectActualType(designW, designH);
  const showSizeWarning = !maintainAspectRatio && actualType !== sizeType;

  const qrUrl = useMemo(() => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vemtap.com';
      if (qrSource === 'catalogue') return `${origin}/dashboard/catalogue`;
      return activeBranch?.uniqueCode ? `${origin}/${activeBranch.uniqueCode}` : `${origin}/your-business`;
  }, [activeBranch, qrSource]);

  const businessLogo = activeBranch?.logoUrl || business?.logoUrl || '';

  const { data: existingAsset } = useMarketingAsset(assetId || '', !!assetId);

  // Populate editor from existing asset when id param is present
  useEffect(() => {
    if (existingAsset) {
      const cfg = existingAsset.customConfig || {};
      setElements(cfg.elements || []);
      setBgColor(cfg.backgroundColor || '#FFFFFF');
      setBgImage(cfg.backgroundImage || '');
      if (cfg.designW) setDesignW(cfg.designW);
      if (cfg.designH) setDesignH(cfg.designH);
      if (cfg.sizeType) setSizeType(cfg.sizeType);
      setSelectedTemplate(existingAsset);
      setStep('preview');
    }
  }, [existingAsset]);

  // Auto-open export dialog when export param is present
  useEffect(() => {
    if (exportParam && step === 'preview') {
      setShowExportDialog(true);
    }
  }, [exportParam, step]);

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
    } else if (step === 'editor') {
      setStep('size_selection');
    } else if (step === 'size_selection' && !templateId) {
      setStep('gallery');
    } else {
      router.push('/dashboard/marketing-assets');
    }
  };

  // Reset save state when user goes back to editor (design may change)
  useEffect(() => {
    if (step === 'editor' && !existingAsset) {
      isSavedRef.current = false;
      setHasSaved(false);
    }
  }, [step]);

  const handleSelectTemplate = (tpl: any) => {
    setSelectedTemplate(tpl);
    const config = tpl.layoutConfig || {};
    setElements(config.elements || []);
    setBgColor(config.backgroundColor || '#FFFFFF');
    setBgImage(config.backgroundImage || '');
    setStep('size_selection');
    window.scrollTo(0, 0);
  };

  const handleSaveAndPreview = () => {
    setStep('preview');
    window.scrollTo(0, 0);
  };

  const [isExporting, setIsGeneratingExport] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const isSavedRef = useRef(!!existingAsset);
  const downloadRef = useRef<HTMLDivElement>(null);

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf'>('png');
  const [selectedPreset, setSelectedPreset] = useState('social_media');
  const [customExportW, setCustomExportW] = useState(1080);
  const [customExportH, setCustomExportH] = useState(1080);

  const exportPresets = [
    { id: 'social_media', label: 'Social Media', w: 1080, h: 1080 },
    { id: 'poster', label: 'Poster (18×24 in)', w: 2400, h: 3200 },
    { id: 'flyer', label: 'Flyer (8.5×11 in)', w: 2400, h: 3106 },
    { id: 'table_tent', label: 'Table Tent (5×7 in)', w: 1500, h: 2100 },
    { id: 'custom', label: 'Custom Size', w: 0, h: 0 },
  ];

  const getExportDims = () => {
    if (selectedPreset === 'custom') return { w: customExportW || 1080, h: customExportH || 1080 };
    const p = exportPresets.find(x => x.id === selectedPreset);
    return { w: p?.w || 1080, h: p?.h || 1080 };
  };

  const saveToLibrary = async (): Promise<string | null> => {
    if (existingAsset) return existingAsset.id;
    if (isSavedRef.current) return null;
    setIsSaving(true);
    try {
      const result = await createAssetMutation.mutateAsync({
        name: selectedTemplate?.name || `${type.replace('_', ' ')} Design`,
        type: type,
        branchId: activeBranchId as string,
        customConfig: { elements, backgroundColor: bgColor, backgroundImage: bgImage, designW, designH, sizeType },
        qrCodeContent: qrUrl
      });
      isSavedRef.current = true;
      setHasSaved(true);
      return result.id;
    } catch {
      toast.error('Failed to save to library');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (existingAsset) { toast.success('Already in your library'); return; }
    if (isSavedRef.current) { toast.success('Already saved!'); return; }
    const toastId = toast.loading('Saving...');
    const id = await saveToLibrary();
    if (id) toast.success('Saved to library!', { id: toastId });
    else if (!isSavedRef.current) toast.error('Failed to save', { id: toastId });
    else toast.dismiss(toastId);
  };

  const handleSaveAndExport = async (format: 'png' | 'jpg' | 'pdf', targetW: number, targetH: number) => {
    if (!downloadRef.current) return;
    setIsGeneratingExport(true);
    const toastId = toast.loading(format === 'pdf' ? 'Preparing PDF...' : 'Exporting...');

    try {
        // Auto-save first if it's a new unsaved design
        if (!existingAsset && !isSavedRef.current) {
          await saveToLibrary();
        }

        const el = downloadRef.current;
        const inner = el.firstElementChild as HTMLElement | null;

        const origOuterW = el.style.width;
        const origInnerStyle = inner?.getAttribute('style') || '';

        const DISPLAY_MAX_W = 600;
        const displayW = Math.min(targetW, DISPLAY_MAX_W);
        const displayH = Math.round((displayW * targetH) / targetW);
        const pixelRatio = targetW / displayW;

        setPreviewWidth(displayW);
        if (inner) {
          inner.style.aspectRatio = `${displayW} / ${displayH}`;
        }

        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 60));

        let dataUrl: string;
        if (format === 'jpg') {
            dataUrl = await htmlToImage.toJpeg(el, { quality: 0.92, pixelRatio, backgroundColor: '#FFFFFF' });
        } else {
            dataUrl = await htmlToImage.toPng(el, { quality: 1, pixelRatio });
        }

        setPreviewWidth(320);
        if (inner) inner.setAttribute('style', origInnerStyle);

        if (format === 'pdf') {
            const win = window.open('', '_blank');
            win?.document.write(`<html><body style="margin:0;display:flex;justify-content:center;"><img src="${dataUrl}" style="max-width:100%; height:auto;" onload="window.print(); window.close();"/></body></html>`);
            win?.document.close();
        } else {
            const ext = format === 'jpg' ? 'jpg' : 'png';
            const link = document.createElement('a');
            link.download = `${type}-asset.${ext}`;
            link.href = dataUrl;
            link.click();
        }

        toast.success(isSavedRef.current || existingAsset ? `Exported as ${format.toUpperCase()}!` : 'Saved & exported!', { id: toastId });
    } catch (err) {
        toast.error('Export failed', { id: toastId });
    } finally {
        setIsGeneratingExport(false);
    }
  };

  const handleSaveAndExit = async () => {
    const toastId = toast.loading('Saving...');
    if (!existingAsset && !isSavedRef.current) {
      await saveToLibrary();
    }
    toast.success('Saved!', { id: toastId });
    router.push('/dashboard/marketing-assets');
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
              <h1 className="text-sm font-bold text-gray-900 uppercase tracking-wider leading-none">Create Kit</h1>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">
                {step === 'gallery' ? 'STEP 1: CHOOSE TEMPLATE' : step === 'size_selection' ? 'STEP 2: SIZE SELECTION' : step === 'editor' ? 'STEP 3: CUSTOMIZE' : 'STEP 4: PREVIEW & DOWNLOAD'}
              </p>
          </div>
        </div>
        {step === 'editor' && (
          <Button onClick={handleSaveAndPreview} className="h-10 px-6 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider shadow-xl active:scale-95 transition-all">
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
                    <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
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
                              <div className="aspect-[4/5] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group-hover:border-[#066CF4]/40 group-hover:shadow-xl transition-all">
                                  {tpl.thumbnailUrl ? (
                                      <img src={tpl.thumbnailUrl} alt={tpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  ) : (
                                      <div 
                                          className="w-full h-full relative overflow-hidden flex flex-col justify-between"
                                          style={{ 
                                              backgroundColor: tpl.layoutConfig?.backgroundColor || '#FFFFFF',
                                              backgroundImage: tpl.layoutConfig?.backgroundImage ? `url(${tpl.layoutConfig.backgroundImage})` : 'none',
                                              backgroundSize: 'cover',
                                              backgroundPosition: 'center'
                                          }}
                                      >
                                          {tpl.layoutConfig?.elements?.map((el: any) => {
                                              return (
                                                  <div 
                                                      key={el.id} 
                                                      style={{ 
                                                          position: 'absolute', 
                                                          left: `${el.x}%`, 
                                                          top: `${el.y}%`, 
                                                          width: el.width ? `${el.width}%` : 'auto',
                                                          pointerEvents: 'none',
                                                          userSelect: 'none'
                                                      }}
                                                  >
                                                      {el.type === 'text' && (
                                                          <div 
                                                              style={{ 
                                                                  color: el.color || '#000000', 
                                                                  fontSize: `${Math.max(5, Math.round((el.fontSize || 16) * 0.14))}px`, 
                                                                  fontWeight: el.fontWeight || 'bold', 
                                                                  textAlign: el.alignment || 'center',
                                                                  lineHeight: 1.1
                                                              }}
                                                              className="w-full break-words px-1"
                                                          >
                                                              {el.text}
                                                          </div>
                                                      )}
                                                      {el.type === 'qr' && (
                                                          <div className="bg-white p-0.5 rounded-sm shadow-sm border border-gray-100 flex items-center justify-center mx-auto" style={{ width: '28px', height: '28px' }}>
                                                              <div className="w-full h-full bg-gray-900 rounded-[1px] flex flex-wrap gap-[1px] p-[1.5px]">
                                                                  <div className="w-2.5 h-2.5 bg-white p-[1px] flex"><div className="w-full h-full bg-gray-900" /></div>
                                                                  <div className="w-2.5 h-2.5 bg-white p-[1px] flex ml-auto"><div className="w-full h-full bg-gray-900" /></div>
                                                                  <div className="w-2.5 h-2.5 bg-white p-[1px] flex mt-auto"><div className="w-full h-full bg-gray-900" /></div>
                                                              </div>
                                                          </div>
                                                      )}
                                                      {el.type === 'logo' && (
                                                          <div className="w-6 h-6 rounded-md bg-gray-200/50 backdrop-blur-sm flex items-center justify-center border border-white/20 mx-auto">
                                                              {businessLogo ? (
                                                                  <img src={businessLogo} alt="logo" className="w-full h-full object-contain p-0.5" />
                                                              ) : (
                                                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                              )}
                                                          </div>
                                                      )}
                                                  </div>
                                              );
                                          })}
                                          {(!tpl.layoutConfig?.elements || tpl.layoutConfig.elements.length === 0) && (
                                              <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                                  <Layout size={40} className="text-gray-200" />
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </div>
                              <div className="px-2">
                                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#066CF4] transition-colors">{tpl.name}</h4>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{tpl.category || type.replace('_', ' ')}</p>
                              </div>
                          </button>
                      ))}
                  </div>
                )}
            </motion.div>
          )}

          {/* STEP 2: SIZE SELECTION */}
          {step === 'size_selection' && (
            <motion.div key="size_selection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6 sm:space-y-8 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-2xl border border-gray-100 shadow-sm mt-4 sm:mt-8">
                <div className="text-center space-y-2 mb-4 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-sans tracking-tight">Choose Design Size</h2>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Select an orientation and adjust the dimensions for your asset.</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {(['square', 'portrait', 'landscape'] as const).map(t => (
                        <button 
                            key={t}
                            onClick={() => handleSizeTypeChange(t)}
                            className={cn("p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center gap-2 sm:gap-3 transition-all", sizeType === t ? "border-[#066CF4] bg-[#066CF4]/5 text-[#066CF4]" : "border-gray-100 text-gray-400 hover:border-gray-200")}
                        >
                            <div className={cn("border-2 rounded-md transition-all", sizeType === t ? "border-[#066CF4]" : "border-gray-300", t === 'square' ? "w-6 h-6 sm:w-8 sm:h-8" : t === 'portrait' ? "w-4.5 h-6 sm:w-6 sm:h-8" : "w-6 h-4.5 sm:w-8 sm:h-6")} />
                            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">{t}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-center gap-2 py-1">
                    <input
                        type="checkbox"
                        id="maintain-ratio"
                        checked={maintainAspectRatio}
                        onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                        className="size-4 rounded border-gray-300 text-[#066CF4] focus:ring-[#066CF4]/20"
                    />
                    <label htmlFor="maintain-ratio" className="text-[10px] sm:text-[11px] font-bold text-gray-600 cursor-pointer select-none">
                        Maintain aspect ratio
                    </label>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Width (px)</label>
                        <Input type="number" value={designW} onChange={(e) => handleWidthChange(Number(e.target.value))} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold bg-gray-50 border-gray-100" />
                    </div>
                    <div className="text-gray-300 font-bold text-lg sm:text-xl pt-4 sm:pt-6">×</div>
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Height (px)</label>
                        <Input type="number" value={designH} onChange={(e) => handleHeightChange(Number(e.target.value))} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold bg-gray-50 border-gray-100" />
                    </div>
                </div>

                {showSizeWarning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                        <div className="size-5 sm:size-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-amber-600 text-[10px] sm:text-xs font-bold">!</span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-medium text-amber-800 leading-relaxed">
                            The dimensions entered ({designW}×{designH}) don&apos;t match the <strong>{sizeType}</strong> orientation. 
                            Adjust values or change type to <strong>{actualType}</strong>.
                        </div>
                    </div>
                )}

                <div className="pt-2 sm:pt-4">
                    <Button onClick={() => { setStep('editor'); window.scrollTo(0,0); }} disabled={showSizeWarning} className={cn("w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl text-white font-bold uppercase tracking-wider shadow-xl transition-all", showSizeWarning ? "bg-gray-300 cursor-not-allowed shadow-none" : "bg-[#066CF4] hover:bg-[#0556c5] shadow-blue-500/20")}>
                        Continue to Editor <ChevronRight className="ml-2" size={16} />
                    </Button>
                </div>
            </motion.div>
          )}

          {/* STEP 3: EDITOR */}
          {step === 'editor' && (!templateId || selectedTemplate) && (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                <div className="min-h-[700px]">
                    <MarketingAssetEditor 
                        initialElements={elements}
                        backgroundColor={bgColor}
                        backgroundImage={bgImage}
                        businessLogo={businessLogo}
                        qrUrl={qrUrl}
                        mode="business"
                        designW={designW}
                        designH={designH}
                        onChange={(data) => {
                            setElements(data.elements);
                            setBgColor(data.backgroundColor);
                            setBgImage(data.backgroundImage || '');
                        }}
                    />
                </div>
            </motion.div>
          )}

          {/* STEP 4: PREVIEW & DOWNLOAD */}
          {step === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-12 pb-20">
                <div className="flex flex-col lg:flex-row items-start gap-12">
                    <div className="flex-1 w-full flex justify-center">
                        <div id="export-container" ref={downloadRef} className="shadow-2xl ring-[16px] ring-white rounded-2xl overflow-hidden" style={{ width: previewWidth, backgroundColor: bgColor }}>
                            <div className="w-full relative overflow-hidden" style={{ aspectRatio: `${designW} / ${designH}`, backgroundColor: bgColor, backgroundImage: bgImage ? `url(${bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {(() => {
                                    const scaleFactor = previewWidth / (designW || 1080);
                                    return elements.map(el => (
                                        <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: el.width ? `${el.width}%` : 'auto', height: el.height ? `${el.height}%` : 'auto', zIndex: el.type === 'logo' ? 30 : 10 }}>
                                            {el.type === 'text' && <div style={{ color: el.color, fontSize: `${(el.fontSize || 16) * scaleFactor}px`, fontWeight: el.fontWeight, textAlign: el.alignment }} className="w-full leading-tight">{el.text}</div>}
                                            {el.type === 'qr' && (
                                                <div className="bg-white p-2 rounded-2xl flex items-center justify-center">
                                                    <QRCodeSVG 
                                                        value={el.qrContent || qrUrl} 
                                                        size={(el.size || 120) * scaleFactor} 
                                                        level="H"
                                                        includeMargin={false}
                                                        imageSettings={businessLogo ? {
                                                            src: businessLogo,
                                                            height: ((el.size || 120) * scaleFactor) * 0.2,
                                                            width: ((el.size || 120) * scaleFactor) * 0.2,
                                                            excavate: true,
                                                        } : undefined}
                                                    />
                                                </div>
                                            )}
                                            {el.type === 'logo' && businessLogo && <img src={businessLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-80 space-y-6">
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                            <div className="space-y-2 text-center">
                              <h3 className="text-xl font-bold text-gray-900">Looking Good!</h3>
                              <p className="text-xs text-gray-500 font-medium">Your design is ready to be shared with the world.</p>
                            </div>
                            
                            <div className="space-y-2 pt-4 border-t border-gray-50">
                              <Button 
                                onClick={handleSaveToLibrary}
                                disabled={isSaving}
                                variant="outline"
                                className="w-full h-12 border-2 border-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-2xl hover:bg-gray-50 gap-2"
                              >
                                  <Save size={14} /> {hasSaved || existingAsset ? 'Saved' : 'Save to Library'}
                              </Button>
                              <Button 
                                onClick={() => setShowExportDialog(true)} 
                                disabled={isExporting}
                                className="w-full h-14 bg-[#066CF4] hover:bg-[#0556c5] text-white text-[10px] font-bold uppercase tracking-wider rounded-2xl gap-3 shadow-xl shadow-blue-500/20"
                              >
                                  <Download size={16} /> Download
                              </Button>
                              <button
                                onClick={handleSaveAndExit}
                                className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-wider"
                              >
                                <ArrowLeft size={12} /> Save & Exit
                              </button>
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

      {/* Export Options Dialog */}
      <Modal isOpen={showExportDialog} onClose={() => setShowExportDialog(false)} title="Export Options" description="Choose format and size for your export." size="lg">
        <div className="space-y-6">
          {/* Format Selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 block">Format</label>
            <div className="flex gap-2">
              {([{ id: 'png', icon: Download, label: 'PNG' }, { id: 'jpg', icon: ImageIcon, label: 'JPG' }, { id: 'pdf', icon: Printer, label: 'PDF' }] as const).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setExportFormat(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border-2",
                    exportFormat === id
                      ? "bg-[#066CF4] text-white border-[#066CF4] shadow-lg shadow-blue-500/20"
                      : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                  )}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Presets */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 block">Size</label>
            <div className="grid grid-cols-2 gap-2">
              {exportPresets.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all",
                    selectedPreset === p.id
                      ? "border-[#066CF4] bg-blue-50/50 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  )}
                >
                  <div className="text-sm font-bold text-gray-900">{p.label}</div>
                  {p.w > 0 && (
                    <div className="text-[10px] font-bold text-gray-400 mt-0.5">{p.w}×{p.h} px</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dimensions */}
          {selectedPreset === 'custom' && (
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-[8px] font-bold uppercase text-gray-400">Width</span>
                <Input type="number" value={customExportW} onChange={e => setCustomExportW(Math.max(100, Number(e.target.value)))} min={100} className="text-sm" />
              </div>
              <span className="text-gray-300 font-bold text-lg pb-2">×</span>
              <div className="flex-1 space-y-1">
                <span className="text-[8px] font-bold uppercase text-gray-400">Height</span>
                <Input type="number" value={customExportH} onChange={e => setCustomExportH(Math.max(100, Number(e.target.value)))} min={100} className="text-sm" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 pb-2">px</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              onClick={() => setShowExportDialog(false)}
              variant="outline"
              className="flex-1 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const { w, h } = getExportDims();
                await handleSaveAndExport(exportFormat, w, h);
                setShowExportDialog(false);
              }}
              disabled={isExporting}
              className="flex-1 h-12 bg-[#066CF4] hover:bg-[#0556c5] text-white rounded-2xl text-[10px] font-bold uppercase tracking-wider shadow-xl shadow-blue-500/20"
            >
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
