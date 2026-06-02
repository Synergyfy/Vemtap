"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Palette, 
  Type, 
  Download, 
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { 
  useMarketingTemplate, 
  useMarketingAsset,
  useCreateMarketingAsset, 
  useUpdateMarketingAsset,
  useBrandProfile,
  useRecordDownload,
  useTemplateStyles,
  useTemplateFormats,
} from '@/services/marketing-assets/hooks';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import { useQuery } from '@tanstack/react-query';
import { useMyBusiness } from '@/services/businesses/hooks';
import { fetchDevices } from '@/lib/api/devices';

export default function DesignWorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const assetId = searchParams.get('id');

  const { data: template, isLoading: templateLoading } = useMarketingTemplate(templateId || '');
  const { data: asset, isLoading: assetLoading } = useMarketingAsset(assetId || '', !!assetId);
  const { data: brandProfile } = useBrandProfile();
  const { data: templateStyles } = useTemplateStyles();
  const { data: templateFormats } = useTemplateFormats();
  
  const createAssetMutation = useCreateMarketingAsset();
  const updateAssetMutation = useUpdateMarketingAsset();
  const recordDownloadMutation = useRecordDownload();

  const { user } = useAuthStore();
  const { activeBranchId, setActiveBranch } = useActiveBranch();
  const { data: business } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  
  const resolvedBranchId = activeBranchId || undefined;
  
  const { data: devices = [] } = useQuery<any[]>({
    queryKey: ['devices', user?.businessId, resolvedBranchId, false],
    queryFn: () => fetchDevices(resolvedBranchId || undefined, false)
  });

  const [origin, setOrigin] = useState('https://vemtap.com');
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const currentBranch = branches.find((b: any) => b.id === activeBranchId) || branches.find((b: any) => b.isMainBranch);
  const mainDevice = devices.find((d: any) => d.isMain) || devices?.[0];

  const computedQrUrl = mainDevice
    ? `${origin}/tap/${mainDevice.code}`
    : `${origin}/s/${currentBranch?.uniqueCode || 'setup-pending'}`;

  // Reference for capturing screenshot / PDF
  const canvasRef = useRef<HTMLDivElement>(null);

  // Lock to initialize values exactly once when the async data loads
  const hasInitialized = useRef(false);

  // Studio customization states
  const [assetName, setAssetName] = useState('New Marketing Asset');
  const [activeControlTab, setActiveControlTab] = useState<'style' | 'content'>('style');
  const [mobileViewTab, setMobileViewTab] = useState<'editor' | 'preview'>('editor');
  
  const [bgColor, setBgColor] = useState('#0F172A');
  const [bgImage, setBgImage] = useState('');
  const [accentColor, setAccentColor] = useState('#2563EB');
  const [borderColor, setBorderColor] = useState('#1E293B');

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const toastId = toast.loading('Uploading backdrop image to Cloudinary...');
    setIsUploading(true);
    try {
      const { uploadToCloudinary } = await import('@/lib/cloudinary');
      const uploadedUrl = await uploadToCloudinary(file);
      setBgImage(uploadedUrl);
      toast.success('Backdrop uploaded successfully!', { id: toastId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Dynamic canvas elements array!
  const [elements, setElements] = useState<any[]>([]);
  
  const [qrUrl, setQrUrl] = useState('https://vemtap.com/r/table-stand');
  const [qrFgColor, setQrFgColor] = useState('#FFFFFF');
  const [qrBgColor, setQrBgColor] = useState('#0F172A');
  const [showLogoInQr, setShowLogoInQr] = useState(true);



  // Formats derived from API (PRD §52)
  const FORMATS = (templateFormats || []).map((f) => ({
    id: f.slug,
    label: `${f.name} (${f.widthMm}x${f.heightMm}mm)`,
    aspect: `aspect-[${f.widthMm}/${f.heightMm}]`,
    styleAspect: `${f.widthMm}/${f.heightMm}`,
    ratio: f.widthMm / f.heightMm,
    bleedMm: f.bleedMm,
  }));

  const [selectedFormat, setSelectedFormat] = useState('table_tent');

  // Styles derived from API (PRD §51)
  const STYLE_PRESETS = (templateStyles || []).map((s) => ({
    id: s.slug,
    label: s.name,
    bgColor: s.bgColor,
    accentColor: s.accentColor,
    borderColor: s.borderColor,
    qrFgColor: s.qrFgColor,
    qrBgColor: s.qrBgColor,
    textColor: s.textColor,
    desc: s.description || '',
  }));

  const applyStylePreset = (preset: typeof STYLE_PRESETS[0]) => {
    setBgColor(preset.bgColor);
    setAccentColor(preset.accentColor);
    setBorderColor(preset.borderColor);
    setQrFgColor(preset.qrFgColor);
    setQrBgColor(preset.qrBgColor);
    
    // Update elements color if they are text
    setElements((prev) => prev.map((el) => {
      if (el.type === 'text') {
        return { ...el, color: preset.textColor };
      }
      return el;
    }));
    toast.success(`Theme updated to ${preset.label}!`);
  };

  // QR destination selection configuration (PRD §16)
  const DESTINATIONS = [
    { id: 'connect', label: 'Branch Check-in (Default)', path: (branch: any, device: any) => device ? `/tap/${device.code}` : `/s/${branch?.uniqueCode || 'setup-pending'}` },
    { id: 'menu', label: 'Digital Menu', path: (branch: any) => `/m/${branch?.uniqueCode || 'menu'}` },
    { id: 'order', label: 'Order & Pay', path: (branch: any) => `/o/${branch?.uniqueCode || 'order'}` },
    { id: 'feedback', label: 'Feedback & Reviews Form', path: (branch: any) => `/f/${branch?.uniqueCode || 'feedback'}` },
    { id: 'loyalty', label: 'Loyalty Rewards Program', path: (branch: any) => `/l/${branch?.uniqueCode || 'loyalty'}` },
    { id: 'custom', label: 'Custom URL...', path: () => '' }
  ];

  const [qrDestination, setQrDestination] = useState('connect');

  // Legacy-to-elements transformer for robust compatibility
  const transformToDynamicElements = (layoutConfig: any) => {
    if (layoutConfig?.elements) {
      return {
        elements: layoutConfig.elements,
        backgroundColor: layoutConfig.backgroundColor || '#0F172A',
        backgroundImage: layoutConfig.backgroundImage || '',
        accentColor: layoutConfig.accentColor || '#2563EB',
        borderColor: layoutConfig.borderColor || '#1E293B',
      };
    }

    const legacyBgColor = layoutConfig?.backgroundColor || '#0F172A';
    const legacyTextColor = layoutConfig?.textColor || '#FFFFFF';
    const legacyAccentColor = layoutConfig?.accentColor || '#2563EB';
    const titleText = layoutConfig?.title || 'Scan to Connect';
    const subtitleText = layoutConfig?.subtitle || 'Enjoy contactless services';
    const taglineText = layoutConfig?.tagline || 'Scan, tap & check-in.';
    const logoPos = layoutConfig?.logoPosition || 'top';

    const legacyElements: any[] = [];

    // Logo slot
    if (logoPos === 'top') {
      legacyElements.push({ id: 'logo-slot', type: 'logo', x: 35, y: 8, width: 30, height: 8 });
    } else if (logoPos === 'bottom') {
      legacyElements.push({ id: 'logo-slot', type: 'logo', x: 35, y: 84, width: 30, height: 8 });
    }

    // Headline
    legacyElements.push({
      id: 'headline-text',
      type: 'text',
      text: titleText,
      x: 10,
      y: 24,
      fontSize: 18,
      color: legacyTextColor,
      fontWeight: 'extrabold',
      alignment: 'center'
    });

    // Subtitle
    legacyElements.push({
      id: 'subtitle-text',
      type: 'text',
      text: subtitleText,
      x: 10,
      y: 38,
      fontSize: 12,
      color: legacyTextColor,
      fontWeight: 'medium',
      alignment: 'center'
    });

    // QR code
    legacyElements.push({
      id: 'qr-code-slot',
      type: 'qr_code',
      x: 30,
      y: 50,
      size: 110
    });

    // Tagline
    legacyElements.push({
      id: 'tagline-text',
      type: 'text',
      text: taglineText,
      x: 10,
      y: 78,
      fontSize: 9,
      color: legacyTextColor,
      fontWeight: 'semibold',
      alignment: 'center'
    });

    return {
      elements: legacyElements,
      backgroundColor: legacyBgColor,
      backgroundImage: layoutConfig?.backgroundImage || '',
      accentColor: legacyAccentColor,
      borderColor: layoutConfig?.borderColor || '#1E293B',
    };
  };

  // Synchronise settings on load
  useEffect(() => {
    if (hasInitialized.current) return;

    if (assetId && asset) {
      setAssetName(asset.name);
      
      const config = asset.customConfig || {};
      const transformed = transformToDynamicElements(config);

      setBgColor(transformed.backgroundColor);
      setBgImage(transformed.backgroundImage);
      setAccentColor(transformed.accentColor);
      setBorderColor(transformed.borderColor);
      setElements(transformed.elements);
      setSelectedFormat(asset.type || 'table_tent');

      setQrUrl(asset.qrCodeContent || computedQrUrl);
      setQrFgColor(asset.qrCodeConfig?.color || '#FFFFFF');
      setQrBgColor(asset.qrCodeConfig?.backgroundColor || '#0F172A');
      setShowLogoInQr(asset.qrCodeConfig?.showLogo !== false);
      hasInitialized.current = true;
    } else if (!assetId && template) {
      setAssetName(`My ${template.name}`);
      
      const config = template.layoutConfig || {};
      const transformed = transformToDynamicElements(config);

      setBgColor(transformed.backgroundColor);
      setBgImage(transformed.backgroundImage);
      setAccentColor(transformed.accentColor);
      setBorderColor(transformed.borderColor);
      setElements(transformed.elements);
      setSelectedFormat(template.type || 'table_tent');

      setQrUrl(computedQrUrl);
      setQrFgColor(template.qrCodeConfig?.color || '#FFFFFF');
      setQrBgColor(template.qrCodeConfig?.backgroundColor || '#0F172A');
      hasInitialized.current = true;
    } else if (!assetId && !template && brandProfile) {
      setBgColor(brandProfile.secondaryColor || '#1E293B');
      setAccentColor(brandProfile.primaryColor || '#2563EB');
      setQrFgColor(brandProfile.secondaryColor || '#1E293B');
    }
  }, [asset, template, brandProfile, assetId, computedQrUrl]);

  // Synchronise dynamic QR Code URL from branches / devices data when it resolves
  useEffect(() => {
    if (computedQrUrl && computedQrUrl !== `${origin}/s/setup-pending`) {
      if (!assetId) {
        setQrUrl(computedQrUrl);
      } else if (asset && !asset.qrCodeContent) {
        setQrUrl(computedQrUrl);
      }
    }
  }, [computedQrUrl, assetId, asset, origin]);

  // Synchronise dynamic QR Code URL from destinations, branches, or devices
  useEffect(() => {
    if (qrDestination === 'custom') return;
    const dest = DESTINATIONS.find(d => d.id === qrDestination);
    if (dest) {
      const path = dest.path(currentBranch, mainDevice);
      setQrUrl(`${origin}${path}`);
    }
  }, [qrDestination, currentBranch, mainDevice, origin]);

  // Safeguard against loading templates outside business category (PRD §7.0)
  useEffect(() => {
    if (business && template) {
      const bizCatName = typeof (business as any).category === 'object' ? (business as any).category.name : business.category;
      if (bizCatName && template.category) {
        const catMatch = bizCatName.toLowerCase().includes(template.category.toLowerCase()) || 
                         template.category.toLowerCase().includes(bizCatName.toLowerCase()) ||
                         template.category.toLowerCase() === 'general';
        
        if (!catMatch) {
          toast.error(`Access Restricted: This template is categorized under ${template.category} and is not available for your industry.`);
          router.push('/dashboard/marketing-assets/templates');
        }
      }
    }
  }, [business, template, router]);

  // Auto-export parameter handling on load (format: png, pdf, transparent_png, print_pdf)
  useEffect(() => {
    const exportParam = searchParams.get('export');
    const validFormats = ['png', 'print_pdf'] as const;
    const exportFormat = validFormats.find(f => f === exportParam);
    if (exportFormat && !assetLoading && !templateLoading && hasInitialized.current && canvasRef.current) {
      const timer = setTimeout(() => {
        handleDownload(exportFormat);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, assetLoading, templateLoading]);

  const handleSaveAsset = async () => {
    try {
      const payload = {
        name: assetName,
        templateId: templateId || undefined,
        type: selectedFormat,
        qrCodeContent: qrUrl,
        customConfig: {
          backgroundColor: bgColor,
          backgroundImage: bgImage,
          accentColor,
          borderColor,
          elements
        },
        qrCodeConfig: {
          color: qrFgColor,
          backgroundColor: qrBgColor,
          showLogo: showLogoInQr
        }
      };

      const saveToast = toast.loading(assetId ? 'Saving design changes...' : 'Creating new design...');
      if (assetId) {
        await updateAssetMutation.mutateAsync({ id: assetId, updates: payload });
        toast.success('Creative asset updated successfully!', { id: saveToast });
      } else {
        await createAssetMutation.mutateAsync(payload);
        toast.success('Creative asset saved to library successfully!', { id: saveToast });
      }
      router.push('/dashboard/marketing-assets/library');
    } catch (e) {
      toast.error('Failed to save layout config');
    }
  };

  const handleDownload = async (format: 'png' | 'print_pdf') => {
    const el = canvasRef.current;
    if (!el) {
      toast.error('Canvas not found — make sure the preview is visible');
      return;
    }
    const loadingToast = toast.loading(`Generating ${format.toUpperCase().replace('_', ' ')}...`);

    // html2canvas v1.4.1 doesn't support modern CSS color functions (oklab, oklch).
    // We clone the element, strip all classes, and apply computed styles as inline
    // hex/RGB values so the capture works.
    const captureContainer = document.createElement('div');
    captureContainer.style.position = 'absolute';
    captureContainer.style.left = '-9999px';
    captureContainer.style.top = '0';
    captureContainer.style.width = `${el.offsetWidth}px`;
    captureContainer.style.height = `${el.offsetHeight}px`;
    captureContainer.style.pointerEvents = 'none';

    const clone = el.cloneNode(true) as HTMLElement;
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode as HTMLElement;
      const computed = window.getComputedStyle(node);
      node.removeAttribute('class');
      node.style.cssText = '';
      node.style.color = computed.color;
      node.style.backgroundColor = computed.backgroundColor;
      node.style.backgroundImage = computed.backgroundImage;
      node.style.backgroundSize = computed.backgroundSize;
      node.style.backgroundPosition = computed.backgroundPosition;
      node.style.fontSize = computed.fontSize;
      node.style.fontWeight = computed.fontWeight;
      node.style.textAlign = computed.textAlign;
      node.style.display = computed.display;
      node.style.position = computed.position;
      node.style.width = computed.width;
      node.style.height = computed.height;
      node.style.top = computed.top;
      node.style.left = computed.left;
      node.style.right = computed.right;
      node.style.bottom = computed.bottom;
      node.style.zIndex = computed.zIndex;
      node.style.overflow = computed.overflow;
      node.style.border = computed.border;
      node.style.borderRadius = computed.borderRadius;
      node.style.padding = computed.padding;
      node.style.margin = computed.margin;
      node.style.transform = computed.transform;
      node.style.opacity = computed.opacity;
      node.style.aspectRatio = computed.aspectRatio;
      node.style.maxWidth = computed.maxWidth;
      node.style.lineHeight = computed.lineHeight;
      node.style.letterSpacing = computed.letterSpacing;
      node.style.textTransform = computed.textTransform;
      node.style.textDecoration = computed.textDecoration;
      node.style.boxShadow = computed.boxShadow;
      node.style.borderColor = computed.borderColor;
      node.style.borderWidth = computed.borderWidth;
      node.style.borderStyle = computed.borderStyle;
    }

    captureContainer.appendChild(clone);
    document.body.appendChild(captureContainer);

    try {
      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: bgColor
      } as any);

      if (format === 'png') {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${assetName.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const imgData = canvas.toDataURL('image/png');
        const currentFormat = FORMATS.find(f => f.id === selectedFormat);
        const ratio = currentFormat?.ratio || 4 / 6;

        const pdf = new jsPDF({
          orientation: ratio > 1 ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        const bleed = currentFormat?.bleedMm ?? 3;
        pdf.setLineWidth(0.1);
        pdf.setDrawColor(120, 120, 120);
        pdf.line(bleed, 0, bleed, bleed * 2);
        pdf.line(0, bleed, bleed * 2, bleed);
        pdf.line(imgWidth - bleed, 0, imgWidth - bleed, bleed * 2);
        pdf.line(imgWidth, bleed, imgWidth - bleed * 2, bleed);
        pdf.line(bleed, pageHeight, bleed, pageHeight - bleed * 2);
        pdf.line(0, pageHeight - bleed, bleed * 2, pageHeight - bleed);
        pdf.line(imgWidth - bleed, pageHeight, imgWidth - bleed, pageHeight - bleed * 2);
        pdf.line(imgWidth, pageHeight - bleed, imgWidth - bleed * 2, pageHeight - bleed);

        pdf.save(`${assetName.toLowerCase().replace(/\s+/g, '-')}-print-ready.pdf`);
      }

      const resolvedAssetId = assetId || createAssetMutation.data?.id;
      if (resolvedAssetId) {
        await recordDownloadMutation.mutateAsync({
          assetId: resolvedAssetId,
          format: format === 'png' ? 'png' : 'pdf'
        });
      }

      toast.success('File downloaded successfully!', { id: loadingToast });
    } catch (e) {
      console.error('Download error:', e);
      toast.error('Failed to render file. Check console for details.', { id: loadingToast });
    } finally {
      document.body.removeChild(captureContainer);
    }
  };

  return (
    <div className="space-y-6">
      {/* Design Workspace Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketing-assets/templates">
            <Button variant="ghost" className="size-10 p-0 rounded-xl hover:bg-gray-100">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div className="space-y-1">
            <input 
              type="text" 
              value={assetName} 
              onChange={(e) => setAssetName(e.target.value)}
              className="font-extrabold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none text-base md:text-lg max-w-xs md:max-w-md py-0 px-1"
            />
            <p className="text-xs text-gray-400 font-medium ml-1">
              Customizing: {template?.name || 'Blank Canvas'} ({template?.type?.replace('_', ' ') || 'Table Stand'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={handleSaveAsset} 
            disabled={createAssetMutation.isPending}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2 px-5"
          >
            <Save size={16} />
            {createAssetMutation.isPending ? 'Saving...' : 'Save to Library'}
          </Button>
        </div>
      </div>



      {/* Mobile Studio Tabs View Selector */}
      <div className="grid grid-cols-2 gap-1 bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm lg:hidden">
        <button
          onClick={() => setMobileViewTab('editor')}
          className={`py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            mobileViewTab === 'editor'
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          🎨 Customize Layout
        </button>
        <button
          onClick={() => setMobileViewTab('preview')}
          className={`py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            mobileViewTab === 'preview'
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          👁️ Preview & Mockups
        </button>
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Toolbox Controls (4 cols) */}
        <div className={`lg:col-span-5 bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-sm space-y-6 flex-col justify-between ${mobileViewTab === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="space-y-6">
            {/* Control Panel Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setActiveControlTab('style')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeControlTab === 'style'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Palette size={14} className="shrink-0" />
                <span className="hidden sm:inline">Style Override</span>
                <span className="sm:hidden">Style</span>
              </button>
              <button
                onClick={() => setActiveControlTab('content')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeControlTab === 'content'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Type size={14} className="shrink-0" />
                <span className="hidden sm:inline">Typography</span>
                <span className="sm:hidden">Text</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-5 min-h-[300px]">
              
              {/* Tab 1: Style Overrides */}
              {activeControlTab === 'style' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="space-y-4"
                >
                  <div className="space-y-1.5 border-b border-gray-50 pb-4 mb-4">
                    <label className="text-xs font-bold text-gray-500 block">Output Print Format</label>
                    <select
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white font-semibold text-gray-800 cursor-pointer"
                    >
                      {FORMATS.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-gray-400 font-medium block">
                      Choose standard size for table signs, acrylic stands, window stickers, posters or flyers. Aspect ratio adjusts instantly.
                    </span>
                  </div>

                  <div className="space-y-1.5 border-b border-gray-50 pb-4 mb-4">
                    <label className="text-xs font-bold text-gray-500 block">Design Style Presets (PRD §17)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {STYLE_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyStylePreset(p)}
                          className="px-2 py-2 rounded-xl text-left border border-gray-100 hover:border-primary/30 bg-gray-50 hover:bg-white text-[11px] font-extrabold flex flex-col justify-between h-14 transition-all shadow-sm"
                        >
                          <span className="text-gray-800 font-extrabold leading-none">{p.label}</span>
                          <div className="flex gap-1">
                            <span className="size-2 rounded-full inline-block" style={{ backgroundColor: p.bgColor, border: '1px solid #e2e8f0' }} />
                            <span className="size-2 rounded-full inline-block" style={{ backgroundColor: p.accentColor }} />
                            <span className="size-2 rounded-full inline-block" style={{ backgroundColor: p.textColor }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 block">Graphic Background Design</label>
                      
                      {/* PC Image Selector / Uploader */}
                      <div className="relative group cursor-pointer border-2 border-dashed border-gray-200 hover:border-primary/50 bg-gray-50 hover:bg-primary/5 rounded-2xl p-4 text-center transition-all duration-200">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <div className="flex flex-col items-center justify-center gap-1">
                          {isUploading ? (
                            <>
                              <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-extrabold text-primary animate-pulse mt-1">Uploading backdrop image...</span>
                            </>
                          ) : bgImage ? (
                            <>
                              <span className="text-[20px]">🖼️</span>
                              <span className="text-xs font-extrabold text-green-600">Backdrop Image Loaded</span>
                              <span className="text-[10px] text-gray-400 truncate max-w-xs block font-medium">{bgImage}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[20px] transition-transform group-hover:scale-110 duration-200">📁</span>
                              <span className="text-xs font-extrabold text-gray-700">Select Image from PC</span>
                              <span className="text-[10px] text-gray-400 font-medium">Supports PNG, JPG (Max 5MB)</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center justify-center gap-2 py-1">
                        <div className="h-[1px] bg-gray-100 flex-1" />
                        <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Or Paste Image URL</span>
                        <div className="h-[1px] bg-gray-100 flex-1" />
                      </div>

                      {/* URL input */}
                      <input 
                        type="text" 
                        value={bgImage} 
                        onChange={(e) => setBgImage(e.target.value)}
                        placeholder="Paste image URL here..."
                        className="w-full px-4 py-2.5 text-xs border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-gray-700 font-mono text-[11px]"
                      />
                      
                      <span className="text-[10px] text-gray-400 font-medium block">
                        Tweak the template background design URL if you want a custom branding background.
                      </span>
                    </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Canvas Color</label>
                      <div className="flex items-center gap-2 border border-gray-100 rounded-xl p-2 bg-gray-50">
                        <input 
                          type="color" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)} 
                          className="size-7 rounded-lg border-0 cursor-pointer overflow-hidden"
                        />
                        <span className="text-xs font-mono font-bold uppercase text-gray-700">{bgColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Accent Stripe</label>
                      <div className="flex items-center gap-2 border border-gray-100 rounded-xl p-2 bg-gray-50">
                        <input 
                          type="color" 
                          value={accentColor} 
                          onChange={(e) => setAccentColor(e.target.value)} 
                          className="size-7 rounded-lg border-0 cursor-pointer overflow-hidden"
                        />
                        <span className="text-xs font-mono font-bold uppercase text-gray-700">{accentColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">QR Code Color</label>
                      <div className="flex items-center gap-2 border border-gray-100 rounded-xl p-2 bg-gray-50">
                        <input 
                          type="color" 
                          value={qrFgColor} 
                          onChange={(e) => setQrFgColor(e.target.value)} 
                          className="size-7 rounded-lg border-0 cursor-pointer overflow-hidden"
                        />
                        <span className="text-xs font-mono font-bold uppercase text-gray-700">{qrFgColor}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">QR Code Bg</label>
                      <div className="flex items-center gap-2 border border-gray-100 rounded-xl p-2 bg-gray-50">
                        <input 
                          type="color" 
                          value={qrBgColor} 
                          onChange={(e) => setQrBgColor(e.target.value)} 
                          className="size-7 rounded-lg border-0 cursor-pointer overflow-hidden"
                        />
                        <span className="text-xs font-mono font-bold uppercase text-gray-700">{qrBgColor}</span>
                      </div>
                    </div>
                  </div>

                  {brandProfile?.logoUrl && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <label className="text-xs font-bold text-gray-500">Logo in QR Code</label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showLogoInQr}
                        onClick={() => setShowLogoInQr(!showLogoInQr)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                          showLogoInQr ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block size-3.5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                            showLogoInQr ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab 2: Typography & Content */}
              {activeControlTab === 'content' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="space-y-4"
                >
                  {/* Dynamically list text elements of templates */}
                  {elements.filter(el => el.type === 'text').map((textEl) => (
                    <div key={textEl.id} className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 capitalize">
                        {textEl.id.replace('-text', '').replace('-', ' ')}
                      </label>
                      <input 
                        type="text" 
                        value={textEl.text || ''} 
                        onChange={(e) => {
                          setElements(prev => prev.map(el => 
                            el.id === textEl.id ? { ...el, text: e.target.value } : el
                          ));
                        }}
                        className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white font-semibold text-gray-800"
                      />
                    </div>
                  ))}

                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400">QR Code Link & Branches</h5>
                    
                    {/* Branch switcher dropdown if venue has more than 1 branch (PRD §94) */}
                    {branches.length > 1 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 block">Switch Venue Branch</label>
                        <select
                          value={activeBranchId || ''}
                          onChange={(e) => setActiveBranch(e.target.value || null)}
                          className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white font-semibold text-gray-800 cursor-pointer"
                        >
                          <option value="">All Branches (Main)</option>
                          {branches.map((b: any) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          Switching branches automatically recalculates QR Code content.
                        </span>
                      </div>
                    )}

                    {/* QR Destination Selector dropdown (PRD §16) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 block">QR Destination Type</label>
                      <select
                        value={qrDestination}
                        onChange={(e) => setQrDestination(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white font-semibold text-gray-800 cursor-pointer"
                      >
                        {DESTINATIONS.map((d) => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Show raw URL field only if "Custom URL" is selected */}
                    {qrDestination === 'custom' ? (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-xs font-bold text-gray-500 block">Custom Web Link</label>
                        <input 
                          type="text" 
                          value={qrUrl} 
                          onChange={(e) => setQrUrl(e.target.value)}
                          placeholder="e.g. https://google.com/review/link"
                          className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white font-mono text-xs text-gray-600"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-gray-400 block">Resolved Scan Link</span>
                        <span className="text-xs font-mono text-primary truncate block font-bold" title={qrUrl}>
                          {qrUrl}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}


            </div>
          </div>

          {/* Export Options */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <h4 className="text-xs font-bold text-gray-500">Export Options</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleDownload('png')} 
                variant="outline" 
                className="rounded-xl border-gray-100 bg-white hover:bg-gray-50 text-gray-800 font-bold flex items-center justify-center gap-2 h-10 text-xs px-2"
              >
                <Download size={13} />
                Standard PNG
              </Button>
              <Button 
                onClick={() => handleDownload('print_pdf')} 
                variant="outline" 
                className="rounded-xl border-gray-100 bg-white hover:bg-gray-50 text-gray-800 font-bold flex items-center justify-center gap-2 h-10 text-xs px-2"
                title="Saves PDF with professional bleed & trim crop marks"
              >
                <FileText size={13} className="text-green-600" />
                Print-Ready PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: High Fidelity Preview Studio & Mockups perspective mapping (7 cols) */}
        <div className={`lg:col-span-7 flex-col gap-6 ${mobileViewTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Live Design Canvas */}
          <div className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-2xl shadow-sm">
            <span className="text-xs font-extrabold text-gray-800 ml-2">Live Design Canvas</span>
            <span className="text-[10px] uppercase font-extrabold text-gray-400">High-Fidelity Rendering</span>
          </div>

          <div className="bg-slate-100 border border-slate-200/50 rounded-3xl p-6 md:p-10 flex items-center justify-center min-h-[500px] relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              ref={canvasRef}
              style={{
                backgroundColor: bgColor,
                borderColor: borderColor,
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                aspectRatio: FORMATS.find(f => f.id === selectedFormat)?.ratio || 4/6
              }}
              className="w-[280px] border-[6px] rounded-[24px] shadow-2xl relative overflow-hidden bg-slate-900 transition-all duration-300"
            >
              <div
                style={{ backgroundColor: accentColor }}
                className="absolute top-0 left-0 right-0 h-1.5"
              />

              {elements.map((el) => {
                if (el.type === 'logo') {
                  return (
                    <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: `${el.width || 30}%`, height: `${el.height || 8}%`, zIndex: 30 }}
                      className="flex items-center justify-center gap-1.5 text-[8px] uppercase tracking-wider font-extrabold text-white">
                      {brandProfile?.logoUrl ? (
                        <img src={brandProfile.logoUrl} alt="logo" className="size-full object-contain rounded-lg" />
                      ) : (
                        <>
                          <div style={{ backgroundColor: accentColor }} className="size-4 rounded flex items-center justify-center font-bold text-white text-[9px]">
                            {brandProfile?.name?.charAt(0) || 'V'}
                          </div>
                          <span className="truncate">{brandProfile?.name || 'VemTap Store'}</span>
                        </>
                      )}
                    </div>
                  );
                }
                if (el.type === 'qr_code') {
                  return (
                    <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, backgroundColor: qrBgColor || '#FFFFFF', padding: '8px', zIndex: 20 }}
                      className="rounded-[16px] shadow-lg flex items-center justify-center border border-white/10">
                      <div className="relative inline-flex">
                        <QRCodeSVG value={qrUrl} size={el.size || 100} fgColor={qrFgColor} bgColor={qrBgColor} />
                        {showLogoInQr && brandProfile?.logoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white rounded-full p-0.5 shadow-md" style={{ width: '26%', height: '26%' }}>
                              <img src={brandProfile.logoUrl} alt="logo" className="size-full object-contain rounded-full" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={el.id} style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: el.width ? `${el.width}%` : 'auto', maxWidth: '90%', color: el.color || '#FFFFFF', fontSize: `${el.fontSize || 14}px`, fontWeight: el.fontWeight || 'normal', textAlign: el.alignment || 'center', zIndex: 10 }}
                    className="leading-tight font-medium">{el.text}</div>
                );
              })}
            </motion.div>
          </div>

        </div>

      </div>
    </div>
  );
}
