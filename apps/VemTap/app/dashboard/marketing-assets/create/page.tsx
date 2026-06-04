"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Sparkles,
  QrCode as QrIcon,
  Download,
  Bookmark,
  ZoomIn,
  ChevronDown,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import {
  useCreateMarketingAsset,
  useBrandProfile,
  useTemplateStyles,
  useTemplateFormats,
} from '@/services/marketing-assets/hooks';
import { useQrThriveCodes, useQrThriveMappingStatus } from '@/services/qr-thrive/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import toast from 'react-hot-toast';

type Goal = 'view-menu' | 'place-order' | 'join-loyalty' | 'leave-feedback' | 'reserve-table' | 'promotions' | null;
type AssetFormat = 'table-stand' | 'poster' | 'flyer' | 'window-sticker' | 'banner' | 'social-media' | null;

const goals = [
  { id: 'view-menu' as const, icon: 'restaurant', label: 'View Menu', desc: 'Digital browsing for dine-in or takeout.' },
  { id: 'place-order' as const, icon: 'shopping_cart', label: 'Place Order', desc: 'Direct checkout flow for quick service.' },
  { id: 'join-loyalty' as const, icon: 'star', label: 'Join Loyalty Program', desc: 'Build customer retention with rewards.' },
  { id: 'leave-feedback' as const, icon: 'chat', label: 'Leave Feedback', desc: 'Gather reviews and customer insights.' },
  { id: 'reserve-table' as const, icon: 'calendar_today', label: 'Reserve Table', desc: 'Manage bookings and table turnover.' },
  { id: 'promotions' as const, icon: 'sell', label: 'Promotions', desc: 'Highlight limited time offers and sales.' },
];

const formats = [
  { id: 'table-stand' as const, label: 'Table Stand', size: '5 x 7 in', dimensions: { width: 5, height: 7, unit: 'in' }, thumb: 'bg-amber-50' },
  { id: 'poster' as const, label: 'Poster', size: '18 x 24 in', dimensions: { width: 18, height: 24, unit: 'in' }, thumb: 'bg-blue-50' },
  { id: 'flyer' as const, label: 'Flyer', size: '8.5 x 11 in', dimensions: { width: 8.5, height: 11, unit: 'in' }, thumb: 'bg-green-50' },
  { id: 'window-sticker' as const, label: 'Window Sticker', size: '4 x 4 in', dimensions: { width: 4, height: 4, unit: 'in' }, thumb: 'bg-purple-50' },
  { id: 'banner' as const, label: 'Banner', size: '2.5 x 6 ft', dimensions: { width: 2.5, height: 6, unit: 'ft' }, thumb: 'bg-rose-50' },
  { id: 'social-media' as const, label: 'Social Media', size: '1080 x 1080 px', dimensions: { width: 1080, height: 1080, unit: 'px' }, thumb: 'bg-cyan-50' },
];

