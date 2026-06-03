"use client";

import React, { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Sparkles,
  QrCode,
  Download,
  Bookmark,
  ZoomIn,
} from 'lucide-react';
import {
  useCreateMarketingAsset,
  useBrandProfile,
  useTemplateStyles,
  useTemplateFormats,
} from '@/services/marketing-assets/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import toast from 'react-hot-toast';

type Goal = 'view-menu' | 'place-order' | 'join-loyalty' | 'leave-feedback' | 'reserve-table' | 'promotions' | null;
type DesignStyle = 'classic' | 'modern' | 'premium' | 'luxury' | 'bold' | 'minimal' | null;
type AssetFormat = 'table-stand' | 'poster' | 'flyer' | 'window-sticker' | 'banner' | 'social-media' | null;

const goals = [
  { id: 'view-menu' as const, icon: 'restaurant', label: 'View Menu', desc: 'Digital browsing for dine-in or takeout.' },
  { id: 'place-order' as const, icon: 'shopping_cart', label: 'Place Order', desc: 'Direct checkout flow for quick service.' },
  { id: 'join-loyalty' as const, icon: 'star', label: 'Join Loyalty Program', desc: 'Build customer retention with rewards.' },
  { id: 'leave-feedback' as const, icon: 'chat', label: 'Leave Feedback', desc: 'Gather reviews and customer insights.' },
  { id: 'reserve-table' as const, icon: 'calendar_today', label: 'Reserve Table', desc: 'Manage bookings and table turnover.' },
  { id: 'promotions' as const, icon: 'sell', label: 'Promotions', desc: 'Highlight limited time offers and sales.' },
];

const designStyles = [
  { id: 'classic' as const, label: 'Classic', color: 'bg-amber-100', accent: 'bg-amber-800' },
  { id: 'modern' as const, label: 'Modern', color: 'bg-indigo-100', accent: 'bg-indigo-600' },
  { id: 'premium' as const, label: 'Premium', color: 'bg-slate-800', accent: 'bg-yellow-500' },
  { id: 'luxury' as const, label: 'Luxury', color: 'bg-emerald-900', accent: 'bg-amber-400' },
  { id: 'bold' as const, label: 'Bold', color: 'bg-orange-500', accent: 'bg-purple-700' },
  { id: 'minimal' as const, label: 'Minimal', color: 'bg-gray-100', accent: 'bg-gray-400' },
];

const formats = [
  { id: 'table-stand' as const, label: 'Table Stand', size: '5 x 7 in', thumb: 'bg-amber-50' },
  { id: 'poster' as const, label: 'Poster', size: '18 x 24 in', thumb: 'bg-blue-50' },
  { id: 'flyer' as const, label: 'Flyer', size: '8.5 x 11 in', thumb: 'bg-green-50' },
  { id: 'window-sticker' as const, label: 'Window Sticker', size: 'Custom Size', thumb: 'bg-purple-50' },
  { id: 'banner' as const, label: 'Banner', size: 'Various Sizes', thumb: 'bg-rose-50' },
  { id: 'social-media' as const, label: 'Social Media', size: '1080 x 1080 px', thumb: 'bg-cyan-50' },
];

