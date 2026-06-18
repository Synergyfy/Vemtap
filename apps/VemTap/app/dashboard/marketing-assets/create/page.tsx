"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Sparkles,
  QrCode as QrIcon,
  Download,
  Layout,
  Plus,
  Monitor,
  ChevronRight,
  ChevronLeft,
  Wand2,
  Eye,
  FileText,
  Smartphone,
  Save,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Info
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Button } from '@/components/ui/button';
import MarketingAssetEditor, { EditorElement } from '@/components/dashboard/marketing/MarketingAssetEditor';
import {
  useCreateMarketingAsset,
  useMarketingTemplates,
  useAIPrompts,
} from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

type CreateStep = 'method' | 'gallery' | 'ai' | 'ai_results' | 'editor' | 'preview' | 'success';

export default function CreateAssetWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'poster';
  const templateId = searchParams.get('templateId');

  // API Hooks
  const { data: templates = [] } = useMarketingTemplates(undefined, type);
  const { data: business } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  const { activeBranchId } = useActiveBranch();
  const activeBranch = branches.find((b: any) => b.id === activeBranchId) || branches[0];
  const createAssetMutation = useCreateMarketingAsset();
  const { data: aiPrompts = [] } = useAIPrompts();

  // Navigation State
  const [step, setStep] = useState<CreateStep>(templateId ? 'editor' : 'method');
  const [history, setHistory] = useState<CreateStep[]>([]);

  // Editor State
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [bgImage, setBgImage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // AI State
  const [aiGoal, setAiGoal] = useState('Promotion');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiVariations, setAiVariations] = useState<any[]>([]);

  const qrUrl = useMemo(() => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vemtap.com';
      return activeBranch?.uniqueCode ? `${origin}/${activeBranch.uniqueCode}` : `${origin}/your-business`;
  }, [activeBranch]);

  const businessLogo = activeBranch?.logoUrl || business?.logoUrl || '';

  // Initial template load if templateId provided
  useEffect(() => {
    if (templateId && templates.length > 0) {
        const t = templates.find((tpl: any) => tpl.id === templateId);
        if (t) handleSelectTemplate(t);
    }
  }, [templateId, templates]);

  const goToStep = (next: CreateStep) => {
    setHistory([...history, step]);
    setStep(next);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setStep(prev);
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
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error('Please describe your goal');
    setIsGenerating(true);
    
    try {
        await new Promise(r => setTimeout(r, 2000));
        
        const variations = [
            {
                id: 'var-1',
                name: 'Modern Bold',
                backgroundColor: '#F8FAFC',
                elements: [
                    { id: 'logo-1', type: 'logo', x: 35, y: 10, width: 30, height: 10 },
                    { id: 'headline-1', type: 'text', text: aiPrompt.toUpperCase(), x: 10, y: 25, fontSize: 24, color: '#066CF4', fontWeight: 'black', alignment: 'center', width: 80 },
                    { id: 'sub-1', type: 'text', text: `Exclusive ${aiGoal} - Scan to unlock!`, x: 10, y: 38, fontSize: 12, color: '#64748B', fontWeight: 'bold', alignment: 'center', width: 80 },
                    { id: 'qr-1', type: 'qr', x: 25, y: 50, size: 140 },
                    { id: 'footer-1', type: 'text', text: business?.name || 'Powered by VemTap', x: 10, y: 82, fontSize: 9, color: '#94A3B8', fontWeight: 'bold', alignment: 'center', width: 80, locked: true },
                ]
            },
            {
                id: 'var-2',
                name: 'Elegant Minimal',
                backgroundColor: '#FFFFFF',
                elements: [
                    { id: 'logo-2', type: 'logo', x: 10, y: 8, width: 25, height: 8 },
                    { id: 'headline-2', type: 'text', text: aiPrompt, x: 10, y: 20, fontSize: 32, color: '#0F172A', fontWeight: 'light', alignment: 'left', width: 80 },
                    { id: 'qr-2', type: 'qr', x: 60, y: 65, size: 110 },
                    { id: 'sub-2', type: 'text', text: `Join our ${aiGoal} campaign today.`, x: 10, y: 70, fontSize: 14, color: '#066CF4', fontWeight: 'black', alignment: 'left', width: 45 },
                ]
            },
            {
                id: 'var-3',
                name: 'High Impact',
                backgroundColor: '#066CF4',
                elements: [
                    { id: 'headline-3', type: 'text', text: aiPrompt.toUpperCase(), x: 5, y: 15, fontSize: 42, color: '#FFFFFF', fontWeight: 'black', alignment: 'center', width: 90 },
                    { id: 'qr-3', type: 'qr', x: 30, y: 45, size: 130 },
                    { id: 'logo-3', type: 'logo', x: 35, y: 85, width: 30, height: 8 },
                ]
            }
        ];
        
        setAiVariations(variations);
        setStep('ai_results');
        toast.success('AI Design Variations Ready!');
    } catch (err) {
        toast.error('AI Generation failed');
    } finally {
        setIsGenerating(false);
    }
  };

  const handlePickVariation = (variation: any) => {
    setElements(variation.elements);
    setBgColor(variation.backgroundColor);
    setStep('editor');
  };

  const handleSaveAndPreview = () => {
    setStep('preview');
  };

  const [isExporting, setIsGeneratingExport] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!downloadRef.current) return;
    setIsGeneratingExport(true);
    const toastId = toast.loading('Exporting your asset...');

    try {
        const dataUrl = await htmlToImage.toPng(downloadRef.current, { quality: 1, pixelRatio: 3 });
        
        if (format === 'pdf') {
            const win = window.open('', '_blank');
            win?.document.write(`<html><body><img src="${dataUrl}" style="width:100%"/></body></html>`);
            win?.document.close();
            win?.print();
        } else {
            const link = document.createElement('a');
            link.download = `${type}-asset.png`;
            link.href = dataUrl;
            link.click();
        }

        // Save to Library
        await createAssetMutation.mutateAsync({
            name: `${type.replace('_', ' ')} ${new Date().toLocaleDateString()}`,
            type: type,
            branchId: activeBranchId as string,
            customConfig: { elements, backgroundColor: bgColor, backgroundImage: bgImage },
            qrCodeContent: qrUrl
        });

        toast.success('Asset saved to library!', { id: toastId });
        setStep('success');
    } catch (err) {
        toast.error('Export failed', { id: toastId });
    } finally {
        setIsGeneratingExport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      {step !== 'success' && (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col">
                <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Create {type.replace('_', ' ')}</h1>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">{step.replace('_', ' ').toUpperCase()} PHASE</p>
            </div>
          </div>
          {step === 'editor' && (
            <Button onClick={handleSaveAndPreview} className="h-10 px-6 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                Preview <ChevronRight size={14} className="ml-1" />
            </Button>
          )}
        </header>
      )}

      <main className="max-w-6xl mx-auto pt-8 px-6">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 5: CHOOSE DESIGN METHOD */}
          {step === 'method' && (
            <motion.div key="method" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-4xl mx-auto">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black text-gray-900">How would you like to design?</h2>
                    <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">Pick a preset template or let our AI create a unique design for you.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => goToStep('gallery')} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:border-primary/20 hover:shadow-xl transition-all group flex flex-col items-center text-center space-y-6">
                        <div className="size-20 bg-blue-50 text-primary rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Layout size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-gray-900">Use Template</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-relaxed">Browse professionally designed presets for your business type.</p>
                        </div>
                        <div className="size-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <ChevronRight size={24} />
                        </div>
                    </button>

                    <button onClick={() => goToStep('ai')} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:border-[#066CF4]/20 hover:shadow-xl transition-all group flex flex-col items-center text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 size-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                        <div className="size-20 bg-[#066CF4]/10 text-[#066CF4] rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Sparkles size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-gray-900">Generate with AI</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-relaxed">Describe your goal and let Gemini AI craft the perfect marketing asset.</p>
                        </div>
                        <div className="size-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#066CF4] group-hover:text-white transition-all shadow-inner">
                            <Sparkles size={20} />
                        </div>
                    </button>
                </div>
            </motion.div>
          )}

          {/* SCREEN 6A: TEMPLATE GALLERY */}
          {step === 'gallery' && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-gray-900">Choose a Template</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selected Format: {type.replace('_', ' ')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {templates.map((tpl: any) => (
                        <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)} className="group space-y-4 text-left">
                            <div className="aspect-[4/5] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group-hover:border-primary/40 group-hover:shadow-xl transition-all">
                                {tpl.thumbnailUrl ? (
                                    <img src={tpl.thumbnailUrl} alt={tpl.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                        <Layout size={40} className="text-gray-200" />
                                    </div>
                                )}
                            </div>
                            <div className="px-2">
                                <h4 className="text-sm font-black text-gray-900">{tpl.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{tpl.category}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
          )}

          {/* SCREEN 6B: GENERATE WITH AI */}
          {step === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-8 pt-10">
                <div className="text-center space-y-4">
                    <div className="size-16 bg-[#066CF4]/10 text-[#066CF4] rounded-3xl mx-auto flex items-center justify-center">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900">What is your goal?</h2>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-8">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Campaign Type</p>
                        <div className="grid grid-cols-2 gap-3">
                            {['Promotion', 'Loyalty', 'Feedback', 'Menu'].map(goal => (
                                <button key={goal} onClick={() => setAiGoal(goal)} className={cn("px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border", aiGoal === goal ? "bg-primary text-white" : "bg-gray-50 text-gray-400 border-gray-100")}>
                                    {goal}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Your Vision</p>
                        <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="e.g. Bold restaurant poster for Summer Pizza..."
                            className="w-full h-32 p-5 rounded-[1.5rem] border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none text-sm font-bold text-gray-900"
                        />
                    </div>

                    <Button onClick={handleAiGenerate} disabled={isGenerating} className="w-full h-16 rounded-[1.5rem] bg-[#066CF4] text-white text-xs font-black uppercase tracking-[0.2em]">
                        {isGenerating ? 'Gemini is Thinking...' : 'Generate Designs'}
                    </Button>
                </div>
            </motion.div>
          )}

          {/* AI RESULTS VARIATIONS */}
          {step === 'ai_results' && (
            <motion.div key="ai_results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black text-gray-900">Choose a Variation</h2>
                    <p className="text-sm font-medium text-gray-500">Pick the best layout to start customizing.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {aiVariations.map((v) => (
                        <div key={v.id} className="space-y-6">
                            <div className="aspect-[4/6] bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative group">
                                <div className="absolute inset-0 scale-[0.5] origin-top-left" style={{ width: '200%', height: '200%', backgroundColor: v.backgroundColor }}>
                                    {v.elements.map((el: any) => (
                                        <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: el.width ? `${el.width}%` : 'auto' }}>
                                            {el.type === 'text' && <div style={{ color: el.color, fontSize: `${el.fontSize * 1.5}px`, fontWeight: el.fontWeight, textAlign: el.alignment }} className="w-full leading-tight">{el.text}</div>}
                                            {el.type === 'qr' && <div className="bg-white p-2 rounded-2xl inline-block"><QRCodeSVG value={qrUrl} size={el.size} /></div>}
                                            {el.type === 'logo' && businessLogo && <img src={businessLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
                            </div>
                            <Button onClick={() => handlePickVariation(v)} className="w-full h-12 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest">
                                Select {v.name}
                            </Button>
                        </div>
                    ))}
                </div>
            </motion.div>
          )}

          {/* SCREEN 7: EDITOR */}
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

          {/* SCREEN 8: PREVIEW */}
          {step === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-12 pb-20">
                <div className="flex flex-col lg:flex-row items-start gap-12">
                    <div className="flex-1 w-full flex justify-center">
                        <div id="export-container" ref={downloadRef} className="shadow-2xl ring-[20px] ring-white rounded-[2rem] overflow-hidden" style={{ width: 320, backgroundColor: bgColor }}>
                            <div className="w-full aspect-[4/6] relative overflow-hidden" style={{ backgroundColor: bgColor, backgroundImage: bgImage ? `url(${bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {elements.map(el => (
                                    <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: el.width ? `${el.width}%` : 'auto', zIndex: el.type === 'logo' ? 30 : 10 }}>
                                        {el.type === 'text' && <div style={{ color: el.color, fontSize: `${el.fontSize}px`, fontWeight: el.fontWeight, textAlign: el.alignment }} className="w-full leading-tight">{el.text}</div>}
                                        {el.type === 'qr' && <div className="bg-white p-2 rounded-2xl flex items-center justify-center"><QRCodeSVG value={qrUrl} size={el.size} /></div>}
                                        {el.type === 'logo' && businessLogo && <img src={businessLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-80 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                            <Button onClick={() => handleExport('png')} className="w-full h-14 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl gap-3">
                                <Download size={16} /> Download PNG
                            </Button>
                            <Button onClick={() => handleExport('pdf')} variant="outline" className="w-full h-14 border-2 border-gray-100 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl gap-3">
                                <Printer size={16} /> Print as PDF
                            </Button>
                        </div>
                        <button onClick={() => setStep('editor')} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-primary transition-colors">
                            <ChevronLeft size={16} /> Back to Editor
                        </button>
                    </div>
                </div>
            </motion.div>
          )}

          {/* SCREEN 10: SUCCESS */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto pt-10 text-center space-y-12">
                <div className="space-y-6">
                    <div className="size-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-lg">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900">Design Ready!</h2>
                </div>
                <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-8">
                    <Button onClick={() => router.push('/dashboard/marketing-assets')} className="h-16 w-full rounded-2xl bg-[#066CF4] text-white text-xs font-black uppercase tracking-[0.2em]">
                        Return to Marketing Hub
                    </Button>
                </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
