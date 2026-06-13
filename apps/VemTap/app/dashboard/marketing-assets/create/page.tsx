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
  ChevronDown,
  Plus,
  Trash2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import { MarketingAssetRenderer } from '@/components/dashboard/MarketingAssetPreview';
import {
  useCreateMarketingAsset,
  useBrandProfile,
  useTemplateStyles,
  useTemplateFormats,
  useAIPrompts,
  useGenerateAIContent,
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
  const { data: branches = [] } = useBranches();
  const { data: business } = useMyBusiness();
  const { data: qrCodes = [] } = useQrThriveCodes();
  const { data: aiPrompts = [] } = useAIPrompts();
  const generateAIContentMutation = useGenerateAIContent();
  const createAssetMutation = useCreateMarketingAsset();
  useQrThriveMappingStatus();

  const [step, setStep] = useState(templateId ? 2 : 1);
  const [goal, setGoal] = useState<Goal>(null);
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [format, setFormat] = useState<AssetFormat>(null);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [customUnit, setCustomUnit] = useState('px');

  // Element Control State
  const [editingDesign, setEditingDesign] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const canvasRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  
  const [elements, setElements] = useState<any[]>([
    { id: 'headline', type: 'text', text: 'Scan to Experience', x: 10, y: 15, fontSize: 22, color: '#0F172A', fontWeight: 'extrabold', alignment: 'center', width: 80 },
    { id: 'subheadline', type: 'text', text: 'Join our community and unlock exclusive digital access.', x: 10, y: 35, fontSize: 11, color: '#475569', fontWeight: 'medium', alignment: 'center', width: 80 },
    { id: 'qr', type: 'qr', x: 25, y: 55, size: 130 }
  ]);

  // QR Selection State
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null);
  const [isQrDropdownOpen, setIsQrDropdownOpen] = useState(false);

  // Sync elements with input fields
  useEffect(() => {
    setElements(prev => prev.map(el => {
      if (el.id === 'headline') return { ...el, text: el.text || headline || 'Scan to Experience' };
      if (el.id === 'subheadline') return { ...el, text: el.text || subheadline || 'Join our community and unlock exclusive digital access.' };
      return el;
    }));
  }, []); // only on mount

  // Contrast logic helper
  const getContrastColor = (hex: string) => {
    if (!hex) return '#0F172A';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#0F172A' : '#FFFFFF';
  };

  const getSubheadlineColor = (hex: string) => {
    if (!hex) return '#475569';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#475569' : 'rgba(255,255,255,0.7)';
  };

  useEffect(() => {
    const textColor = getContrastColor(backgroundColor);
    const subColor = getSubheadlineColor(backgroundColor);
    setElements(prev => prev.map(el => {
      if (el.type === 'text') {
        return { ...el, color: el.id === 'headline' ? textColor : subColor };
      }
      return el;
    }));
  }, [backgroundColor]);

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
  const [mockupEnv, setMockupEnv] = useState('Wall');
  const [aiHeadline, setAiHeadline] = useState('');
  
  const previewBusinessLogo = business?.logoUrl || (branches && branches.length > 0 ? (branches[0] as any)?.logoUrl : '') || brandProfile?.logoUrl || '';

  const presetPrompts = [
    "A vibrant summer-themed design with tropical leaves and bright colors.",
    "A minimalist and elegant layout for a luxury brand.",
    "A bold and energetic design for a fitness or sports brand.",
    "A cozy and warm aesthetic for a cafÃ© or bakery.",
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

  const handleGenerateAi = async () => {
    let category = 'Review Request';
    if (goal === 'view-menu' || goal === 'place-order' || goal === 'reserve-table') {
      category = 'Contactless Menu';
    } else if (goal === 'join-loyalty' || goal === 'promotions') {
      category = 'Discount Promo';
    } else if (goal === 'leave-feedback') {
      category = 'Review Request';
    }

    const matchedPrompt = aiPrompts?.find((p: any) => p.category?.toLowerCase() === category.toLowerCase()) 
                          || aiPrompts?.[0];

    if (!matchedPrompt) {
      toast.error('AI prompts not loaded yet. Please wait a moment.');
      return;
    }

    setShowAiSheet(true);
    try {
      const response = await generateAIContentMutation.mutateAsync({
        promptId: matchedPrompt.id,
        businessType: (typeof business?.category === 'string' ? business.category : (business?.category as any)?.name) || 'store',
        businessName: business?.name || brandProfile?.name || 'our business',
        tone: 'Friendly and Catchy',
        subject: goal || 'Google Reviews'
      });

      if (response && response.text) {
        setAiHeadline(response.text);
      } else {
        toast.error('Failed to generate tagline suggestions');
      }
    } catch (err: any) {
      console.error('AI copywriting generation failed:', err);
      toast.error(err.message || 'Failed to generate content');
    }
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
          options: { goal, format }
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
    if (!downloadRef.current) return;
    
    const toastId = toast.loading('Preparing high-fidelity export...');
    try {
      const dataUrl = await htmlToImage.toPng(downloadRef.current, {
        quality: 1.0,
        pixelRatio: 2, // 1200px * 2 = 2400px wide crisp output
        skipAutoScale: true,
        cacheBust: true,
      });

      const link = document.createElement('a');
      const sanitizedHeadline = (headline || 'marketing-asset').trim().replace(/[^a-zA-Z0-9-_]/g, '_');
      link.download = `${sanitizedHeadline}-${format || 'custom'}.png`;
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

  // Auto-select QR when opening editor with an AI/uploaded design
  useEffect(() => {
    if (editingDesign && uploadedDesign) {
      setSelectedElementId('qr');
    }
    if (!editingDesign) {
      setSelectedElementId(null);
    }
  }, [editingDesign, uploadedDesign]);

  // ---- Admin-style element management ----
  const handleAddTextElement = (presetText: string, defaultSize: number, weight: string) => {
    const id = `text-${Date.now()}`;
    setElements(prev => [...prev, {
      id, type: 'text', text: presetText,
      x: 10, y: 45, fontSize: defaultSize,
      color: backgroundColor === '#FFFFFF' ? '#0F172A' : '#FFFFFF',
      fontWeight: weight, alignment: 'center', width: 80
    }]);
    setSelectedElementId(id);
    toast.success('Text element added! Drag it on the canvas.');
  };

  const handleAddLogoElement = () => {
    if (elements.some(el => el.type === 'logo')) {
      toast.error('Only one Brand Logo slot is allowed!');
      return;
    }
    const id = `logo-${Date.now()}`;
    setElements(prev => [...prev, { id, type: 'logo', x: 35, y: 8, width: 30, height: 8 }]);
    setSelectedElementId(id);
    toast.success('Brand logo slot added!');
  };

  const handleAddQrElement = () => {
    if (elements.some(el => el.type === 'qr')) {
      toast.error('Only one QR Code slot is allowed!');
      return;
    }
    const id = `qr-${Date.now()}`;
    setElements(prev => [...prev, { id, type: 'qr', x: 25, y: 55, size: 120 }]);
    setSelectedElementId(id);
    toast.success('QR Code element added!');
  };

  const handleDeleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElementId === elementId) setSelectedElementId(null);
    toast.success('Element deleted');
  };

  // Resize handler (admin-style: bottom-right corner drag)
  const handleResizeStart = (el: any, startEvent: React.MouseEvent | React.TouchEvent) => {
    startEvent.stopPropagation();
    if (!canvasRef.current) return;
    const isTouchEvent = 'touches' in startEvent;
    const startX = isTouchEvent ? startEvent.touches[0].clientX : startEvent.clientX;
    const initialSize = el.size || 110;
    const initialFontSize = el.fontSize || 14;
    const initialWidth = el.width || 30;
    const initialHeight = el.height || 8;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    const handleResizeMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const isTouchMove = 'touches' in moveEvent;
      const currentX = isTouchMove ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaX = currentX - startX;

      if (el.type === 'logo') {
        const isTouchMove2 = 'touches' in moveEvent;
        const currentY2 = isTouchMove2 ? (moveEvent as TouchEvent).touches[0].clientY : (moveEvent as MouseEvent).clientY;
        const startY2 = isTouchEvent ? (startEvent as React.TouchEvent).touches[0].clientY : (startEvent as React.MouseEvent).clientY;
        const deltaY2 = currentY2 - startY2;
        const newW = Math.max(10, Math.min(100, Math.round(initialWidth + (deltaX / canvasRect.width) * 100)));
        const newH = Math.max(2, Math.min(50, Math.round(initialHeight + (deltaY2 / canvasRect.height) * 100)));
        setElements(prev => prev.map(item => item.id === el.id ? { ...item, width: newW, height: newH } : item));
      } else if (el.type === 'qr') {
        const newSize = Math.max(40, Math.min(260, Math.round(initialSize + deltaX)));
        setElements(prev => prev.map(item => item.id === el.id ? { ...item, size: newSize } : item));
      } else if (el.type === 'text') {
        const newFontSize = Math.max(6, Math.min(72, Math.round(initialFontSize + deltaX / 3)));
        setElements(prev => prev.map(item => item.id === el.id ? { ...item, fontSize: newFontSize } : item));
      }
    };

    const handleResizeEnd = () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.removeEventListener('touchmove', handleResizeMove);
      document.removeEventListener('touchend', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('touchmove', handleResizeMove, { passive: false });
    document.addEventListener('touchend', handleResizeEnd);
  };

  const handleCustomDragStart = (el: any, startEvent: React.MouseEvent | React.TouchEvent) => {
    startEvent.stopPropagation();
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const isTouchEvent = 'touches' in startEvent;
    const startX = isTouchEvent ? startEvent.touches[0].clientX : startEvent.clientX;
    const startY = isTouchEvent ? startEvent.touches[0].clientY : startEvent.clientY;

    const initialX = el.x;
    const initialY = el.y;

    const handleCustomDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const isTouchMove = 'touches' in moveEvent;
      
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }

      const currentX = isTouchMove ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = isTouchMove ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      const deltaXPct = (deltaX / canvasRect.width) * 100;
      const deltaYPct = (deltaY / canvasRect.height) * 100;

      const newX = Math.max(0, Math.min(95, Math.round(initialX + deltaXPct)));
      const newY = Math.max(0, Math.min(95, Math.round(initialY + deltaYPct)));

      setElements(prev => prev.map(item => 
        item.id === el.id ? { ...item, x: newX, y: newY } : item
      ));
    };

    const handleCustomDragEnd = () => {
      document.removeEventListener('mousemove', handleCustomDragMove);
      document.removeEventListener('mouseup', handleCustomDragEnd);
      document.removeEventListener('touchmove', handleCustomDragMove);
      document.removeEventListener('touchend', handleCustomDragEnd);
    };

    document.addEventListener('mousemove', handleCustomDragMove);
    document.addEventListener('mouseup', handleCustomDragEnd);
    document.addEventListener('touchmove', handleCustomDragMove, { passive: false });
    document.addEventListener('touchend', handleCustomDragEnd);
  };

  const handleCenterElement = (elementId: string) => {
    setElements(prev => prev.map(el => el.id === elementId ? { ...el, x: 0 } : el));
    toast.success('Element centered horizontally');
  };

  const handleScaleChange = (elementId: string, newScale: number) => {
    setElements(prev => prev.map(el => el.id === elementId ? { ...el, scale: newScale } : el));
  };

  const handleCustomWidthStart = (el: any, startEvent: React.MouseEvent | React.TouchEvent) => {
    startEvent.stopPropagation();
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const isTouchEvent = 'touches' in startEvent;
    const startX = isTouchEvent ? startEvent.touches[0].clientX : startEvent.clientX;

    const initialWidth = el.width || 90;

    const handleWidthMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const isTouchMove = 'touches' in moveEvent;
      const currentX = isTouchMove ? moveEvent.touches[0].clientX : moveEvent.clientX;

      const deltaX = currentX - startX;
      const deltaWidthPct = (deltaX / canvasRect.width) * 100;
      
      const newWidth = Math.max(10, Math.min(100, Math.round(initialWidth + (deltaWidthPct * 2))));

      setElements(prev => prev.map(item => 
        item.id === el.id ? { ...item, width: newWidth } : item
      ));
    };

    const handleWidthEnd = () => {
      document.removeEventListener('mousemove', handleWidthMove);
      document.removeEventListener('mouseup', handleWidthEnd);
      document.removeEventListener('touchmove', handleWidthMove);
      document.removeEventListener('touchend', handleWidthEnd);
    };

    document.addEventListener('mousemove', handleWidthMove);
    document.addEventListener('mouseup', handleWidthEnd);
    document.addEventListener('touchmove', handleWidthMove, { passive: false });
    document.addEventListener('touchend', handleWidthEnd);
  };

  const handleCustomScaleStart = (el: any, startEvent: React.MouseEvent | React.TouchEvent, corner: string) => {
    startEvent.stopPropagation();
    if (!canvasRef.current) return;

    const isTouchEvent = 'touches' in startEvent;
    const startX = isTouchEvent ? startEvent.touches[0].clientX : startEvent.clientX;
    const startY = isTouchEvent ? startEvent.touches[0].clientY : startEvent.clientY;

    const initialScale = el.scale || 1;

    const handleScaleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const isTouchMove = 'touches' in moveEvent;
      const currentX = isTouchMove ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = isTouchMove ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const dx = currentX - startX;
      const dy = currentY - startY;
      
      const factor = 0.009;
      let deltaScale = 0;
      
      if (corner === 'bottom-right') deltaScale = (dx + dy) * factor;
      else if (corner === 'bottom-left') deltaScale = (-dx + dy) * factor;
      else if (corner === 'top-right') deltaScale = (dx - dy) * factor;
      else if (corner === 'top-left') deltaScale = (-dx - dy) * factor;

      const newScale = Math.max(0.3, Math.min(3, initialScale + deltaScale));

      setElements(prev => prev.map(item => 
        item.id === el.id ? { ...item, scale: newScale } : item
      ));
    };

    const handleScaleEnd = () => {
      document.removeEventListener('mousemove', handleScaleMove);
      document.removeEventListener('mouseup', handleScaleEnd);
      document.removeEventListener('touchmove', handleScaleMove);
      document.removeEventListener('touchend', handleScaleEnd);
    };

    document.addEventListener('mousemove', handleScaleMove);
    document.addEventListener('mouseup', handleScaleEnd);
    document.addEventListener('touchmove', handleScaleMove, { passive: false });
    document.addEventListener('touchend', handleScaleEnd);
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
            backgroundColor: backgroundColor,
            accentColor: '#493EE5',
            dimensions: (customWidth && customHeight) ? { width: Number(customWidth), height: Number(customHeight), unit: customUnit } : formats.find(f => f.id === format)?.dimensions,
            elements: elements,
            uploadedDesign: uploadedDesign,
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
    if (step === 4) return format !== null || (!!customWidth && !!customHeight);
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

  // HighFidelityDesign removed in favor of reusable MarketingAssetRenderer

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
                      onClick={() => { setFormat(f.id); setCustomWidth(''); setCustomHeight(''); }}
                      className={`relative flex flex-col bg-surface-container-lowest border rounded-xl p-4 cursor-pointer active:scale-95 transition-all ${isActive ? 'border-2 border-primary bg-surface-container-low' : 'border border-outline-variant hover:shadow-lg'}`}
                    >
                      <div className={`aspect-square ${f.thumb} rounded-lg mb-3 flex items-center justify-center overflow-hidden`}>
                        <div className="bg-white border-2 border-outline-variant rounded shadow-sm" style={{ width: f.dimensions.width > f.dimensions.height ? '70%' : '50%', aspectRatio: `${f.dimensions.width}/${f.dimensions.height}` }} />
                      </div>
                      <h3 className="text-headline-md text-body-lg font-semibold text-on-surface">{f.label}</h3>
                      <p className="text-label-caps text-on-surface-variant mt-1">{f.size}</p>
                      <div className={`absolute top-2 right-2 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}><Check size={18} className="text-primary" /></div>
                    </button>
                  );
                })}
              </div>
              <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-headline-md font-bold">Custom Size</h3>
                  <div className="relative group">
                    <select value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 pr-10 text-label-caps font-bold cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase outline-none">
                      {['px', 'mm', 'cm', 'in'].map((u) => (<option key={u} value={u} className="bg-surface py-2">{u}</option>))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">expand_more</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-label-caps text-on-surface-variant">WIDTH</label><input type="number" value={customWidth} onChange={(e) => { setCustomWidth(e.target.value); setFormat(null); }} className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-xl h-12 px-4" placeholder="0" /></div>
                  <div className="space-y-1.5"><label className="text-label-caps text-on-surface-variant">HEIGHT</label><input type="number" value={customHeight} onChange={(e) => { setCustomHeight(e.target.value); setFormat(null); }} className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-xl h-12 px-4" placeholder="0" /></div>
                </div>
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
                    <button key={g.id} onClick={() => setGoal(g.id)} className={`flex flex-col p-4 bg-surface-container-lowest border rounded-xl text-left shadow-[0_4px_20px_rgba(0,0,0,0.04)] active:scale-95 transition-all cursor-pointer ${isActive ? 'border-2 border-primary bg-primary-container/5' : 'border border-outline-variant hover:border-primary/50'}`}>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${isActive ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}><span className="material-symbols-outlined text-[24px]">{g.icon}</span></div>
                      <span className="text-headline-md text-on-surface mb-1 font-semibold">{g.label}</span>
                      <span className="text-body-sm text-on-surface-variant">{g.desc}</span>
                      {isActive && <div className="mt-2 flex justify-end"><Check size={18} className="text-primary" /></div>}
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
              </div>

              <section className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-2">
                <label className="text-label-caps text-on-surface-variant block">Headline</label>
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full bg-transparent border border-outline-variant focus:border-primary focus:ring-0 rounded-lg h-12 px-4 text-body-lg text-on-surface transition-all" placeholder="e.g. Summer Collection Launch" />
              </section>

              <section className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-2">
                <label className="text-label-caps text-on-surface-variant block">Subheadline</label>
                <textarea value={subheadline} onChange={(e) => setSubheadline(e.target.value)} className="w-full bg-transparent border border-outline-variant focus:border-primary focus:ring-0 rounded-lg p-4 text-body-lg text-on-surface transition-all resize-none" placeholder="Describe your offering in detail..." rows={3} />
              </section>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setShowAiImageModal(true)} className="flex items-center justify-center gap-2 bg-surface-container-high text-primary font-button text-button h-12 rounded-xl hover:bg-surface-container-highest transition-all active:scale-95 cursor-pointer"><Sparkles size={18} />Generate Art</button>
                <button type="button" onClick={handleGenerateAi} className="flex items-center justify-center gap-2 bg-primary/10 text-primary font-button text-button h-12 rounded-xl hover:bg-primary/20 transition-all active:scale-95 cursor-pointer"><Sparkles size={18} />AI Slogan Helper</button>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setUploadedDesign(reader.result as string); reader.readAsDataURL(file); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border-2 border-dashed border-primary/30 h-16 rounded-xl group-hover:bg-primary/20 transition-all"><Download size={18} className="rotate-180" /><span className="font-button text-button">{uploadedDesign ? 'Change Custom Design' : 'Upload Your Own Design'}</span></div>
                </div>

                <div className="relative">
                  <button onClick={() => setIsQrDropdownOpen(!isQrDropdownOpen)} className="w-full h-14 bg-surface border border-outline-variant rounded-xl px-4 flex items-center justify-between hover:border-primary transition-all active:scale-[0.99] group shadow-sm">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><QrIcon size={18} /></div><div className="text-left"><p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider leading-none mb-1">Active Destination</p><p className="text-body-md font-bold text-on-surface truncate max-w-[200px]">{selectedQrId ? qrCodes.find((q: any) => q.id === selectedQrId)?.name : 'Default UBL Profile'}</p></div></div>
                    <ChevronDown size={20} className={`text-on-surface-variant transition-transform duration-300 ${isQrDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isQrDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[45]" onClick={() => setIsQrDropdownOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 w-full mt-2 bg-surface border border-outline-variant rounded-2xl shadow-2xl z-[50] overflow-hidden max-h-[300px] overflow-y-auto">
                          <div className="p-2 space-y-1">
                            <button onClick={() => { setSelectedQrId(null); setIsQrDropdownOpen(false); }} className={`w-full p-4 flex items-center justify-between rounded-xl transition-all ${!selectedQrId ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><QrIcon size={20} /></div><div className="text-left"><p className="font-bold text-body-lg">Default UBL Profile</p><p className="text-[10px] opacity-60">Points to your business home page</p></div></div>{!selectedQrId && <Check size={18} />}</button>
                            {qrCodes.map((qr: any) => (<button key={qr.id} onClick={() => { setSelectedQrId(qr.id); setIsQrDropdownOpen(false); }} className={`w-full p-4 flex items-center justify-between rounded-xl transition-all ${selectedQrId === qr.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><QrIcon size={20} /></div><div className="text-left"><p className="font-bold text-body-lg">{qr.name}</p><p className="text-[10px] opacity-60 truncate max-w-[180px]">{qr.content}</p></div></div>{selectedQrId === qr.id && <Check size={18} />}</button>))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div 
                className="relative overflow-hidden rounded-3xl border border-outline-variant/30 shadow-2xl group/preview mx-auto"
                style={{ 
                  width: '100%', 
                  maxWidth: '340px', 
                }}
              >
                <button onClick={() => setEditingDesign(true)} className="absolute top-6 right-6 z-[30] bg-surface/90 backdrop-blur-md border border-outline-variant text-on-surface px-4 py-2.5 rounded-full font-button text-button shadow-lg hover:bg-surface-container-high transition-all active:scale-95 flex items-center gap-2 group/editbtn"><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center group-hover/editbtn:scale-110 transition-transform"><Sparkles size={16} className="text-white" /></div>Edit Layout</button>
                {uploadedDesign && (
                  <button onClick={() => setUploadedDesign(null)} className="absolute top-6 left-6 z-[30] bg-black/60 hover:bg-rose-600 backdrop-blur-md text-white h-10 px-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all border border-white/20 flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">✕</span>Remove Design</button>
                )}
                
                <MarketingAssetRenderer
                  elements={elements}
                  backgroundColor={backgroundColor}
                  uploadedDesign={uploadedDesign}
                  activeQrUrl={activeQrUrl}
                  previewBusinessLogo={previewBusinessLogo}
                  selectedQrId={selectedQrId}
                  format={format}
                  customWidth={customWidth}
                  customHeight={customHeight}
                  customUnit={customUnit}
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="py-4"><div className="flex items-center gap-2 mb-2"><span className="h-1 w-8 bg-primary rounded-full" /><span className="text-label-caps text-primary uppercase tracking-widest block">Display Strategy</span></div><h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Where will this be displayed?</h2><p className="text-body-lg text-on-surface-variant max-w-md">Choose the output format to optimize your asset for the best physical or digital presence.</p></div>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'table-stand', label: 'Premium Table Stand', desc: 'Perfect for menus and check-ins at tables.', icon: 'desktop_mac' },
                  { id: 'poster', label: 'High-Impact Poster', desc: 'High-visibility wall displays.', icon: 'wallpaper' },
                  { id: 'flyer', label: 'Handheld Flyer', desc: 'Compact handouts for distribution.', icon: 'description' },
                  { id: 'banner', label: 'Storefront Banner', desc: 'Large-scale presence for trade shows.', icon: 'ads_click' },
                  { id: 'window-sticker', label: 'Window Sticker', desc: 'Weather-resistant decals.', icon: 'auto_awesome_motion' },
                  { id: 'social-media', label: 'Social Media Post', desc: 'Digital-first square format.', icon: 'share' },
                ].map((m) => {
                  const isActive = format === m.id;
                  return (
                    <button key={m.id} onClick={() => setFormat(m.id as any)} className={`group relative flex items-center gap-6 p-6 bg-surface border rounded-[24px] cursor-pointer transition-all duration-300 ${isActive ? 'border-primary bg-primary-container/10 ring-2 ring-primary/20' : 'border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-low shadow-sm hover:shadow-md'}`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary'}`}><span className="material-symbols-outlined text-[28px]">{m.icon}</span></div>
                      <div className="flex-1 text-left"><h3 className={`text-headline-md font-bold transition-colors ${isActive ? 'text-primary' : 'text-on-surface'}`}>{m.label}</h3><p className="text-body-md text-on-surface-variant line-clamp-1">{m.desc}</p></div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-primary border-primary' : 'border-outline-variant'}`}>{isActive && <Check size={14} className="text-white" strokeWidth={4} />}</div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
              <div className="relative w-32 h-32 mb-8 flex items-center justify-center"><div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" /><div className="absolute inset-4 border-2 border-primary/20 border-dashed rounded-full animate-spin" style={{ animationDuration: '8s' }} /><div className="z-10 bg-white shadow-lg rounded-xl p-4"><Sparkles size={48} className="text-primary" /></div></div>
              <h1 className="text-headline-lg-mobile text-on-surface mb-4">Preparing Design</h1>
              <p className="text-body-sm text-on-surface-variant text-center mb-8 max-w-[280px]">We are tailoring your marketing assets to match your unique brand identity.</p>
              <div className="w-full max-w-sm space-y-3">
                {[{ label: 'Loading Business Brand', done: progress > 25 }, { label: 'Generating QR Code', done: progress > 50 }, { label: 'Applying Design', done: progress > 75 }, { label: 'Creating Preview', done: progress > 95 }].map((s, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 transition-all duration-500 ${s.done ? 'opacity-100' : 'opacity-40'}`}><div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full flex items-center justify-center ${s.done ? 'bg-primary' : 'bg-surface-container'}`}>{s.done ? <Check size={14} className="text-white" /> : <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />}</div><span className="text-label-caps tracking-wide">{s.label}</span></div></div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <section className="flex flex-col items-center">
                <div ref={previewRef} className={`relative overflow-hidden shadow-2xl transition-all duration-500 rounded-lg`} style={{ width: '100%', maxWidth: '400px' }}>
                  <MarketingAssetRenderer
                    elements={elements}
                    backgroundColor={backgroundColor}
                    uploadedDesign={uploadedDesign}
                    activeQrUrl={activeQrUrl}
                    previewBusinessLogo={previewBusinessLogo}
                    selectedQrId={selectedQrId}
                    format={format}
                    customWidth={customWidth}
                    customHeight={customHeight}
                    customUnit={customUnit}
                  />
                </div>
                <div className="mt-4 text-center"><h2 className="text-headline-lg-mobile text-on-surface mb-1">{headline || 'Your Asset'}</h2><p className="text-body-sm text-on-surface-variant uppercase tracking-widest font-bold">{(customWidth && customHeight) ? `${customWidth} x ${customHeight} ${customUnit}` : formats.find(f => f.id === format)?.size || 'Custom Size'}</p></div>
              </section>
              <section>
                <div className="flex items-center justify-between mb-3"><h3 className="text-headline-md text-on-surface font-semibold">See It In Real Life</h3><Sparkles size={16} className="text-primary" /></div>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">{mockupEnvs.map((env) => (<button key={env} onClick={() => setMockupEnv(env)} className={`px-4 py-2 rounded-xl text-label-caps transition-all cursor-pointer ${mockupEnv === env ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>{env}</button>))}</div>
                <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-sm ${mockupColors[mockupEnv] || 'bg-surface-container-low'} flex items-center justify-center`}>
                  <div className="w-[120px]">
                    <MarketingAssetRenderer
                      elements={elements}
                      backgroundColor={backgroundColor}
                      uploadedDesign={uploadedDesign}
                      activeQrUrl={activeQrUrl}
                      previewBusinessLogo={previewBusinessLogo}
                      selectedQrId={selectedQrId}
                      format={format}
                      customWidth={customWidth}
                      customHeight={customHeight}
                      customUnit={customUnit}
                      isMockup
                    />
                  </div>
                  <div className="absolute top-3 right-3 bg-primary/10 backdrop-blur-md px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary animate-pulse" /><span className="text-[10px] text-label-caps text-primary uppercase block">Live Preview</span></div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-[60]">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-surface/80 backdrop-blur-xl border border-outline-variant/20 p-4 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
          {step === 6 ? (
            <div className="flex items-center gap-3"><button className="flex-1 h-12 border border-primary text-primary font-button text-button rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container/10 active:scale-95 transition-all cursor-pointer"><Bookmark size={18} />Save Asset</button><button onClick={handleDownload} className="flex-[1.5] h-12 bg-primary text-on-primary font-button text-button rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer"><Download size={18} />Download</button></div>
          ) : (
            <button onClick={handleContinue} disabled={!canContinue()} className="w-full h-14 bg-primary text-on-primary font-button text-button rounded-[18px] shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"><span className="text-button">Continue to Next Step</span><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform"><ArrowLeft size={18} className="rotate-180" /></div></button>
          )}
        </motion.div>
      </footer>

      <AnimatePresence>
        {editingDesign && (() => {
          const isAiDesignMode = !!uploadedDesign;
          const selectedElement = elements.find(el => el.id === selectedElementId);
          const canvasAspect = customWidth && customHeight
            ? `${customWidth}/${customHeight}`
            : formats.find(f => f.id === format)?.dimensions
              ? `${formats.find(f => f.id === format)?.dimensions.width}/${formats.find(f => f.id === format)?.dimensions.height}`
              : '4/6';

          return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-hidden"
          >
            {/* Top bar */}
            <div className="shrink-0 flex items-center justify-between px-5 h-14 bg-white border-b border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setEditingDesign(false)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <div>
                  <h2 className="font-extrabold text-gray-900 text-sm">Layout Editor</h2>
                  <p className="text-[10px] text-gray-400 font-medium">Drag elements Â· Click to select Â· Resize with handle</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDesign(false)}
                className="h-9 px-5 bg-primary text-white text-xs font-extrabold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Done
              </button>
            </div>

            {/* Main layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">

              {/* Left panel â€” controls */}
              <div className="lg:col-span-5 bg-white border-r border-gray-100 flex flex-col overflow-y-auto order-2 lg:order-1">
                <div className="p-5 space-y-5">

                  {/* Background */}
                  {!isAiDesignMode && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Background</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">Canvas Color</label>
                          <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">Hex Value</label>
                          <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="#FFFFFF" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['#FFFFFF', '#F8FAFC', '#0F172A', '#1E293B', '#493EE5', '#EF4444', '#10B981', '#F59E0B', '#7C3AED'].map(c => (
                          <button key={c} onClick={() => setBackgroundColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${backgroundColor === c ? 'border-primary scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="h-px bg-gray-100" />
                    </div>
                  )}

                  {/* Add Elements */}
                  {!isAiDesignMode && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Add Elements</h4>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleAddTextElement('YOUR HEADLINE', 18, 'extrabold')} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 active:scale-95 transition-all">
                          <Plus size={12} strokeWidth={3} /> Title Text
                        </button>
                        <button onClick={() => handleAddTextElement('Your supporting copy goes here', 11, 'medium')} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 active:scale-95 transition-all">
                          <Plus size={12} strokeWidth={3} /> Subtitle
                        </button>
                        <button onClick={() => handleAddTextElement('Scan, Tap & Enjoy.', 9, 'semibold')} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 active:scale-95 transition-all">
                          <Plus size={12} strokeWidth={3} /> Tagline
                        </button>
                        <button onClick={handleAddLogoElement} className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 active:scale-95 transition-all">
                          <Plus size={12} strokeWidth={3} /> Logo Slot
                        </button>
                        <button onClick={handleAddQrElement} className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700 hover:bg-green-100 flex items-center gap-1.5 active:scale-95 transition-all">
                          <Plus size={12} strokeWidth={3} /> QR Code
                        </button>
                      </div>
                      <div className="h-px bg-gray-100" />
                    </div>
                  )}

                  {/* Element Properties */}
                  {selectedElement ? (
                    <motion.div
                      key={selectedElement.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 border-2 border-primary/20 bg-primary/5 rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                          Editing: {selectedElement.type.replace('_', ' ')} element
                        </span>
                        <button
                          onClick={() => handleDeleteElement(selectedElement.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-100 text-rose-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Text element controls */}
                      {selectedElement.type === 'text' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500">Text Content</label>
                            <input
                              type="text"
                              value={selectedElement.text || ''}
                              onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, text: e.target.value } : el))}
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-800"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500">Font Size (px)</label>
                              <input type="number" value={selectedElement.fontSize || 14}
                                onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, fontSize: parseInt(e.target.value) || 12 } : el))}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500">Text Color</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={selectedElement.color || '#000000'}
                                  onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, color: e.target.value } : el))}
                                  className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                                <span className="text-[10px] font-mono font-bold text-gray-600 uppercase">{selectedElement.color || '#000000'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500">Font Weight</label>
                              <select value={selectedElement.fontWeight || 'normal'}
                                onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, fontWeight: e.target.value } : el))}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold">
                                <option value="normal">Normal</option>
                                <option value="medium">Medium</option>
                                <option value="semibold">Semi Bold</option>
                                <option value="bold">Bold</option>
                                <option value="extrabold">Extra Bold</option>
                                <option value="900">Black 900</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-500">Alignment</label>
                              <select value={selectedElement.alignment || 'center'}
                                onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, alignment: e.target.value } : el))}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold">
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* QR element controls */}
                      {selectedElement.type === 'qr' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500">QR Size (px)</label>
                          <input type="number" value={selectedElement.size || 120}
                            onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, size: parseInt(e.target.value) || 100 } : el))}
                            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold" />
                        </div>
                      )}

                      {/* Logo element controls */}
                      {selectedElement.type === 'logo' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500">Width (%)</label>
                            <input type="number" value={selectedElement.width || 30}
                              onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, width: parseInt(e.target.value) || 30 } : el))}
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500">Height (%)</label>
                            <input type="number" value={selectedElement.height || 8}
                              onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, height: parseInt(e.target.value) || 8 } : el))}
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold" />
                          </div>
                        </div>
                      )}

                      {/* Position sliders */}
                      <div className="grid grid-cols-2 gap-3 border-t border-primary/10 pt-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 flex justify-between">
                            <span>X (%)</span><span className="text-primary font-mono">{selectedElement.x}%</span>
                          </label>
                          <input type="range" min="0" max="95" value={selectedElement.x}
                            onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, x: parseInt(e.target.value) } : el))}
                            className="w-full accent-primary cursor-ew-resize" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 flex justify-between">
                            <span>Y (%)</span><span className="text-primary font-mono">{selectedElement.y}%</span>
                          </label>
                          <input type="range" min="0" max="95" value={selectedElement.y}
                            onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, y: parseInt(e.target.value) } : el))}
                            className="w-full accent-primary cursor-ew-resize" />
                        </div>
                      </div>

                      {/* Nudge controls */}
                      <div className="space-y-1 border-t border-primary/10 pt-3">
                        <label className="text-[10px] font-extrabold text-gray-400 block text-center uppercase tracking-wider">Nudge Position</label>
                        <div className="flex flex-col items-center gap-1">
                          <button onClick={() => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, y: Math.max(0, el.y - 1) } : el))}
                            className="w-9 h-9 bg-primary/10 hover:bg-primary hover:text-white text-primary font-extrabold flex items-center justify-center rounded-xl text-xs border border-primary/20 active:scale-95 transition-all">â–²</button>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, x: Math.max(0, el.x - 1) } : el))}
                              className="w-9 h-9 bg-primary/10 hover:bg-primary hover:text-white text-primary font-extrabold flex items-center justify-center rounded-xl text-xs border border-primary/20 active:scale-95 transition-all">â—€</button>
                            <span className="text-[10px] font-black text-gray-500 font-mono px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg select-none">X:{selectedElement.x} Y:{selectedElement.y}</span>
                            <button onClick={() => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, x: Math.min(95, el.x + 1) } : el))}
                              className="w-9 h-9 bg-primary/10 hover:bg-primary hover:text-white text-primary font-extrabold flex items-center justify-center rounded-xl text-xs border border-primary/20 active:scale-95 transition-all">â–¶</button>
                          </div>
                          <button onClick={() => setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, y: Math.min(95, el.y + 1) } : el))}
                            className="w-9 h-9 bg-primary/10 hover:bg-primary hover:text-white text-primary font-extrabold flex items-center justify-center rounded-xl text-xs border border-primary/20 active:scale-95 transition-all">â–¼</button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
                      <p className="text-xs text-slate-400 font-medium">Click any element on the canvas to edit its properties.</p>
                    </div>
                  )}

                </div>
              </div>

              {/* Right panel â€” live canvas */}
              <div className="lg:col-span-7 bg-slate-100 border-slate-200 flex flex-col items-center justify-center p-6 order-1 lg:order-2 min-h-[400px] lg:min-h-0">
                <div className="text-[10px] font-extrabold text-slate-400 mb-3 tracking-wider uppercase">Live Draggable Canvas</div>
                <div
                  ref={canvasRef}
                  className="relative overflow-hidden shadow-2xl border-[6px] border-white/10 rounded-[24px]"
                  style={{
                    width: '280px',
                    aspectRatio: canvasAspect,
                    backgroundColor: uploadedDesign ? 'transparent' : backgroundColor,
                    maxHeight: 'calc(100vh - 180px)',
                  }}
                >
                  {uploadedDesign && (
                    <img src={uploadedDesign} alt="Background" className="w-full h-full object-cover absolute inset-0 z-0 pointer-events-none select-none" />
                  )}

                  {/* Canvas elements */}
                  {elements
                    .filter(el => !isAiDesignMode || el.type === 'qr')
                    .map(el => {
                    if (el.type === 'logo') {
                      return (
                        <div
                          key={el.id}
                          onMouseDown={(e) => { setSelectedElementId(el.id); handleCustomDragStart(el, e); }}
                          onTouchStart={(e) => { setSelectedElementId(el.id); handleCustomDragStart(el, e); }}
                          style={{
                            position: 'absolute',
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            width: `${el.width || 30}%`,
                            height: `${el.height || 8}%`,
                            border: selectedElementId === el.id ? '2px dashed #493EE5' : '1px dashed rgba(255,255,255,0.3)',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            cursor: 'move',
                            zIndex: 30,
                          }}
                          className="rounded-lg flex items-center justify-center gap-1 text-[8px] uppercase tracking-wider font-extrabold text-white select-none"
                        >
                          {previewBusinessLogo ? (
                            <img src={previewBusinessLogo} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <span className="opacity-60">Brand Logo</span>
                          )}
                          {selectedElementId === el.id && (
                            <div
                              onMouseDown={(e) => handleResizeStart(el, e)}
                              onTouchStart={(e) => handleResizeStart(el, e)}
                              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary border border-white rounded-full cursor-se-resize z-50 shadow-md"
                            />
                          )}
                        </div>
                      );
                    }

                    if (el.type === 'qr') {
                      return (
                        <div
                          key={el.id}
                          onMouseDown={(e) => { setSelectedElementId(el.id); handleCustomDragStart(el, e); }}
                          onTouchStart={(e) => { setSelectedElementId(el.id); handleCustomDragStart(el, e); }}
                          style={{
                            position: 'absolute',
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            border: selectedElementId === el.id ? '2px dashed #493EE5' : '2px solid rgba(255,255,255,0.15)',
                            backgroundColor: '#FFFFFF',
                            padding: '8px',
                            cursor: 'move',
                            zIndex: 20,
                          }}
                          className="rounded-[14px] shadow-lg flex items-center justify-center relative select-none"
                        >
                          <QRCodeSVG value={activeQrUrl} size={el.size || 120} level="H" includeMargin={false}
                            imageSettings={!selectedQrId && previewBusinessLogo ? { src: previewBusinessLogo, height: 20, width: 20, excavate: true, crossOrigin: 'anonymous' } : undefined}
                          />
                          {selectedElementId === el.id && (
                            <div
                              onMouseDown={(e) => handleResizeStart(el, e)}
                              onTouchStart={(e) => handleResizeStart(el, e)}
                              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary border border-white rounded-full cursor-se-resize z-50 shadow-md"
                            />
                          )}
                        </div>
                      );
                    }

                    // Text element
                    return (
                      <div
                        key={el.id}
                        onMouseDown={(e) => { setSelectedElementId(el.id); handleCustomDragStart(el, e); }}
                        onTouchStart={(e) => { setSelectedElementId(el.id); handleCustomDragStart(el, e); }}
                        style={{
                          position: 'absolute',
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          width: el.width ? `${el.width}%` : 'auto',
                          maxWidth: '90%',
                          color: el.color || '#0F172A',
                          fontSize: `${el.fontSize || 14}px`,
                          fontWeight: el.fontWeight || 'normal',
                          textAlign: (el.alignment || 'center') as any,
                          border: selectedElementId === el.id ? '2px dashed #493EE5' : '1px dashed transparent',
                          padding: '2px',
                          cursor: 'move',
                          zIndex: 10,
                        }}
                        className="select-none leading-tight relative"
                      >
                        {el.text}
                        {selectedElementId === el.id && (
                          <div
                            onMouseDown={(e) => handleResizeStart(el, e)}
                            onTouchStart={(e) => handleResizeStart(el, e)}
                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary border border-white rounded-full cursor-se-resize z-50 shadow-md"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-4 text-center max-w-xs leading-normal">
                  ðŸ’¡ Click an element to select it Â· Drag to reposition Â· Drag the blue dot to resize
                </p>
              </div>
            </div>
          </motion.div>
          );
        })()}
      </AnimatePresence>


      <AnimatePresence>
        {showAiImageModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-on-surface/40 z-[80] backdrop-blur-sm" onClick={() => !isGeneratingImage && setShowAiImageModal(false)} />
            <motion.div initial={{ opacity: 0, y: 100, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.95 }} className="fixed bottom-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-2xl bg-surface rounded-t-[32px] md:rounded-[32px] z-[90] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto my-4 shrink-0 md:hidden" />
              <div className="px-6 py-6 md:py-8 space-y-6 overflow-y-auto">
                <header className="text-center relative">{!isGeneratingImage && (<button onClick={() => setShowAiImageModal(false)} className="absolute right-0 top-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[20px]">close</span></button>)}<div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4"><Sparkles size={24} /></div><h3 className="text-headline-md text-on-surface">Generate Custom Design</h3></header>
                {!generatedImageUrl ? (
                  <div className="space-y-6">
                    <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} disabled={isGeneratingImage} placeholder="Describe your vision..." className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-2xl p-4 text-body-lg min-h-[120px] outline-none" />
                    <button onClick={handleGenerateAiImage} disabled={isGeneratingImage || !aiPrompt.trim()} className="w-full h-14 bg-primary text-on-primary font-button text-button rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">{isGeneratingImage ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={20} />}<span>{isGeneratingImage ? 'Generating Art...' : 'Generate Design'}</span></button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative aspect-[9/16] max-h-[400px] mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-white"><img src={generatedImageUrl} alt="Generated" className="w-full h-full object-cover" /></div>
                    <div className="grid grid-cols-2 gap-4"><button onClick={() => setGeneratedImageUrl(null)} className="h-14 border border-outline-variant text-on-surface font-button rounded-2xl">Retry</button><button onClick={handleUseGeneratedImage} className="h-14 bg-primary text-on-primary font-button rounded-2xl">Use This</button></div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAiSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-on-surface/40 z-[80] backdrop-blur-sm" onClick={() => !generateAIContentMutation.isPending && setShowAiSheet(false)} />
            <motion.div initial={{ opacity: 0, y: 100, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.95 }} className="fixed bottom-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-lg bg-surface rounded-t-[32px] md:rounded-[32px] z-[90] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto my-4 shrink-0 md:hidden" />
              <div className="px-6 py-6 md:py-8 space-y-6 overflow-y-auto">
                <header className="text-center relative">
                  {!generateAIContentMutation.isPending && (
                    <button onClick={() => setShowAiSheet(false)} className="absolute right-0 top-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[20px]">close</span></button>
                  )}
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4"><Sparkles size={24} /></div>
                  <h3 className="text-headline-md text-on-surface">AI Copywriter Helper</h3>
                  <p className="text-body-sm text-on-surface-variant">Generate high-converting taglines using Gemini AI</p>
                </header>
                
                <div className="space-y-4">
                  {generateAIContentMutation.isPending ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <p className="text-body-md text-on-surface-variant font-medium">Gemini is writing copy...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiHeadline ? (
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                          <p className="text-[10px] font-bold text-primary uppercase">Suggested Slogan</p>
                          <p className="text-body-lg text-on-surface font-semibold leading-snug">"{aiHeadline}"</p>
                        </div>
                      ) : (
                        <p className="text-body-md text-on-surface-variant text-center">Click below to generate an optimized headline based on your business niche and goal.</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button type="button" onClick={() => setShowAiSheet(false)} className="h-12 border border-outline-variant text-on-surface font-button rounded-xl hover:bg-surface-container-low transition-colors">Cancel</button>
                        {aiHeadline ? (
                          <button type="button" onClick={applyAiContent} className="h-12 bg-primary text-on-primary font-button rounded-xl hover:opacity-95 transition-all shadow-md">Apply Copy</button>
                        ) : (
                          <button type="button" onClick={handleGenerateAi} className="h-12 bg-primary text-on-primary font-button rounded-xl hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"><Sparkles size={16} /> Generate Slogan</button>
                        )}
                      </div>
                      
                      {aiHeadline && (
                        <button type="button" onClick={handleGenerateAi} className="w-full h-10 text-primary hover:underline font-bold text-xs flex items-center justify-center gap-1.5"><Sparkles size={12} /> Try Another Suggestion</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Hidden container for high-fidelity export */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', pointerEvents: 'none', zIndex: -1000 }}>
        <div ref={downloadRef}>
          <MarketingAssetRenderer
            elements={elements}
            backgroundColor={backgroundColor}
            uploadedDesign={uploadedDesign}
            activeQrUrl={activeQrUrl}
            previewBusinessLogo={previewBusinessLogo}
            selectedQrId={selectedQrId}
            format={format}
            customWidth={customWidth}
            customHeight={customHeight}
            customUnit={customUnit}
            width={1200}
          />
        </div>
      </div>
    </div>
  );
}