export default function CreateAssetWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');

  const { data: brandProfile } = useBrandProfile();
  const { data: templateStyles } = useTemplateStyles();
  const { data: templateFormats } = useTemplateFormats();
  const createAssetMutation = useCreateMarketingAsset();
  const { data: branches = [] } = useBranches();
  const { data: business } = useMyBusiness();
  const { data: qrCodes = [] } = useQrThriveCodes();
  useQrThriveMappingStatus();

  const [step, setStep] = useState(templateId ? 2 : 1);
  const [goal, setGoal] = useState<Goal>(null);
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [format, setFormat] = useState<AssetFormat>(null);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [customUnit, setCustomUnit] = useState('px');

  // Element Control State - X is offset from center (0 = middle)
  const [editingDesign, setEditingDesign] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<any[]>([
    { id: 'headline', type: 'text', text: '', x: 0, y: 15, fontSize: 28, color: '#FFFFFF', fontWeight: '900', scale: 1 },
    { id: 'subheadline', type: 'text', text: '', x: 0, y: 35, fontSize: 16, color: '#FFFFFF', fontWeight: '500', scale: 1 },
    { id: 'qr', type: 'qr', x: 0, y: 65, size: 120, scale: 1 }
  ]);

  // QR Selection State
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null);
  const [isQrDropdownOpen, setIsQrDropdownOpen] = useState(false);

  // Sync elements with input fields
  useEffect(() => {
    setElements(prev => prev.map(el => {
      if (el.id === 'headline') return { ...el, text: headline || 'Scan to Experience' };
      if (el.id === 'subheadline') return { ...el, text: subheadline || 'Join our community and unlock exclusive digital access in one simple tap.' };
      return el;
    }));
  }, [headline, subheadline]);

  const [uploadedDesign, setUploadedDesign] = useState<string | null>(null);
  const [selectedMockup, setSelectedMockup] = useState<string | null>(null);
  const [showAiSheet, setShowAiSheet] = useState(false);
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [mockupEnv, setMockupEnv] = useState('Wall');
  const [aiHeadline, setAiHeadline] = useState('');

  const presetPrompts = [
    "A vibrant summer-themed design with tropical leaves and bright colors.",
    "A minimalist and elegant layout for a luxury brand.",
    "A bold and energetic design for a fitness or sports brand.",
    "A cozy and warm aesthetic for a café or bakery.",
    "A professional and clean layout for a corporate or tech brand.",
  ];

  const previewRef = useRef<HTMLDivElement>(null);

  const displayStep = templateId ? step - 1 : step;
  const totalSteps = templateId ? 4 : 5;
  const stepProgress = templateId
    ? Math.min(100, ((step - 2) / 4) * 100)
    : Math.min(100, ((step - 1) / 5) * 100);

  const handleBack = () => {
    if (showAiSheet) { setShowAiSheet(false); return; }
    if (step > 1) { setStep(step - 1); return; }
    router.push('/dashboard/marketing-assets');
  };

  const handleGenerateAi = () => {
    setAiHeadline(`Unleash Your ${headline || 'Brand'}: The Definitive Collection`);
    setShowAiSheet(true);
  };

  const handleGenerateAiImage = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          businessInfo: {
            name: business?.name || brandProfile?.name,
            logoUrl: brandProfile?.logoUrl,
            primaryColor: brandProfile?.primaryColor,
            accentColor: brandProfile?.accentColor,
          },
          options: {
            goal,
            format,
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedImageUrl(data.imageUrl);
      } else {
        toast.error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('AI Generation error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleUseGeneratedImage = () => {
    if (generatedImageUrl) {
      setUploadedDesign(generatedImageUrl);
      setShowAiImageModal(false);
      setGeneratedImageUrl(null);
      setAiPrompt('');
      toast.success('Generated design applied!');
    }
  };

  const applyAiContent = () => {
    if (aiHeadline) setHeadline(aiHeadline);
    setShowAiSheet(false);
    toast.success('Content optimized with AI!');
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    
    const toastId = toast.loading('Preparing high-fidelity export...');
    try {
      // Use html-to-image for a more robust export
      const dataUrl = await htmlToImage.toPng(previewRef.current, {
        quality: 1.0,
        pixelRatio: 4, // 4x for high-fidelity printing
        skipAutoScale: true,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `${headline || 'marketing-asset'}-${format || 'custom'}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Asset downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to export high-fidelity asset', { id: toastId });
    }
  };

  const defaultBusinessUrl = typeof window !== 'undefined' ? `${window.location.origin}/${(brandProfile as any)?.username || (business as any)?.slug || business?.uniqueCode || 'preview'}` : '';
  const [activeQrUrl, setActiveQrUrl] = useState(defaultBusinessUrl);

  // Update active QR URL when selection changes
  useEffect(() => {
    if (selectedQrId) {
      const selected = qrCodes.find((q: any) => q.id === selectedQrId);
      if (selected) {
        setActiveQrUrl(selected.shortUrl || selected.data?.content || '');
      }
    } else {
      setActiveQrUrl(defaultBusinessUrl);
    }
  }, [selectedQrId, qrCodes, defaultBusinessUrl]);

  const handleDragEnd = (elementId: string, event: any, info: any) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        const deltaXPct = (info.offset.x / canvasRect.width) * 100;
        const deltaYPct = (info.offset.y / canvasRect.height) * 100;
        
        return { 
          ...el, 
          x: el.x + deltaXPct, 
          y: el.y + deltaYPct 
        };
      }
      return el;
    }));
  };

  const handleCenterElement = (elementId: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, x: 0 } : el
    ));
    toast.success('Element centered horizontally');
  };

  const handleScaleChange = (elementId: string, newScale: number) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, scale: newScale } : el
    ));
  };

  const handleContinue = async () => {
    if (step === 4) {
      setStep(5);
      setGenerating(true);
      for (let i = 0; i <= 100; i += 2) {
        await new Promise(r => setTimeout(r, 40));
        setProgress(i);
      }
      setGenerating(false);
      try {
        const payload = {
          name: headline || 'Marketing Asset',
          templateId: templateId || undefined,
          type: format || 'table-stand',
          qrCodeContent: activeQrUrl,
          customConfig: {
            backgroundColor: '#0F172A',
            accentColor: '#493EE5',
            dimensions: format === 'window-sticker' && customWidth && customHeight ? { width: Number(customWidth), height: Number(customHeight), unit: customUnit } : formats.find(f => f.id === format)?.dimensions,
            elements: elements.map(el => ({
              ...el,
              x: 50 + el.x, 
            })),
          },
          qrCodeConfig: { color: '#FFFFFF', backgroundColor: '#0F172A' },
        };
        const result = await createAssetMutation.mutateAsync(payload);
        setAssetId(result.id);
      } catch {
        toast.error('Failed to create asset');
      }
      setStep(6);
      return;
    }
    setStep(step + 1);
  };

  const canContinue = () => {
    if (step === 1) return format !== null || (customWidth && customHeight);
    if (step === 2) return goal !== null;
    if (step === 3) return headline.trim().length > 0 || uploadedDesign !== null;
    if (step === 4) return selectedMockup !== null;
    return true;
  };

  const mockupEnvs = ['Wall', 'Table', 'Window', 'Counter', 'Banner'];
  const mockupColors: Record<string, string> = {
    Wall: 'bg-slate-100',
    Table: 'bg-amber-50',
    Window: 'bg-sky-50',
    Counter: 'bg-stone-50',
    Banner: 'bg-rose-50',
  };

  // Reusable High-Fidelity Design Component
  const HighFidelityDesign = ({ isMockup = false, scaleMultiplier = 1 }: { isMockup?: boolean, scaleMultiplier?: number }) => {
    const currentFormat = formats.find(f => f.id === format);
    const aspectRatio = format === 'window-sticker' && customWidth && customHeight 
      ? `${customWidth}/${customHeight}` 
      : currentFormat?.dimensions 
        ? `${currentFormat.dimensions.width}/${currentFormat.dimensions.height}`
        : '9/16';

    return (
      <div 
        className={`relative w-full h-full bg-slate-900 overflow-hidden ${isMockup ? '' : 'rounded-lg'}`}
        style={{ aspectRatio }}
      >
        {uploadedDesign ? (
          <img src={uploadedDesign} alt="Custom Design" className="w-full h-full object-cover" />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-white text-center overflow-hidden">
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop")' }}
            />
            <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

            <div className="relative w-full h-full flex items-center justify-center">
              {elements.map((el) => (
                <div 
                  key={el.id}
                  style={{ 
                    position: 'absolute',
                    left: '50%',
                    top: `${el.y}%`,
                    transform: `translate(-50%, 0) scale(${el.scale * scaleMultiplier})`,
                    x: `${el.x}%`,
                    zIndex: el.id === 'headline' ? 3 : el.id === 'subheadline' ? 2 : 1
                  }}
                  className="w-full"
                >
                  {el.type === 'text' ? (
                    <div className="text-center px-4">
                      <h3 
                        style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight }}
                        className={`text-white leading-tight drop-shadow-lg tracking-tight ${isMockup ? 'line-clamp-2' : ''}`}
                      >
                        {el.text}
                      </h3>
                    </div>
                  ) : (
                    <div className={`${isMockup ? 'p-1.5 rounded-lg' : 'p-3 rounded-[18px]'} bg-white shadow-2xl mx-auto inline-block`}>
                       <QRCodeSVG 
                        value={activeQrUrl}
                        size={isMockup ? 40 : 80}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Real-world reflection overlay for mockups */}
        {isMockup && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10 mix-blend-overlay" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-background text-on-surface">
      <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between px-5 h-12 bg-surface shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="flex items-center justify-center w-10 h-10 hover:bg-surface-container-high rounded-full transition-transform active:scale-95">
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <h1 className="text-headline-md font-bold text-primary">Marketing Assets</h1>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-surface-container">
          <div className="bg-primary h-full transition-all duration-500 ease-out" style={{ width: `${stepProgress}%` }} />
        </div>
      </header>

      <main className="flex-1 px-5 max-w-2xl mx-auto w-full pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="py-4">
                <span className="text-label-caps text-primary uppercase tracking-widest mb-2 block">Step {displayStep} of {totalSteps}</span>
                <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">Select Dimensions</h2>
                <p className="text-body-lg text-on-surface-variant">Choose a preset size or enter your custom dimensions.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {formats.map((f) => {
                  const isActive = format === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFormat(f.id);
                        setCustomWidth('');
                        setCustomHeight('');
                      }}
                      className={`relative flex flex-col bg-surface-container-lowest border rounded-xl p-4 cursor-pointer active:scale-95 transition-all ${
                        isActive ? 'border-2 border-primary bg-surface-container-low' : 'border border-outline-variant hover:shadow-lg'
                      }`}
                    >
                      <div className={`aspect-square ${f.thumb} rounded-lg mb-3 flex items-center justify-center overflow-hidden`}>
                        <div 
                          className="bg-white border-2 border-outline-variant rounded shadow-sm"
                          style={{ 
                            width: f.dimensions.width > f.dimensions.height ? '70%' : '50%',
                            aspectRatio: `${f.dimensions.width}/${f.dimensions.height}`
                          }}
                        />
                      </div>
                      <h3 className="text-headline-md text-body-lg font-semibold text-on-surface">{f.label}</h3>
                      <p className="text-label-caps text-on-surface-variant mt-1">{f.size}</p>
                      <div className={`absolute top-2 right-2 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                        <Check size={18} className="text-primary" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-headline-md font-bold">Custom Size</h3>
                  <div className="relative group">
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 pr-10 text-label-caps font-bold cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase outline-none"
                    >
                      {['px', 'mm', 'cm', 'in'].map((u) => (
                        <option key={u} value={u} className="bg-surface py-2">
                          {u}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label-caps text-on-surface-variant">WIDTH</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => {
                        setCustomWidth(e.target.value);
                        setFormat(null);
                      }}
                      className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-xl h-12 px-4"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-caps text-on-surface-variant">HEIGHT</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => {
                        setCustomHeight(e.target.value);
                        setFormat(null);
                      }}
                      className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-xl h-12 px-4"
                      placeholder="0"
                    />
                  </div>
                </div>
                {(customWidth && customHeight) && (
                   <p className="text-body-sm text-primary font-medium">Custom dimensions: {customWidth} x {customHeight} {customUnit}</p>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="py-4">
                <span className="text-label-caps text-primary mb-2 block">Step {displayStep} of {totalSteps}</span>
                <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">What do you want customers to do?</h2>
                <p className="text-body-lg text-on-surface-variant">Choose a goal for this marketing material.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {goals.map((g) => {
                  const isActive = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`flex flex-col p-4 bg-surface-container-lowest border rounded-xl text-left shadow-[0_4px_20px_rgba(0,0,0,0.04)] active:scale-95 transition-all cursor-pointer ${
                        isActive ? 'border-2 border-primary bg-primary-container/5' : 'border border-outline-variant hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                        isActive ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">{g.icon}</span>
                      </div>
                      <span className="text-headline-md text-on-surface mb-1 font-semibold">{g.label}</span>
                      <span className="text-body-sm text-on-surface-variant">{g.desc}</span>
                      {isActive && (
                        <div className="mt-2 flex justify-end">
                          <Check size={18} className="text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="flex items-center justify-between py-4">
                <div>
                  <span className="text-label-caps text-on-surface-variant">Step {displayStep} of {totalSteps}</span>
                  <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">Customize Content</h2>
                </div>
                <span className="text-label-caps text-primary">Content Creation</span>
              </div>

              <section className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-2">
                <label className="text-label-caps text-on-surface-variant block">Headline</label>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-transparent border border-outline-variant focus:border-primary focus:ring-0 rounded-lg h-12 px-4 text-body-lg text-on-surface transition-all"
                  placeholder="e.g. Summer Collection Launch"
                />
              </section>

              <section className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-2">
                <label className="text-label-caps text-on-surface-variant block">Subheadline</label>
                <textarea
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="w-full bg-transparent border border-outline-variant focus:border-primary focus:ring-0 rounded-lg p-4 text-body-lg text-on-surface transition-all resize-none"
                  placeholder="Describe your offering in detail..."
                  rows={3}
                />
              </section>

              <button
                onClick={() => setShowAiImageModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-surface-container-high text-primary font-button text-button h-12 rounded-xl hover:bg-surface-container-highest transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles size={18} />
                Generate with AI
              </button>

              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setUploadedDesign(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border-2 border-dashed border-primary/30 h-16 rounded-xl group-hover:bg-primary/20 transition-all">
                    <Download size={18} className="rotate-180" />
                    <span className="font-button text-button">
                      {uploadedDesign ? 'Change Custom Design' : 'Upload Your Own Design'}
                    </span>
                  </div>
                </div>

                {/* QR Selector Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsQrDropdownOpen(!isQrDropdownOpen)}
                    className="w-full h-14 bg-surface border border-outline-variant rounded-xl px-4 flex items-center justify-between hover:border-primary transition-all active:scale-[0.99] group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <QrIcon size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider leading-none mb-1">Active Destination</p>
                        <p className="text-body-md font-bold text-on-surface truncate max-w-[200px]">
                          {selectedQrId ? qrCodes.find((q: any) => q.id === selectedQrId)?.name : 'Default UBL Profile'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={20} className={`text-on-surface-variant transition-transform duration-300 ${isQrDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isQrDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[45]" onClick={() => setIsQrDropdownOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 w-full mt-2 bg-surface border border-outline-variant rounded-2xl shadow-2xl z-[50] overflow-hidden max-h-[300px] overflow-y-auto"
                        >
                          <div className="p-2 space-y-1">
                            <button 
                              onClick={() => { setSelectedQrId(null); setIsQrDropdownOpen(false); }}
                              className={`w-full p-4 flex items-center justify-between rounded-xl transition-all ${!selectedQrId ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                  <QrIcon size={20} />
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-body-lg">Default UBL Profile</p>
                                  <p className="text-[10px] opacity-60">Points to your business home page</p>
                                </div>
                              </div>
                              {!selectedQrId && <Check size={18} />}
                            </button>

                            {qrCodes.map((qr: any) => (
                              <button 
                                key={qr.id}
                                onClick={() => { setSelectedQrId(qr.id); setIsQrDropdownOpen(false); }}
                                className={`w-full p-4 flex items-center justify-between rounded-xl transition-all ${selectedQrId === qr.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <QrIcon size={20} />
                                  </div>
                                  <div className="text-left">
                                    <p className="font-bold text-body-lg">{qr.name}</p>
                                    <p className="text-[10px] opacity-60 truncate max-w-[180px]">{qr.content}</p>
                                  </div>
                                </div>
                                {selectedQrId === qr.id && <Check size={18} />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl h-[550px] border border-outline-variant/30 shadow-2xl group/preview">
                {/* Edit Overlay Button */}
                {!uploadedDesign && (
                  <button 
                    onClick={() => setEditingDesign(true)}
                    className="absolute top-6 right-6 z-[30] bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 py-2.5 rounded-full font-button text-button shadow-2xl hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2 group/editbtn"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center group-hover/editbtn:scale-110 transition-transform">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    Edit Layout
                  </button>
                )}

                {uploadedDesign ? (
                  <div className="relative w-full h-full group">
                    <img src={uploadedDesign} alt="Custom design" className="w-full h-full object-cover" />
                    {/* Persistent Remove Button for Mobile/Desktop */}
                    <div className="absolute top-4 right-4 z-20">
                       <button 
                         onClick={() => setUploadedDesign(null)}
                         className="bg-black/60 hover:bg-rose-600 backdrop-blur-md text-white h-10 px-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all border border-white/20 flex items-center gap-2"
                       >
                         <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">✕</span>
                         Remove Design
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8 text-white text-center overflow-hidden">
                    {/* Background Image with Overlay */}
                    <div 
                      className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-110 group-hover/preview:scale-100 transition-transform duration-700"
                      style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop")' }}
                    />
                    <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

                    {/* Canvas Area - Center Anchored Preview */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      {elements.map((el) => (
                        <motion.div 
                          key={el.id}
                          style={{ 
                            position: 'absolute',
                            left: '50%',
                            top: `${el.y}%`,
                            x: `${el.x}%`, // Actual design offset from center
                            translateX: '-50%', // Ensure pivot is midpoint
                            transform: `scale(${el.scale})`,
                            zIndex: el.id === 'headline' ? 3 : el.id === 'subheadline' ? 2 : 1
                          }}
                          className="w-full"
                        >
                          {el.type === 'text' ? (
                            <div className="text-center px-4">
                              <h3 
                                style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight }}
                                className="text-white leading-tight drop-shadow-lg tracking-tight"
                              >
                                {el.text}
                              </h3>
                            </div>
                          ) : (
                            <div className="bg-white p-3 rounded-[18px] shadow-2xl mx-auto inline-block">
                               <QRCodeSVG 
                                value={activeQrUrl}
                                size={80}
                                level="H"
                                includeMargin={false}
                              />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-1 w-8 bg-primary rounded-full" />
                  <span className="text-label-caps text-primary uppercase tracking-widest block">Display Strategy</span>
                </div>
                <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Where will this be displayed?</h2>
                <p className="text-body-lg text-on-surface-variant max-w-md">Choose the output format to optimize your asset for the best physical or digital presence.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'table-stand', label: 'Premium Table Stand', desc: 'Perfect for menus and check-ins at tables or reception desks.', icon: 'desktop_mac' },
                  { id: 'poster', label: 'High-Impact Poster', desc: 'High-visibility wall displays for promotions or event announcements.', icon: 'wallpaper' },
                  { id: 'flyer', label: 'Handheld Flyer', desc: 'Compact handouts for distribution and leave-behind marketing.', icon: 'description' },
                  { id: 'banner', label: 'Storefront Banner', desc: 'Large-scale presence for trade shows and outdoor placements.', icon: 'ads_click' },
                  { id: 'window-sticker', label: 'Window Sticker', desc: 'Weather-resistant decals for storefronts and glass partitions.', icon: 'auto_awesome_motion' },
                  { id: 'social-media', label: 'Social Media Post', desc: 'Digital-first square format optimized for Instagram and LinkedIn.', icon: 'share' },
                ].map((m) => {
                  const isActive = format === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setFormat(m.id as any)}
                      className={`group relative flex items-center gap-6 p-6 bg-surface border rounded-[24px] cursor-pointer transition-all duration-300 ${isActive ? 'border-primary bg-primary-container/10 ring-2 ring-primary/20' : 'border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-low shadow-sm hover:shadow-md'}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary'}`}>
                        <span className="material-symbols-outlined text-[28px]">{m.icon}</span>
                      </div>
                      
                      <div className="flex-1 text-left">
                        <h3 className={`text-headline-md font-bold transition-colors ${isActive ? 'text-primary' : 'text-on-surface'}`}>{m.label}</h3>
                        <p className="text-body-md text-on-surface-variant line-clamp-1">{m.desc}</p>
                      </div>

                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                        {isActive && <Check size={14} className="text-white" strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
              <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                <div className="absolute inset-4 border-2 border-primary/20 border-dashed rounded-full animate-spin" style={{ animationDuration: '8s' }} />
                <div className="z-10 bg-white shadow-lg rounded-xl p-4"><Sparkles size={48} className="text-primary" /></div>
              </div>
              <h1 className="text-headline-lg-mobile text-on-surface mb-4">Preparing Design</h1>
              <p className="text-body-sm text-on-surface-variant text-center mb-8 max-w-[280px]">We are tailoring your marketing assets to match your unique brand identity.</p>
              <div className="w-full max-w-sm space-y-3">
                {[
                  { label: 'Loading Business Brand', done: progress > 25 },
                  { label: 'Generating QR Code', done: progress > 50 },
                  { label: 'Applying Design', done: progress > 75 },
                  { label: 'Creating Preview', done: progress > 95 },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 transition-all duration-500 ${s.done ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${s.done ? 'bg-primary' : 'bg-surface-container'}`}>{s.done ? <Check size={14} className="text-white" /> : <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />}</div>
                      <span className="text-label-caps tracking-wide">{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full max-w-sm mt-8">
                <div className="flex justify-between mb-2">
                  <span className="text-label-caps text-on-surface-variant">{Math.round(progress)}%</span>
                  <span className="text-label-caps text-primary uppercase font-bold tracking-widest">{progress < 100 ? 'Synchronizing...' : 'Ready!'}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container transition-all duration-300 ease-out rounded-full" style={{ width: `${progress}%`, boxShadow: progress > 0 ? '0 0 12px rgba(99, 91, 255, 0.4)' : 'none' }} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <section className="flex flex-col items-center">
                <div
                  ref={previewRef}
                  className={`relative bg-slate-900 overflow-hidden shadow-2xl transition-all duration-500 rounded-lg`}
                  style={{ 
                    width: '100%',
                    maxWidth: '400px',
                    aspectRatio: format === 'window-sticker' && customWidth && customHeight 
                      ? `${customWidth}/${customHeight}` 
                      : formats.find(f => f.id === format)?.dimensions 
                        ? `${formats.find(f => f.id === format)?.dimensions.width}/${formats.find(f => f.id === format)?.dimensions.height}`
                        : '9/16'
                  }}
                >
                  {uploadedDesign ? (
                    <img src={uploadedDesign} alt="Custom Design" className="w-full h-full object-cover" />
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-white text-center overflow-hidden">
                      <div 
                        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
                        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop")' }}
                      />
                      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

                      <div className="relative w-full h-full flex items-center justify-center">
                        {elements.map((el) => (
                          <div 
                            key={el.id}
                            style={{ 
                              position: 'absolute',
                              left: '50%',
                              top: `${el.y}%`,
                              transform: `translate(-50%, 0) scale(${el.scale})`,
                              x: `${el.x}%`,
                              zIndex: el.id === 'headline' ? 3 : el.id === 'subheadline' ? 2 : 1
                            }}
                            className="w-full"
                          >
                            {el.type === 'text' ? (
                              <div className="text-center px-4">
                                <h3 
                                  style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight }}
                                  className="text-white leading-tight drop-shadow-lg tracking-tight"
                                >
                                  {el.text}
                                </h3>
                              </div>
                            ) : (
                              <div className="bg-white p-3 rounded-[18px] shadow-2xl mx-auto inline-block">
                                 <QRCodeSVG 
                                  value={activeQrUrl}
                                  size={80}
                                  level="H"
                                  includeMargin={false}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <h2 className="text-headline-lg-mobile text-on-surface mb-1">{headline || 'Your Asset'}</h2>
                  <p className="text-body-sm text-on-surface-variant uppercase tracking-widest font-bold">
                    {format === 'window-sticker' && customWidth && customHeight 
                      ? `${customWidth} x ${customHeight} ${customUnit}`
                      : formats.find(f => f.id === format)?.size || 'Custom Size'}
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-headline-md text-on-surface font-semibold">See It In Real Life</h3>
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
                  {mockupEnvs.map((env) => (
                    <button key={env} onClick={() => setMockupEnv(env)} className={`px-4 py-2 rounded-xl text-label-caps transition-all cursor-pointer ${mockupEnv === env ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>{env}</button>
                  ))}
                </div>
                <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-sm ${mockupColors[mockupEnv] || 'bg-surface-container-low'} flex items-center justify-center`}>
                  <div className="text-center opacity-40">
                    <div className="mx-auto mb-2 p-2 bg-white/10 rounded-lg inline-block">
                        <QRCodeSVG value={activeQrUrl} size={40} level="L" />
                    </div>
                    <p className="text-body-sm text-on-surface-variant">{mockupEnv} environment preview</p>
                  </div>
                  <div className="absolute top-3 right-3 bg-primary/10 backdrop-blur-md px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-label-caps text-primary uppercase block">Live Preview</span>
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container"><span className="material-symbols-outlined text-[20px]">info</span></div>
                  <div>
                    <h4 className="text-headline-md text-[16px] text-on-surface font-semibold">Design Specs</h4>
                    <p className="text-body-sm text-on-surface-variant">{format === 'social-media' ? 'Optimized for Instagram & TikTok' : 'Ready for print'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-low p-3 rounded-lg"><span className="text-label-caps text-on-surface-variant block mb-1">FORMAT</span><span className="text-body-lg font-semibold">{formats.find(f => f.id === format)?.label || 'Standard'}</span></div>
                  <div className="bg-surface-container-low p-3 rounded-lg"><span className="text-label-caps text-on-surface-variant block mb-1">RESOLUTION</span><span className="text-body-lg font-semibold">1080 x 1920</span></div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {step !== 5 && (
        <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-[60]">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-surface/80 backdrop-blur-xl border border-outline-variant/20 p-4 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
          >
            {step === 6 ? (
              <div className="flex items-center gap-3">
                <button className="flex-1 h-12 border border-primary text-primary font-button text-button rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container/10 active:scale-95 transition-all cursor-pointer">
                  <Bookmark size={18} />
                  Save Asset
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex-[1.5] h-12 bg-primary text-on-primary font-button text-button rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <Download size={18} />
                  Download
                </button>
              </div>
            ) : step === 4 ? (
              <div className="flex items-center gap-3">
                <button className="flex-1 h-12 border border-outline text-on-surface font-button text-button rounded-xl hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer">
                  Save Draft
                </button>
                <button 
                  onClick={handleContinue} 
                  disabled={!canContinue()} 
                  className="flex-[2] h-12 bg-primary text-on-primary font-button text-button rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowLeft size={18} className="rotate-180" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleContinue} 
                disabled={!canContinue()} 
                className="w-full h-14 bg-primary text-on-primary font-button text-button rounded-[18px] shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
              >
                <span className="text-button">Continue to Next Step</span>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowLeft size={18} className="rotate-180" />
                </div>
              </button>
            )}
          </motion.div>
        </footer>
      )}

      {showAiSheet && (
        <>
          <div className="fixed inset-0 bg-on-surface/40 z-[60]" onClick={() => setShowAiSheet(false)} />
          <div className="fixed bottom-0 left-0 w-full bg-surface rounded-t-[32px] z-[70] max-h-[795px] overflow-hidden flex flex-col shadow-2xl">
            <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto my-4 shrink-0" />
            <div className="px-5 pb-6 space-y-5 overflow-y-auto">
              <header className="text-center"><h3 className="text-headline-md font-semibold">AI Content Optimizer</h3><p className="text-body-sm text-on-surface-variant mt-1">Refining your brand voice using Marketing AI</p></header>
              <div className="space-y-4">
                <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20"><span className="text-label-caps text-on-surface-variant block mb-2">Original Version</span><h4 className="text-headline-md text-primary opacity-60">{headline || 'Your headline'}</h4><p className="text-body-sm text-on-surface-variant mt-2 italic">{subheadline || 'Your subheadline...'}</p></div>
                <div className="flex justify-center -my-2"><div className="bg-primary-container text-on-primary-container p-2 rounded-full shadow-md"><span className="material-symbols-outlined text-[20px] block">expand_more</span></div></div>
                <div className="p-4 bg-primary-container/10 rounded-xl border-2 border-primary relative overflow-hidden"><div className="absolute top-0 right-0 bg-primary text-on-primary px-3 py-1 rounded-bl-lg text-label-caps text-[10px]">RECOMMENDED</div><span className="text-label-caps text-primary block mb-2">AI Enhanced Version</span><h4 className="text-headline-md text-on-surface">{aiHeadline || 'Enhanced version will appear here'}</h4><p className="text-body-sm text-on-surface mt-2 leading-relaxed">Experience a curated fusion of high-velocity style and intentional comfort. Designed for the modern professional who demands both elegance and performance.</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setShowAiSheet(false)} className="h-12 border border-outline-variant text-on-surface font-button rounded-xl hover:bg-surface-container transition-colors cursor-pointer">Try Another</button>
                <button onClick={applyAiContent} className="h-12 bg-primary text-on-primary font-button rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer">Use This</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Design Editor Modal */}
      <AnimatePresence>
        {editingDesign && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
            <div className="w-full max-w-5xl flex flex-col md:flex-row gap-12 h-full items-center">
              <div className="flex-1 w-full h-full flex items-center justify-center">
                <div ref={canvasRef} className="relative w-full max-w-[340px] aspect-[9/16] bg-slate-900 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-[8px] border-white/5">
                    <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity pointer-events-none" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop")' }} />
                    <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none" />
                    {elements.map((el) => (
                      <motion.div 
                        key={el.id} drag dragConstraints={canvasRef} dragElastic={0} dragMomentum={false} onDragEnd={(e, info) => handleDragEnd(el.id, e, info)} onClick={() => setSelectedElementId(el.id)}
                        className={`draggable-element absolute cursor-grab active:cursor-grabbing p-2 rounded-lg transition-shadow group ${selectedElementId === el.id ? 'ring-2 ring-primary bg-primary/5 z-50' : 'z-10 hover:bg-white/5'}`}
                        style={{ left: '50%', top: `${el.y}%`, x: `${el.x}%`, translateX: '-50%', scale: el.scale }}
                      >
                        {el.type === 'text' ? (
                          <div className="text-center pointer-events-none select-none"><h3 style={{ fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight }} className="text-white leading-tight drop-shadow-lg tracking-tight max-w-[280px] text-center">{el.text}</h3></div>
                        ) : (
                          <div className="bg-white p-3 rounded-[18px] shadow-2xl pointer-events-none select-none mx-auto inline-block">
                             <QRCodeSVG value={activeQrUrl} size={80} level="H" includeMargin={false} />
                          </div>
                        )}
                        {selectedElementId === el.id && (
                          <div className="absolute -inset-1 border border-primary/50 pointer-events-none rounded-lg">
                            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow-sm" />
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow-sm" />
                            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow-sm" />
                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow-sm" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    <div className="absolute inset-0 border border-white/10 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20"><div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" /><div className="border border-white/5" /></div>
                </div>
              </div>
              <div className="w-full md:w-[400px] bg-surface rounded-[40px] p-8 space-y-8 overflow-y-auto max-h-full">
                <header><h2 className="text-headline-lg text-on-surface font-black">Layout Editor</h2><p className="text-body-md text-on-surface-variant">Drag elements on the canvas to reposition. Use the scale control for size.</p></header>
                <div className="space-y-6">
                  {selectedElementId ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-label-caps text-primary font-bold uppercase tracking-widest">Editing: {selectedElementId.replace('-', ' ')}</h4>
                        <button onClick={() => { const defaults: any = { headline: { x: 0, y: 15, scale: 1 }, subheadline: { x: 0, y: 35, scale: 1 }, qr: { x: 0, y: 65, scale: 1 } }; setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, ...defaults[el.id] } : el)); }} className="text-[10px] text-on-surface-variant hover:text-primary transition-colors font-bold underline underline-offset-4">RESET ELEMENT</button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-on-surface-variant font-bold uppercase"><span>Element Scale</span><span className="text-primary">{Math.round((elements.find(el => el.id === selectedElementId)?.scale || 1) * 100)}%</span></div>
                        <input type="range" min="0.5" max="2" step="0.05" value={elements.find(el => el.id === selectedElementId)?.scale || 1} onChange={(e) => handleScaleChange(selectedElementId, parseFloat(e.target.value))} className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary" />
                      </div>
                      <div className="pt-2"><button onClick={() => handleCenterElement(selectedElementId)} className="w-full h-12 bg-surface-container-high hover:bg-primary/10 hover:text-primary border border-outline-variant text-on-surface font-button text-button rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"><span className="material-symbols-outlined text-[20px]">align_horizontal_center</span>Auto-Center Horizontally</button></div>
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl"><p className="text-[11px] text-on-surface-variant leading-relaxed"><span className="font-bold text-primary">TIP:</span> You can physically drag the element around the preview screen to the left.</p></div>
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-4"><div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto text-on-surface-variant/40"><Sparkles size={32} /></div><p className="text-body-md text-on-surface-variant font-medium">Select an element on the canvas to begin editing.</p></div>
                  )}
                </div>
                <div className="flex flex-col gap-3 pt-4"><button onClick={() => setEditingDesign(false)} className="w-full h-14 bg-primary text-on-primary font-button text-button rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">Finish Design</button><button onClick={() => { setElements([ { id: 'headline', type: 'text', text: headline || 'Scan to Experience', x: 0, y: 15, fontSize: 28, color: '#FFFFFF', fontWeight: '900', scale: 1 }, { id: 'subheadline', type: 'text', text: subheadline || 'Join our community...', x: 0, y: 35, fontSize: 16, color: '#FFFFFF', fontWeight: '500', scale: 1 }, { id: 'qr', type: 'qr', x: 0, y: 65, size: 120, scale: 1 } ]); }} className="w-full h-12 text-on-surface-variant font-button text-button hover:bg-surface-container transition-colors rounded-xl">Reset Entire Layout</button></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* AI Image Generation Modal */}
      <AnimatePresence>
        {showAiImageModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-on-surface/40 z-[80] backdrop-blur-sm" onClick={() => !isGeneratingImage && setShowAiImageModal(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed bottom-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-2xl bg-surface rounded-t-[32px] md:rounded-[32px] z-[90] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto my-4 shrink-0 md:hidden" />
              
              <div className="px-6 py-6 md:py-8 space-y-6 overflow-y-auto">
                <header className="text-center relative">
                  {!isGeneratingImage && (
                    <button 
                      onClick={() => setShowAiImageModal(false)}
                      className="absolute right-0 top-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  )}
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-headline-md font-bold text-on-surface">Generate Custom Design with AI</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">Describe what you want, and our AI will create a unique design for you.</p>
                </header>

                {!generatedImageUrl ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-label-caps text-on-surface-variant ml-1">Describe your vision</label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        disabled={isGeneratingImage}
                        placeholder="e.g., A modern design for a coffee shop with dark wood textures and golden accents..."
                        className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-2xl p-4 text-body-lg min-h-[120px] outline-none transition-all disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-label-caps text-on-surface-variant ml-1">Or try a preset</p>
                      <div className="flex flex-wrap gap-2">
                        {presetPrompts.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => setAiPrompt(p)}
                            disabled={isGeneratingImage}
                            className={`px-4 py-2 rounded-full text-label-caps border transition-all active:scale-95 disabled:opacity-50 ${aiPrompt === p ? 'bg-primary border-primary text-white shadow-lg' : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
                          >
                            {p.split(' ').slice(0, 3).join(' ')}...
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleGenerateAiImage}
                      disabled={isGeneratingImage || !aiPrompt.trim()}
                      className="w-full h-14 bg-primary text-on-primary font-button text-button rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isGeneratingImage ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Generating Art...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          <span>Generate Design</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    <div className="relative aspect-[9/16] max-h-[400px] mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                      <img src={generatedImageUrl} alt="Generated Design" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Preview</p>
                        <p className="text-body-sm italic line-clamp-2">"{aiPrompt}"</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setGeneratedImageUrl(null)}
                        className="h-14 border border-outline-variant text-on-surface font-button text-button rounded-2xl hover:bg-surface-container transition-all active:scale-95"
                      >
                        Reject & Retry
                      </button>
                      <button 
                        onClick={handleUseGeneratedImage}
                        className="h-14 bg-primary text-on-primary font-button text-button rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Check size={20} />
                        Use This Design
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