const stepLabels = ['Goal', 'Design', 'Content', 'Format', 'Generate', 'Preview'];

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

  const [step, setStep] = useState(templateId ? 2 : 1);
  const [goal, setGoal] = useState<Goal>(null);
  const [designStyle, setDesignStyle] = useState<DesignStyle>(null);
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [cta, setCta] = useState('');
  const [format, setFormat] = useState<AssetFormat>(null);
  const [showAiSheet, setShowAiSheet] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [mockupEnv, setMockupEnv] = useState('Wall');
  const [aiHeadline, setAiHeadline] = useState('');

  const previewRef = useRef<HTMLDivElement>(null);

  const displayStep = templateId ? step - 1 : step;
  const totalSteps = templateId ? 3 : 4;
  const stepProgress = templateId
    ? Math.min(100, ((step - 2) / 3) * 100)
    : Math.min(100, ((step - 1) / 4) * 100);

  const handleBack = () => {
    if (showAiSheet) { setShowAiSheet(false); return; }
    if (step > 1) { setStep(step - 1); return; }
    router.push('/dashboard/marketing-assets');
  };

  const handleGenerateAi = () => {
    setAiHeadline(`Unleash Your ${headline || 'Brand'}: The Definitive Collection`);
    setShowAiSheet(true);
  };

  const applyAiContent = () => {
    if (aiHeadline) setHeadline(aiHeadline);
    setShowAiSheet(false);
    toast.success('Content optimized with AI!');
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
          qrCodeContent: `${window.location.origin}/s/default`,
          customConfig: {
            backgroundColor: designStyle === 'modern' ? '#4F46E5' : designStyle === 'premium' ? '#1E293B' : '#0F172A',
            accentColor: designStyle === 'classic' ? '#92400E' : '#493EE5',
            elements: [
              { id: 'headline', type: 'text', text: headline || 'Your Headline', x: 10, y: 24, fontSize: 18, color: '#FFFFFF', fontWeight: 'extrabold', alignment: 'center' },
              { id: 'subheadline', type: 'text', text: subheadline || 'Your subheadline here', x: 10, y: 38, fontSize: 12, color: '#FFFFFF', fontWeight: 'medium', alignment: 'center' },
              { id: 'cta', type: 'text', text: cta || 'Get Started', x: 10, y: 78, fontSize: 10, color: '#FFFFFF', fontWeight: 'bold', alignment: 'center' },
              { id: 'qr', type: 'qr_code', x: 30, y: 50, size: 110 },
            ],
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
    if (step === 1) return goal !== null;
    if (step === 2) return designStyle !== null;
    if (step === 3) return headline.trim().length > 0;
    if (step === 4) return format !== null;
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

  return (
    <div className="flex flex-col min-h-full bg-background text-on-surface">
      <header className="sticky top-0 z-10 shrink-0 flex items-center justify-between px-5 h-12 bg-surface shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="flex items-center justify-center w-10 h-10 hover:bg-surface-container-high rounded-full transition-transform active:scale-95">
            <ArrowLeft size={20} className="text-primary" />
          </button>
          <h1 className="text-headline-md font-bold text-primary">Marketing Assets</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden border border-outline-variant">
          <div className="size-full flex items-center justify-center text-label-caps text-on-surface-variant">
            {(brandProfile?.name || 'U').charAt(0)}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-surface-container">
          <div className="bg-primary h-full transition-all duration-500 ease-out" style={{ width: `${stepProgress}%` }} />
        </div>
      </header>

      <main className="flex-1 px-5 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
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

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="py-4">
                <span className="text-label-caps text-primary mb-2 block">Step {displayStep} of {totalSteps}</span>
                <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">Choose A Design</h2>
                <p className="text-body-lg text-on-surface-variant">Pick a design style for your marketing assets.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {designStyles.map((ds) => {
                  const isActive = designStyle === ds.id;
                  return (
                    <button
                      key={ds.id}
                      onClick={() => setDesignStyle(ds.id)}
                      className={`relative flex flex-col p-3 bg-surface-container-lowest border-2 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] text-left active:scale-95 transition-all cursor-pointer ${
                        isActive ? 'border-primary bg-surface-container-low' : 'border-transparent hover:bg-surface-container-low'
                      }`}
                    >
                      <div className={`aspect-square w-full rounded-lg ${ds.color} overflow-hidden mb-2 flex items-center justify-center`}>
                        <div className={`w-12 h-12 rounded-full ${ds.accent} opacity-60`} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-caps uppercase tracking-wider text-on-surface">{ds.label}</span>
                        <Check size={16} className={`transition-all duration-200 ${isActive ? 'opacity-100 text-primary' : 'opacity-0'}`} />
                      </div>
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

              <section className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-2">
                <label className="text-label-caps text-on-surface-variant block">Call To Action</label>
                <input
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full bg-transparent border border-outline-variant focus:border-primary focus:ring-0 rounded-lg h-12 px-4 text-body-lg text-on-surface transition-all"
                  placeholder="Shop Now"
                />
              </section>

              <button
                onClick={handleGenerateAi}
                className="w-full flex items-center justify-center gap-2 bg-surface-container-high text-primary font-button text-button h-12 rounded-xl hover:bg-surface-container-highest transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles size={18} />
                Improve My Content
              </button>

              <div className="relative overflow-hidden rounded-xl h-48">
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-end p-4">
                  <div>
                    <span className="text-label-caps text-[10px] mb-1 opacity-60 uppercase block">Live Preview</span>
                    <p className="text-headline-md leading-tight text-on-surface">{headline || 'Your Headline Will Appear Here'}</p>
                    {subheadline && <p className="text-body-sm text-on-surface-variant mt-1">{subheadline}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="py-4">
                <span className="text-label-caps text-primary uppercase tracking-widest mb-2 block">Step {displayStep} of {totalSteps}</span>
                <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">Where will this be displayed?</h2>
                <p className="text-body-lg text-on-surface-variant">Select the format and dimensions that best fit your display environment.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {formats.map((f) => {
                  const isActive = format === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`relative flex flex-col bg-surface-container-lowest border rounded-xl p-4 cursor-pointer active:scale-95 transition-all ${
                        isActive ? 'border-2 border-primary bg-surface-container-low' : 'border border-outline-variant hover:shadow-lg'
                      }`}
                    >
                      <div className={`aspect-square ${f.thumb} rounded-lg mb-3 flex items-center justify-center`}>
                        <QrCode size={32} className="text-on-surface-variant opacity-30" />
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
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
              <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                <div className="absolute inset-4 border-2 border-primary/20 border-dashed rounded-full animate-spin" style={{ animationDuration: '8s' }} />
                <div className="z-10 bg-white shadow-lg rounded-xl p-4">
                  <Sparkles size={48} className="text-primary" />
                </div>
              </div>
              <h1 className="text-headline-lg-mobile text-on-surface mb-4">Preparing Design</h1>
              <p className="text-body-sm text-on-surface-variant text-center mb-8 max-w-[280px]">
                We are tailoring your marketing assets to match your unique brand identity.
              </p>
              <div className="w-full max-w-sm space-y-3">
                {[
                  { label: 'Loading Business Brand', done: progress > 25 },
                  { label: 'Generating QR Code', done: progress > 50 },
                  { label: 'Applying Design', done: progress > 75 },
                  { label: 'Creating Preview', done: progress > 95 },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 transition-all duration-500 ${
                    s.done ? 'opacity-100' : 'opacity-40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        s.done ? 'bg-primary' : 'bg-surface-container'
                      }`}>
                        {s.done ? (
                          <Check size={14} className="text-white" />
                        ) : (
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        )}
                      </div>
                      <span className="text-label-caps tracking-wide">{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full max-w-sm mt-8">
                <div className="flex justify-between mb-2">
                  <span className="text-label-caps text-on-surface-variant">{Math.round(progress)}%</span>
                  <span className="text-label-caps text-primary uppercase font-bold tracking-widest">
                    {progress < 100 ? 'Synchronizing...' : 'Ready!'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container transition-all duration-300 ease-out rounded-full" style={{ width: `${progress}%`, boxShadow: progress > 0 ? '0 0 12px rgba(99, 91, 255, 0.4)' : 'none' }} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <section className="flex flex-col items-center">
                <div
                  ref={previewRef}
                  className={`relative w-full max-w-[280px] aspect-[9/16] rounded-[40px] overflow-hidden bg-white mb-4 shadow-2xl transition-all duration-500 ${
                    zoom ? 'scale-110' : 'scale-100'
                  }`}
                  style={{ boxShadow: '0 0 0 8px #151a31, 0 20px 50px rgba(0,0,0,0.15)' }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-slate-800 to-purple-900 flex flex-col items-center justify-center p-6 text-white">
                    {headline && <h3 className="text-xl font-bold text-center mb-2">{headline}</h3>}
                    {subheadline && <p className="text-sm text-center opacity-80 mb-4">{subheadline}</p>}
                    <div className="bg-white p-3 rounded-2xl shadow-lg">
                      <QrCode size={100} className="text-black" />
                    </div>
                    {cta && <p className="text-xs font-semibold mt-4 uppercase tracking-wider opacity-70">{cta}</p>}
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    <button onClick={() => setZoom(!zoom)} className="flex items-center gap-1 bg-black/80 text-white h-9 px-4 rounded-full backdrop-blur-md text-label-caps active:scale-95 transition-all cursor-pointer">
                      <ZoomIn size={14} />
                      Zoom
                    </button>
                  </div>
                </div>
                <h2 className="text-headline-lg-mobile text-on-surface mb-1">{headline || 'Your Asset'}</h2>
                <p className="text-body-sm text-on-surface-variant">Aspect Ratio: 9:16</p>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-headline-md text-on-surface font-semibold">See It In Real Life</h3>
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
                  {mockupEnvs.map((env) => (
                    <button
                      key={env}
                      onClick={() => setMockupEnv(env)}
                      className={`px-4 py-2 rounded-xl text-label-caps transition-all cursor-pointer ${
                        mockupEnv === env
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
                <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-sm ${mockupColors[mockupEnv] || 'bg-surface-container-low'} flex items-center justify-center`}>
                  <div className="text-center opacity-40">
                    <QrCode size={48} className="mx-auto mb-2 text-on-surface-variant" />
                    <p className="text-body-sm text-on-surface-variant">{mockupEnv} environment preview</p>
                  </div>
                  <div className="absolute top-3 right-3 bg-primary/10 backdrop-blur-md px-3 py-1 rounded-full border border-primary/20 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-label-caps text-primary uppercase">Live Preview</span>
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                  </div>
                  <div>
                    <h4 className="text-headline-md text-[16px] text-on-surface font-semibold">Design Specs</h4>
                    <p className="text-body-sm text-on-surface-variant">
                      {format === 'social-media' ? 'Optimized for Instagram & TikTok' : 'Ready for print'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-low p-3 rounded-lg">
                    <span className="text-label-caps text-on-surface-variant block mb-1">FORMAT</span>
                    <span className="text-body-lg font-semibold">{formats.find(f => f.id === format)?.label || 'Standard'}</span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg">
                    <span className="text-label-caps text-on-surface-variant block mb-1">RESOLUTION</span>
                    <span className="text-body-lg font-semibold">1080 x 1920</span>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Bottom Action Bar - not for step 5 (generating) */}
      {step !== 5 && (
        <footer className="shrink-0 px-5 py-4 bg-surface/80 backdrop-blur-md border-t border-outline-variant/10">
          <div className="max-w-2xl mx-auto">
            {step === 6 ? (
              <div className="flex items-center gap-3">
                <button className="flex-1 h-12 border border-primary text-primary font-button text-button rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container/10 active:scale-95 transition-all cursor-pointer">
                  <Bookmark size={18} />
                  Save Asset
                </button>
                <button className="flex-[1.5] h-12 bg-primary text-on-primary font-button text-button rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer">
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
                className="w-full h-12 bg-primary text-on-primary font-button text-button rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Continue
                <ArrowLeft size={18} className="rotate-180" />
              </button>
            )}
          </div>
        </footer>
      )}

      {/* AI Content Optimizer Bottom Sheet */}
      {showAiSheet && (
        <>
          <div className="fixed inset-0 bg-on-surface/40 z-[60]" onClick={() => setShowAiSheet(false)} />
          <div className="fixed bottom-0 left-0 w-full bg-surface rounded-t-[32px] z-[70] max-h-[795px] overflow-hidden flex flex-col shadow-2xl">
            <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto my-4 shrink-0" />
            <div className="px-5 pb-6 space-y-5 overflow-y-auto">
              <header className="text-center">
                <h3 className="text-headline-md font-semibold">AI Content Optimizer</h3>
                <p className="text-body-sm text-on-surface-variant mt-1">Refining your brand voice using Marketing AI</p>
              </header>
              <div className="space-y-4">
                <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20">
                  <span className="text-label-caps text-on-surface-variant block mb-2">Original Version</span>
                  <h4 className="text-headline-md text-primary opacity-60">{headline || 'Your headline'}</h4>
                  <p className="text-body-sm text-on-surface-variant mt-2 italic">{subheadline || 'Your subheadline...'}</p>
                </div>
                <div className="flex justify-center -my-2">
                  <div className="bg-primary-container text-on-primary-container p-2 rounded-full shadow-md">
                    <span className="material-symbols-outlined text-[20px] block">expand_more</span>
                  </div>
                </div>
                <div className="p-4 bg-primary-container/10 rounded-xl border-2 border-primary relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary text-on-primary px-3 py-1 rounded-bl-lg text-label-caps text-[10px]">RECOMMENDED</div>
                  <span className="text-label-caps text-primary block mb-2">AI Enhanced Version</span>
                  <h4 className="text-headline-md text-on-surface">{aiHeadline || 'Enhanced version will appear here'}</h4>
                  <p className="text-body-sm text-on-surface mt-2 leading-relaxed">
                    Experience a curated fusion of high-velocity style and intentional comfort. Designed for the modern professional who demands both elegance and performance.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowAiSheet(false)}
                  className="h-12 border border-outline-variant text-on-surface font-button rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Try Another
                </button>
                <button
                  onClick={applyAiContent}
                  className="h-12 bg-primary text-on-primary font-button rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  Use This
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
