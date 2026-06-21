"use client";

import React, { useState } from 'react';
import { Settings, Shield, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    enableMarketingAssets: true,
    enableDownloads: true,
    enableQrTracking: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Mock save delay
    await new Promise(r => setTimeout(r, 800));
    toast.success('Global settings saved successfully');
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 pb-20 max-w-3xl">
      
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Settings</h2>
        <p className="text-gray-500 font-medium text-sm">
          Global configuration for the Marketing Assets module. These settings apply to all businesses on the network.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <div className="size-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Global Controls</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Platform-wide toggles</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          <div className="flex items-center justify-between">
            <div className="space-y-1 pr-4">
              <label className="text-sm font-black text-gray-900 block">Enable Marketing Assets</label>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Turn the entire module on or off globally. If disabled, the business dashboard will not show the Marketing Materials section.
              </p>
            </div>
            <Switch 
              checked={settings.enableMarketingAssets} 
              onCheckedChange={() => handleToggle('enableMarketingAssets')} 
            />
          </div>
          
          <hr className="border-gray-50" />

          <div className="flex items-center justify-between">
            <div className="space-y-1 pr-4">
              <label className="text-sm font-black text-gray-900 block">Enable Downloads</label>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Allow businesses to download their assets as PNG or PDF. If disabled, they can only view them.
              </p>
            </div>
            <Switch 
              checked={settings.enableDownloads} 
              onCheckedChange={() => handleToggle('enableDownloads')} 
            />
          </div>

          <hr className="border-gray-50" />

          <div className="flex items-center justify-between">
            <div className="space-y-1 pr-4">
              <label className="text-sm font-black text-gray-900 block">Enable QR Tracking</label>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Enable analytics tracking for QR codes embedded in marketing assets.
              </p>
            </div>
            <Switch 
              checked={settings.enableQrTracking} 
              onCheckedChange={() => handleToggle('enableQrTracking')} 
            />
          </div>

        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="h-12 px-8 rounded-xl bg-gray-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
      
      {/* Warning Box */}
      <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex gap-4">
        <Shield className="text-amber-500 shrink-0 mt-1" size={24} />
        <div className="space-y-2">
          <h4 className="text-sm font-black text-amber-900">Security Notice</h4>
          <p className="text-xs text-amber-700 font-medium leading-relaxed">
            Changes to global controls take effect immediately across all active tenant connections. Disabling the module while users are active may disrupt their session.
          </p>
        </div>
      </div>

    </div>
  );
}
