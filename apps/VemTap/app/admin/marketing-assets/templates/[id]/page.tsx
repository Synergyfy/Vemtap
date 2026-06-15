"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Palette, 
  Code, 
  Eye, 
  Settings, 
  Trash2, 
  Plus, 
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { 
  useMarketingTemplate, 
  useCreateMarketingTemplate, 
  useUpdateMarketingTemplate,
  useMarketingCategories
} from '@/services/marketing-assets/hooks';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function AdminTemplateBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isCreateMode = id === 'create';

  const { data: template, isLoading: templateLoading } = useMarketingTemplate(isCreateMode ? '' : id);
  const createMutation = useCreateMarketingTemplate();
  const updateMutation = useUpdateMarketingTemplate();

  // Builder tabs
  const [activeTab, setActiveTab] = useState<'visual' | 'json' | 'preview'>('visual');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  // Configuration states
  const [name, setName] = useState('New System Template');
  const [description, setDescription] = useState('Premium layout preset.');
  const [category, setCategory] = useState('Restaurant');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const { data: activeCategories = [], isLoading: categoriesLoading } = useMarketingCategories(false);
  const [type, setType] = useState('table_tent');
  const [isActive, setIsActive] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

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
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // QR config
  const [qrColor, setQrColor] = useState('#FFFFFF');
  const [qrBgColor, setQrBgColor] = useState('#0F172A');

  // JSON Raw Configuration string representation
  const [jsonString, setJsonString] = useState('');

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
    const taglineText = layoutConfig?.tagline || 'Savor the offline-to-online experience.';
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

  useEffect(() => {
    if (template && !isCreateMode) {
      setName(template.name);
      setDescription(template.description || '');
      setCategory(template.category);
      setCategoryIds(template.categories?.map((c: any) => c.id) || []);
      setType(template.type);
      setIsActive(template.isActive);
      setThumbnailUrl(template.thumbnailUrl || '');
      
      const config = template.layoutConfig || {};
      const transformed = transformToDynamicElements(config);
      
      setBgColor(transformed.backgroundColor);
      setBgImage(transformed.backgroundImage);
      setAccentColor(transformed.accentColor);
      setBorderColor(transformed.borderColor);
      setElements(transformed.elements);

      setQrColor(template.qrCodeConfig?.color || '#FFFFFF');
      setQrBgColor(template.qrCodeConfig?.backgroundColor || '#0F172A');

      // Setup JSON text
      const fullConfig = {
        layoutConfig: {
          backgroundColor: transformed.backgroundColor,
          backgroundImage: transformed.backgroundImage,
          accentColor: transformed.accentColor,
          borderColor: transformed.borderColor,
          elements: transformed.elements
        },
        qrCodeConfig: template.qrCodeConfig
      };
      setJsonString(JSON.stringify(fullConfig, null, 2));
    } else {
      // Default elements layout for new system templates
      const defaultElements = [
        { id: 'logo-slot', type: 'logo', x: 35, y: 8, width: 30, height: 8 },
        {
          id: 'headline-text',
          type: 'text',
          text: 'Scan to Connect',
          x: 10,
          y: 24,
          fontSize: 18,
          color: '#FFFFFF',
          fontWeight: 'extrabold',
          alignment: 'center'
        },
        {
          id: 'subtitle-text',
          type: 'text',
          text: 'Enjoy contactless services',
          x: 10,
          y: 38,
          fontSize: 12,
          color: '#94A3B8',
          fontWeight: 'medium',
          alignment: 'center'
        },
        {
          id: 'qr-code-slot',
          type: 'qr_code',
          x: 30,
          y: 50,
          size: 110
        },
        {
          id: 'tagline-text',
          type: 'text',
          text: 'Savor the offline-to-online experience.',
          x: 10,
          y: 78,
          fontSize: 9,
          color: '#64748B',
          fontWeight: 'semibold',
          alignment: 'center'
        }
      ];

      setElements(defaultElements);
      
      const defaultJson = {
        layoutConfig: {
          backgroundColor: bgColor,
          backgroundImage: bgImage,
          accentColor,
          borderColor,
          elements: defaultElements
        },
        qrCodeConfig: {
          color: qrColor,
          backgroundColor: qrBgColor
        }
      };
      setJsonString(JSON.stringify(defaultJson, null, 2));
    }
  }, [template, isCreateMode]);

  // Auto-select the primary category when none are selected yet
  useEffect(() => {
    if (activeCategories.length > 0 && categoryIds.length === 0 && category) {
      const found = activeCategories.find((c: any) => c.name === category);
      if (found) {
        setCategoryIds([found.id]);
      }
    }
  }, [activeCategories, category, categoryIds]);

  // Sync style picks into JSON string on change
  const syncVisualToJson = () => {
    const obj = {
      layoutConfig: {
        backgroundColor: bgColor,
        backgroundImage: bgImage,
        accentColor,
        borderColor,
        elements
      },
      qrCodeConfig: {
        color: qrColor,
        backgroundColor: qrBgColor
      }
    };
    setJsonString(JSON.stringify(obj, null, 2));
  };

  useEffect(() => {
    if (activeTab !== 'json') {
      syncVisualToJson();
    }
  }, [bgColor, bgImage, accentColor, borderColor, elements, qrColor, qrBgColor]);

  const handleSave = async () => {
    // Validate JSON configuration first
    let finalLayoutConfig = {};
    let finalQrConfig = {};
    try {
      const parsed = JSON.parse(jsonString);
      finalLayoutConfig = parsed.layoutConfig || {};
      finalQrConfig = parsed.qrCodeConfig || {};
    } catch (err) {
      toast.error('Invalid JSON configuration structure! Please check syntax.');
      setActiveTab('json');
      return;
    }

    const payload = {
      name,
      description: description || undefined,
      category,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      type,
      isActive,
      thumbnailUrl: thumbnailUrl || undefined,
      layoutConfig: finalLayoutConfig,
      qrCodeConfig: finalQrConfig
    };

    try {
      if (isCreateMode) {
        await createMutation.mutateAsync(payload);
        toast.success('New template created successfully');
      } else {
        await updateMutation.mutateAsync({ id, updates: payload });
        toast.success('Template updated successfully');
      }
      router.push('/admin/marketing-assets/templates');
    } catch (e) {
      toast.error('Failed to save template preset');
    }
  };

  // Visual drag coordinates calculator
  const handleDragEnd = (elementId: string, event: any, info: any) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const targetElement = event.currentTarget || event.target;
    if (!targetElement) return;
    const elementRect = targetElement.getBoundingClientRect();

    // calculate relative coordinates in percentage
    const relativeX = ((elementRect.left - canvasRect.left) / canvasRect.width) * 100;
    const relativeY = ((elementRect.top - canvasRect.top) / canvasRect.height) * 100;

    const boundedX = Math.max(0, Math.min(95, relativeX));
    const boundedY = Math.max(0, Math.min(95, relativeY));

    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, x: Math.round(boundedX), y: Math.round(boundedY) } : el
    ));
  };

  // Custom interactive corner-resize handler
  const handleResizeStart = (el: any, startEvent: React.MouseEvent | React.TouchEvent) => {
    startEvent.stopPropagation();
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const isTouchEvent = 'touches' in startEvent;
    const startX = isTouchEvent ? startEvent.touches[0].clientX : startEvent.clientX;
    const startY = isTouchEvent ? startEvent.touches[0].clientY : startEvent.clientY;

    const initialWidth = el.width || 30;
    const initialHeight = el.height || 8;
    const initialSize = el.size || 110;
    const initialFontSize = el.fontSize || 14;

    const handleResizeMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return;
      const isTouchMove = 'touches' in moveEvent;
      
      const currentX = isTouchMove ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = isTouchMove ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      if (el.type === 'logo') {
        const deltaWidthPct = (deltaX / canvasRect.width) * 100;
        const deltaHeightPct = (deltaY / canvasRect.height) * 100;
        const newWidth = Math.max(10, Math.min(100, Math.round(initialWidth + deltaWidthPct)));
        const newHeight = Math.max(2, Math.min(50, Math.round(initialHeight + deltaHeightPct)));

        setElements(prev => prev.map(item => 
          item.id === el.id ? { ...item, width: newWidth, height: newHeight } : item
        ));
      } else if (el.type === 'qr_code') {
        // QR Code is square, resize using deltaX
        const newSize = Math.max(40, Math.min(240, Math.round(initialSize + deltaX)));
        setElements(prev => prev.map(item => 
          item.id === el.id ? { ...item, size: newSize } : item
        ));
      } else if (el.type === 'text') {
        // Smoothly scale font size based on X delta / 3 (highly responsive and precise)
        const newFontSize = Math.max(6, Math.min(72, Math.round(initialFontSize + deltaX / 3)));
        setElements(prev => prev.map(item => 
          item.id === el.id ? { ...item, fontSize: newFontSize } : item
        ));
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

  // Custom interactive drag positioning handler
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
      
      // Prevent browser default behavior like scrolling during drag
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }

      const currentX = isTouchMove ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = isTouchMove ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      const deltaXPct = (deltaX / canvasRect.width) * 100;
      const deltaYPct = (deltaY / canvasRect.height) * 100;

      // Bound coordinates smoothly between 0% and 95%
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

  const handleAddTextElement = (presetText: string, defaultSize: number, weight: string, isPlaceholder = false) => {
    const id = `text-${Date.now()}`;
    const newEl = {
      id,
      type: 'text',
      text: presetText,
      x: 10,
      y: 45,
      fontSize: defaultSize,
      color: '#FFFFFF',
      fontWeight: weight,
      alignment: 'center',
      width: 80,
      isPlaceholder
    };
    setElements(prev => [...prev, newEl]);
    setSelectedElementId(id);
    toast.success(`${isPlaceholder ? 'Placeholder' : 'Text element'} added! Drag it on the preview canvas.`);
  };

  const handleAddLogoElement = () => {
    if (elements.some(el => el.type === 'logo')) {
      toast.error('Only one Brand Logo slot is allowed per template!');
      return;
    }
    const id = `logo-${Date.now()}`;
    const newEl = { id, type: 'logo', x: 35, y: 8, width: 30, height: 8 };
    setElements(prev => [...prev, newEl]);
    setSelectedElementId(id);
    toast.success('Business Logo placeholder added!');
  };

  const handleAddQrElement = () => {
    if (elements.some(el => el.type === 'qr_code')) {
      toast.error('Only one QR Code slot is allowed per template!');
      return;
    }
    const id = `qr-${Date.now()}`;
    const newEl = { id, type: 'qr_code', x: 30, y: 50, size: 110 };
    setElements(prev => [...prev, newEl]);
    setSelectedElementId(id);
    toast.success('Dynamic QR Code space added!');
  };

  const handleDeleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
    toast.success('Element deleted');
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing-assets/templates">
            <Button variant="ghost" className="size-10 p-0 rounded-xl hover:bg-gray-100">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div className="space-y-1">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="font-extrabold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none text-base md:text-lg max-w-xs md:max-w-md py-0 px-1"
            />
            <p className="text-xs text-gray-400 font-medium ml-1">
              Template Builder • Mode: {isCreateMode ? 'Sudo Creation' : 'Editing Preset'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={handleSave} 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2 px-5"
          >
            <Save size={16} />
            Save Preset Template
          </Button>
        </div>
      </div>

      {/* Mobile Builder Tabs View Selector */}
      <div className="grid grid-cols-2 gap-1 bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm lg:hidden">
        <button
          onClick={() => setMobileTab('editor')}
          className={`py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'editor'
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          🎨 Custom Settings
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'preview'
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          👁️ Design Canvas Preview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Builder controls panels (7 cols) */}
        <div className={`lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-5 md:p-6 shadow-sm flex-col justify-between min-h-[600px] ${mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="space-y-6">
            
            {/* Visual Builder | JSON Raw String | Previews Tab */}
            <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                onClick={() => setActiveTab('visual')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'visual'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Settings size={14} className="shrink-0" />
                <span className="hidden sm:inline">Visual Designer</span>
                <span className="sm:hidden">Visual</span>
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'json'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Code size={14} className="shrink-0" />
                <span className="hidden sm:inline">Raw JSON Schema</span>
                <span className="sm:hidden">JSON</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Eye size={14} className="shrink-0" />
                <span className="hidden sm:inline">Live Preview</span>
                <span className="sm:hidden">Preview</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="space-y-6">
              
              {/* Tab 1: Visual Configuration (Canva Editor Sidebar) */}
              {activeTab === 'visual' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="space-y-6"
                >
                  {/* Category and Type metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Industry Categories (multi-select)</label>
                      {categoriesLoading ? (
                        <div className="w-full px-4 py-2.5 text-xs border border-gray-100 rounded-xl bg-gray-50 text-gray-400 font-semibold animate-pulse">
                          Loading active categories...
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {activeCategories.map((cat: any) => {
                            const selected = categoryIds.includes(cat.id);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  if (selected) {
                                    setCategoryIds(prev => prev.filter(id => id !== cat.id));
                                  } else {
                                    setCategoryIds(prev => [...prev, cat.id]);
                                    setCategory(cat.name);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                  selected
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-200'
                                }`}
                              >
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Design Format Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full px-4 py-2 text-xs border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-gray-700 font-bold"
                      >
                        <option value="table_tent">Table Tent Stand (Acrylic)</option>
                        <option value="poster">Poster (Window/Wall)</option>
                        <option value="business_card">Business Card</option>
                        <option value="flyer">Handout Flyer</option>
                      </select>
                    </div>
                  </div>

                  {/* Backdrop graphic inputs */}
                  <div className="border-t border-gray-50 pt-4 space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Canvas Backdrop & Colors</h4>
                    
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
                        className="w-full px-4 py-2.5 text-xs border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-gray-700 font-mono"
                      />
                      
                      <span className="text-[10px] text-gray-400 font-medium block">
                        Provide a corporate vector design, a solid texture, or Unsplash background image.
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500">Bg Canvas</label>
                        <input 
                          type="color" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)} 
                          className="size-8 rounded-lg border border-gray-100 cursor-pointer overflow-hidden block w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500">Accent Stripe</label>
                        <input 
                          type="color" 
                          value={accentColor} 
                          onChange={(e) => setAccentColor(e.target.value)} 
                          className="size-8 rounded-lg border border-gray-100 cursor-pointer overflow-hidden block w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500">Borders</label>
                        <input 
                          type="color" 
                          value={borderColor} 
                          onChange={(e) => setBorderColor(e.target.value)} 
                          className="size-8 rounded-lg border border-gray-100 cursor-pointer overflow-hidden block w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Add layers widgets */}
                  <div className="border-t border-gray-50 pt-4 space-y-3">
                    <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Add Sudo Placeholders</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAddTextElement('BUSINESS NAME', 14, 'bold', true)}
                        className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5"
                      >
                        <Plus size={12} className="stroke-[3px]" /> Business Name
                      </button>
                      <button
                        onClick={handleAddLogoElement}
                        className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 flex items-center gap-1.5"
                      >
                        <Plus size={12} className="stroke-[3px]" /> Business Logo
                      </button>
                      <button
                        onClick={handleAddQrElement}
                        className="px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl text-xs font-bold text-green-700 hover:bg-green-100 flex items-center gap-1.5"
                      >
                        <Plus size={12} className="stroke-[3px]" /> QR Code
                      </button>
                    </div>

                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider pt-2">Custom Text Elements</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAddTextElement('SCAN TO ORDER', 18, 'extrabold')}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <Plus size={12} className="stroke-[3px]" /> Title Text
                      </button>
                      <button
                        onClick={() => handleAddTextElement('Savor the contactless dining experience', 12, 'medium')}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <Plus size={12} className="stroke-[3px]" /> Subtitle Text
                      </button>
                      <button
                        onClick={() => handleAddTextElement('Scan, Tap & Enjoy your meal.', 9, 'semibold')}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        <Plus size={12} className="stroke-[3px]" /> Footer Tagline
                      </button>
                    </div>
                  </div>

                  {/* Active elements property editors */}
                  {selectedElement ? (
                    <motion.div 
                      key={selectedElement.id}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="border-2 border-primary/20 bg-primary/5 rounded-2xl p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                        <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
                          Properties Editor: {selectedElement.type.replace('_', ' ')} Element
                        </span>
                        <Button
                          onClick={() => handleDeleteElement(selectedElement.id)}
                          variant="ghost"
                          className="size-7 p-0 rounded-lg hover:bg-rose-50 text-rose-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>

                      {/* Text inputs (only for text elements) */}
                      {selectedElement.type === 'text' && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 block">Edit Copy Content</label>
                            <input
                              type="text"
                              value={selectedElement.text || ''}
                              onChange={(e) => {
                                setElements(prev => prev.map(el => 
                                  el.id === selectedElement.id ? { ...el, text: e.target.value } : el
                                ));
                              }}
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 font-bold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-500 block">Font Size (px)</label>
                              <input
                                type="number"
                                value={selectedElement.fontSize || 14}
                                onChange={(e) => {
                                  setElements(prev => prev.map(el => 
                                    el.id === selectedElement.id ? { ...el, fontSize: parseInt(e.target.value) || 12 } : el
                                  ));
                                }}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-500 block">Text Color</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={selectedElement.color || '#FFFFFF'}
                                  onChange={(e) => {
                                    setElements(prev => prev.map(el => 
                                      el.id === selectedElement.id ? { ...el, color: e.target.value } : el
                                    ));
                                  }}
                                  className="size-8 rounded-lg cursor-pointer border border-gray-100 overflow-hidden"
                                />
                                <span className="text-[10px] font-mono font-bold uppercase text-gray-600">{selectedElement.color || '#FFFFFF'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-500 block">Font Weight</label>
                              <select
                                value={selectedElement.fontWeight || 'normal'}
                                onChange={(e) => {
                                  setElements(prev => prev.map(el => 
                                    el.id === selectedElement.id ? { ...el, text: el.text, fontWeight: e.target.value } : el
                                  ));
                                }}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold"
                              >
                                <option value="normal">Normal</option>
                                <option value="medium">Medium</option>
                                <option value="semibold">Semi Bold</option>
                                <option value="bold">Bold</option>
                                <option value="extrabold">Extra Bold</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-gray-500 block">Alignment</label>
                              <select
                                value={selectedElement.alignment || 'center'}
                                onChange={(e) => {
                                  setElements(prev => prev.map(el => 
                                    el.id === selectedElement.id ? { ...el, text: el.text, alignment: e.target.value } : el
                                  ));
                                }}
                                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold"
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Dimension adjustments for Logo or QR */}
                      {selectedElement.type === 'qr_code' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 block">QR Container Size (px)</label>
                          <input
                            type="number"
                            value={selectedElement.size || 100}
                            onChange={(e) => {
                              setElements(prev => prev.map(el => 
                                el.id === selectedElement.id ? { ...el, size: parseInt(e.target.value) || 80 } : el
                              ));
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold"
                          />
                        </div>
                      )}

                      {selectedElement.type === 'logo' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 block">Slot Width (%)</label>
                            <input
                              type="number"
                              value={selectedElement.width || 30}
                              onChange={(e) => {
                                setElements(prev => prev.map(el => 
                                  el.id === selectedElement.id ? { ...el, width: parseInt(e.target.value) || 30 } : el
                                ));
                              }}
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 block">Slot Height (%)</label>
                            <input
                              type="number"
                              value={selectedElement.height || 8}
                              onChange={(e) => {
                                setElements(prev => prev.map(el => 
                                  el.id === selectedElement.id ? { ...el, height: parseInt(e.target.value) || 8 } : el
                                ));
                              }}
                              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none text-gray-700 font-semibold"
                            />
                          </div>
                        </div>
                      )}

                      {/* Precise Coordinate Tuning for ALL elements */}
                      <div className="grid grid-cols-2 gap-4 border-t border-primary/10 pt-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 flex justify-between">
                            <span>Left Coord X (%)</span>
                            <span className="font-mono text-primary">{selectedElement.x}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="95"
                            value={selectedElement.x}
                            onChange={(e) => {
                              setElements(prev => prev.map(el => 
                                el.id === selectedElement.id ? { ...el, x: parseInt(e.target.value) } : el
                              ));
                            }}
                            className="w-full cursor-ew-resize accent-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 flex justify-between">
                            <span>Top Coord Y (%)</span>
                            <span className="font-mono text-primary">{selectedElement.y}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="95"
                            value={selectedElement.y}
                            onChange={(e) => {
                              setElements(prev => prev.map(el => 
                                el.id === selectedElement.id ? { ...el, y: parseInt(e.target.value) } : el
                              ));
                            }}
                            className="w-full cursor-ew-resize accent-primary"
                          />
                        </div>

                        {/* Touch-friendly Nudge coordinates micro-controls (nudge pads) */}
                        <div className="border-t border-gray-100/80 pt-3 space-y-2 col-span-2">
                          <label className="text-[10px] font-extrabold text-gray-400 block text-center uppercase tracking-wider">Tactile Position Nudge Controls</label>
                          
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                setElements(prev => prev.map(el => 
                                  el.id === selectedElement.id ? { ...el, y: Math.max(0, el.y - 1) } : el
                                ));
                              }}
                              className="size-9 bg-primary/10 hover:bg-primary hover:text-white text-primary font-extrabold flex items-center justify-center rounded-xl hover:scale-105 active:scale-95 transition-all text-xs border border-primary/20"
                              title="Nudge Up"
                            >
                              ▲
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-center gap-4">
                            <button 
                              type="button"
                              onClick={() => {
                                setElements(prev => prev.map(el => 
                                  el.id === selectedElement.id ? { ...el, x: Math.max(0, el.x - 1) } : el
                                ));
                              }}
                              className="size-9 bg-primary/10 hover:bg-primary hover:text-white text-primary font-extrabold flex items-center justify-center rounded-xl hover:scale-105 active:scale-95 transition-all text-xs border border-primary/20"
                              title="Nudge Left"
                            >
                              ◀
                            </button>
                            
                            <span className="text-[10px] font-black text-gray-500 font-mono select-none px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg">
                              X: {selectedElement.x}% | Y: {selectedElement.y}%
                            </span>
                            
                            <button 
                              type="button"
                              onClick={() => {
                                setElements(prev => prev.map(el => 
                                  el.id === selectedElement.id ? { ...el, x: Math.min(95, el.x + 1) } : el
                                ));
                              }}
                              className="size-9 bg-primary/10 hover:bg-primary hover:text-white text-primary font-extrabold flex items-center justify-center rounded-xl hover:scale-105 active:scale-95 transition-all text-xs border border-primary/20"
                              title="Nudge Right"
                            >
                              ▶
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                setElements(prev => prev.map(el => 
                                  el.id === selectedElement.id ? { ...el, y: Math.min(95, el.y + 1) } : el
                                ));
                              }}
                              className="size-9 bg-primary/10 hover:bg-primary hover:text-white text-primary font-extrabold flex items-center justify-center rounded-xl hover:scale-105 active:scale-95 transition-all text-xs border border-primary/20"
                              title="Nudge Down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center text-xs text-slate-400 font-medium">
                      Tip: Click any element directly on the design preview card on the right to edit its colors, size, font weight, or coordinates!
                    </div>
                  )}

                </motion.div>
              )}

              {/* Tab 2: Raw JSON Configuration string */}
              {activeTab === 'json' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <AlertCircle size={16} className="text-slate-400 shrink-0" />
                    <span>Provide valid JSON mappings for layoutConfig (with elements list) and qrCodeConfig.</span>
                  </div>

                  <textarea 
                    rows={12}
                    value={jsonString} 
                    onChange={(e) => setJsonString(e.target.value)}
                    className="w-full font-mono text-xs p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-700 leading-relaxed"
                  />
                </motion.div>
              )}

              {/* Tab 3: Preview placeholder message */}
              {activeTab === 'preview' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 text-center text-xs font-bold text-blue-600 leading-relaxed"
                >
                  Check the live visual output stand representation on the right side of your dashboard in real-time!
                </motion.div>
              )}

            </div>
          </div>

          <div className="border-t border-gray-50 pt-4 text-xs font-bold text-gray-400 flex items-center gap-1.5">
            <Settings size={14} />
            <span>Sudo Rule: System layouts have 100% platform access bypass constraints.</span>
          </div>
        </div>

        {/* Right Side: Interactive Bounded Draggable Canvas Preview (5 cols) */}
        <div className={`lg:col-span-5 bg-slate-100 border border-slate-200/50 rounded-3xl p-6 md:p-8 flex-col items-center justify-center shadow-inner min-h-[600px] relative ${mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
          
          <div className="text-[10px] font-extrabold text-slate-400 mb-3 tracking-wider uppercase">
            Live Draggable Bounded Canvas
          </div>

          <div
            ref={canvasRef}
            style={{
              backgroundColor: bgColor,
              borderColor: borderColor,
              backgroundImage: bgImage ? `url(${bgImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="w-[280px] aspect-[4/6] border-[6px] rounded-[24px] shadow-2xl relative overflow-hidden bg-slate-900"
          >
            {/* Design header accent band */}
            <div 
              style={{ backgroundColor: accentColor }}
              className="absolute top-0 left-0 right-0 h-1.5" 
            />

            {/* Canvas Elements Renderer */}
            {elements.map((el) => {
              
              if (el.type === 'logo') {
                return (
                  <motion.div
                    key={el.id}
                    onMouseDown={(e) => {
                      setSelectedElementId(el.id);
                      handleCustomDragStart(el, e);
                    }}
                    onTouchStart={(e) => {
                      setSelectedElementId(el.id);
                      handleCustomDragStart(el, e);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width || 30}%`,
                      height: `${el.height || 8}%`,
                      cursor: 'move',
                      border: selectedElementId === el.id ? '2px dashed #2563EB' : '1px dashed rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      padding: '4px',
                      zIndex: 30
                    }}
                    className="rounded-lg flex items-center justify-center gap-1.5 text-[8px] uppercase tracking-wider font-extrabold text-slate-300 select-none"
                  >
                    <div style={{ backgroundColor: accentColor }} className="size-4 rounded flex items-center justify-center font-bold text-white text-[9px]">
                      S
                    </div>
                    Brand Logo

                    {/* Drag to resize corner handle */}
                    {selectedElementId === el.id && (
                      <div
                        onMouseDown={(e) => handleResizeStart(el, e)}
                        onTouchStart={(e) => handleResizeStart(el, e)}
                        className="absolute bottom-[-6px] right-[-6px] w-3 h-3 bg-blue-600 border border-white rounded-full cursor-se-resize z-50 shadow-md"
                        title="Drag to resize logo"
                      />
                    )}
                  </motion.div>
                );
              }

              if (el.type === 'qr_code') {
                return (
                  <motion.div
                    key={el.id}
                    onMouseDown={(e) => {
                      setSelectedElementId(el.id);
                      handleCustomDragStart(el, e);
                    }}
                    onTouchStart={(e) => {
                      setSelectedElementId(el.id);
                      handleCustomDragStart(el, e);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      cursor: 'move',
                      border: selectedElementId === el.id ? '2px dashed #2563EB' : '2px solid rgba(255,255,255,0.1)',
                      backgroundColor: qrBgColor || '#000000',
                      padding: '8px',
                      zIndex: 20
                    }}
                    className="rounded-[16px] shadow-lg flex items-center justify-center relative select-none"
                  >
                    <QRCodeSVG 
                      value="https://vemtap.com/admin/templates" 
                      size={el.size || 100} 
                      fgColor={qrColor || '#FFFFFF'} 
                      bgColor={qrBgColor || '#000000'}
                    />

                    {/* Drag to resize corner handle */}
                    {selectedElementId === el.id && (
                      <div
                        onMouseDown={(e) => handleResizeStart(el, e)}
                        onTouchStart={(e) => handleResizeStart(el, e)}
                        className="absolute bottom-[-6px] right-[-6px] w-3 h-3 bg-blue-600 border border-white rounded-full cursor-se-resize z-50 shadow-md"
                        title="Drag to resize QR code"
                      />
                    )}
                  </motion.div>
                );
              }

              // Default: Text Layer
              return (
                <motion.div
                  key={el.id}
                  onMouseDown={(e) => {
                    setSelectedElementId(el.id);
                    handleCustomDragStart(el, e);
                  }}
                  onTouchStart={(e) => {
                    setSelectedElementId(el.id);
                    handleCustomDragStart(el, e);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: el.width ? `${el.width}%` : 'auto',
                    maxWidth: '90%',
                    cursor: 'move',
                    color: el.color || '#FFFFFF',
                    fontSize: `${el.fontSize || 14}px`,
                    fontWeight: el.fontWeight || 'normal',
                    textAlign: el.alignment || 'center',
                    border: selectedElementId === el.id ? '2px dashed #2563EB' : '1px dashed transparent',
                    padding: '2px',
                    zIndex: 10
                  }}
                  className="select-none leading-tight font-medium relative"
                >
                  {el.text}

                  {/* Drag to resize corner handle */}
                  {selectedElementId === el.id && (
                    <div
                      onMouseDown={(e) => handleResizeStart(el, e)}
                      onTouchStart={(e) => handleResizeStart(el, e)}
                      className="absolute bottom-[-6px] right-[-6px] w-3 h-3 bg-blue-600 border border-white rounded-full cursor-se-resize z-50 shadow-md"
                      title="Drag to resize text font size"
                    />
                  )}
                </motion.div>
              );
            })}

          </div>

          <p className="text-[10px] font-bold text-slate-400 mt-4 text-center max-w-xs leading-normal">
            💡 Drag elements inside the card directly! Click any element to adjust its content, colors, text sizing, or precise coordinate percentages in the left panel.
          </p>

        </div>

      </div>
    </div>
  );
}
