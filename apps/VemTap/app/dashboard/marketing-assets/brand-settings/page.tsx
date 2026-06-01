"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBrandProfile, useSaveBrandOverride, useDeleteBrandOverride } from '@/services/marketing-assets/hooks';
import { Brush, Palette, Image as ImageIcon, Save, RefreshCw, Type, AlertCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function BrandSettingsPage() {
  const { data: profile, isLoading } = useBrandProfile();
  const saveMutation = useSaveBrandOverride();
  const deleteMutation = useDeleteBrandOverride();

  // Branding configuration states
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#1E293B');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [tagline, setTagline] = useState('');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (profile) {
      setLogoUrl(profile.logoUrl || '');
      setPrimaryColor(profile.primaryColor);
      setSecondaryColor(profile.secondaryColor);
      setAccentColor(profile.accentColor);
      setTagline(profile.tagline || '');
      setFontFamily(profile.fontFamily);
      setWebsite(profile.website || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveMutation.mutateAsync({
        logoUrl: logoUrl || undefined,
        primaryColor,
        secondaryColor,
        accentColor,
        tagline: tagline || undefined,
        fontFamily,
        website: website || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });
      toast.success('Brand settings customized successfully!');
    } catch (e) {
      toast.error('Failed to customize brand override');
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to delete overrides and restore your standard global profile branding?')) return;
    try {
      await deleteMutation.mutateAsync();
      toast.success('Restored to global business profile branding');
    } catch (e) {
      toast.error('Failed to reset overrides');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10">
      
      {/* Settings Form Box (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Brush className="text-primary size-5" />
            Override Brand Style
          </h3>
          {profile?.isOverridden && (
            <Button 
              onClick={handleReset} 
              variant="outline" 
              className="rounded-xl border-rose-100 hover:bg-rose-50 text-rose-600 font-bold text-xs gap-1.5 h-9"
            >
              <RefreshCw size={12} />
              Reset overrides
            </Button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Logo Image Link</label>
              <div className="relative">
                <ImageIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://cdn.vemtap.com/brands/my-logo.png"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-gray-700 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Font Family</label>
              <div className="relative">
                <Type size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-gray-700 font-bold cursor-pointer"
                >
                  <option value="Inter">Inter (Sans-serif)</option>
                  <option value="Outfit">Outfit (Geometric)</option>
                  <option value="Roboto">Roboto (Mechanical)</option>
                  <option value="Playfair Display">Playfair Display (Serif)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Primary Palette</label>
              <div className="flex items-center gap-2 border border-gray-100 rounded-xl p-2 bg-gray-50">
                <input 
                  type="color" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)} 
                  className="size-8 rounded-lg border-0 cursor-pointer overflow-hidden"
                />
                <span className="text-xs font-mono font-bold uppercase text-gray-700">{primaryColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Secondary Palette</label>
              <div className="flex items-center gap-2 border border-gray-100 rounded-xl p-2 bg-gray-50">
                <input 
                  type="color" 
                  value={secondaryColor} 
                  onChange={(e) => setSecondaryColor(e.target.value)} 
                  className="size-8 rounded-lg border-0 cursor-pointer overflow-hidden"
                />
                <span className="text-xs font-mono font-bold uppercase text-gray-700">{secondaryColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Accent Palette</label>
              <div className="flex items-center gap-2 border border-gray-100 rounded-xl p-2 bg-gray-50">
                <input 
                  type="color" 
                  value={accentColor} 
                  onChange={(e) => setAccentColor(e.target.value)} 
                  className="size-8 rounded-lg border-0 cursor-pointer overflow-hidden"
                />
                <span className="text-xs font-mono font-bold uppercase text-gray-700">{accentColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-gray-500">Custom Tagline / Slogan</label>
            <input 
              type="text" 
              value={tagline} 
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Savor the experience with us."
              className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-gray-700 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Website</label>
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-gray-700 font-semibold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-gray-700 font-semibold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Email</label>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" className="w-full px-4 py-2.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white text-gray-700 font-semibold" />
            </div>
          </div>

          <div className="border-t border-gray-50 pt-5 flex justify-end gap-3">
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold h-11 px-6 gap-2"
            >
              <Save size={16} />
              {saveMutation.isPending ? 'Customizing...' : 'Save Settings Override'}
            </Button>
          </div>
        </form>
      </div>

      {/* Brand Profile Overview preview card (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between h-[360px]">
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/40 to-slate-900/10 pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              Branding Profile Output
            </span>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="size-12 object-contain rounded-xl bg-white/5 p-1 border border-white/10" />
              ) : (
                <div style={{ backgroundColor: primaryColor }} className="size-12 rounded-xl flex items-center justify-center font-bold text-white text-lg">
                  {profile?.name?.charAt(0) || 'V'}
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-lg leading-tight">{profile?.name || 'My Business'}</h4>
                <p className="text-xs text-slate-400 font-semibold italic">{tagline || 'No tagline custom configured yet'}</p>
              </div>
            </div>
          </div>

          {/* Color Palettes previews */}
          <div className="space-y-4 relative z-10 border-t border-white/10 pt-6">
            <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Design Palettes</h5>
            <div className="flex items-center gap-3">
              {[
                { name: 'Primary', color: primaryColor },
                { name: 'Secondary', color: secondaryColor },
                { name: 'Accent', color: accentColor },
              ].map((pal) => (
                <div key={pal.name} className="flex-1 space-y-1.5 text-center">
                  <div 
                    style={{ backgroundColor: pal.color }}
                    className="h-10 rounded-xl border border-white/10 shadow-inner" 
                  />
                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block">{pal.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PRD §137: Sample QR Asset in brand preview */}
          <div className="relative z-10 space-y-2">
            <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Sample QR Asset</h5>
            <div style={{ backgroundColor: primaryColor }} className="flex items-center gap-3 p-3 rounded-xl">
              <div className="bg-white p-1.5 rounded-lg shrink-0">
                <QRCodeSVG value="https://vemtap.com/s/demo" size={40} fgColor={secondaryColor} bgColor="#FFFFFF" />
              </div>
              <div className="text-[10px] leading-relaxed">
                <p className="font-bold text-white" style={{ color: 'rgba(255,255,255,0.95)' }}>{profile?.name || 'My Business'} — Scan to Connect</p>
                <p className="text-white/60">QR marketing card preview</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 border-t border-white/10 pt-4 text-[10px] text-slate-400 font-bold flex items-center gap-2">
            <AlertCircle size={12} className="text-slate-400" />
            <span>These overrides will apply to print-ready materials only.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
