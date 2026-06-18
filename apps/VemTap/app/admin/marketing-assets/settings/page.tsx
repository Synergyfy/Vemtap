"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMarketingSettings, useUpsertMarketingSetting } from '@/services/marketing-assets/hooks';
import { Settings, Save, Shield, BarChart2, Sparkles, MapPin, Zap, AlertCircle, CheckCircle2, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';

export default function AdminMarketingSettingsPage() {
  const { data: settings, isLoading } = useMarketingSettings();
  const upsertMutation = useUpsertMarketingSetting();

  // Local state for specific toggles requested in VEMTAP-ADMIN-FLOW.md Screen 14
  const [globalTracking, setGlobalTracking] = useState(true);
  const [showPlacementGuides, setShowPlacementGuides] = useState(true);
  const [enableRecommendations, setEnableRecommendations] = useState(true);
  const [aiContentGeneration, setAiContentGeneration] = useState(true);
  const [maintenanceMode, setAiMaintenanceMode] = useState(false);

  useEffect(() => {
    if (settings) {
      const getVal = (key: string, def: boolean) => {
        const s = settings.find(i => i.key === key);
        return s ? s.value === 'true' : def;
      };
      setGlobalTracking(getVal('enable_tracking', true));
      setShowPlacementGuides(getVal('show_guides', true));
      setEnableRecommendations(getVal('enable_recommendations', true));
      setAiContentGeneration(getVal('enable_ai', true));
      setAiMaintenanceMode(getVal('marketing_maintenance', false));
    }
  }, [settings]);

  const handleToggle = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      await upsertMutation.mutateAsync({ key, value: value.toString() });
      toast.success('System setting updated');
    } catch (e) {
      toast.error('Failed to sync setting');
      setter(!value); // revert on error
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="bg-primary/10 p-3 rounded-2xl">
             <Settings className="text-primary size-6" />
           </div>
           <div>
             <h3 className="text-xl font-black text-gray-900">Global Marketing Settings</h3>
             <p className="text-xs text-gray-400 font-medium">Control system-wide behaviors for all businesses.</p>
           </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
           <div className="size-2 bg-green-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">Live Config</span>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Analytics & Tracking */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
            <BarChart2 size={18} className="text-blue-500" />
            <h4 className="font-extrabold text-gray-800 text-sm">Analytics & Tracking</h4>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black text-gray-900">Global Scan Tracking</div>
              <div className="text-[10px] text-gray-400 leading-relaxed font-medium">Enable real-time attribution for all QR scans.</div>
            </div>
            <Switch 
              checked={globalTracking} 
              onCheckedChange={(v) => handleToggle('enable_tracking', v, setGlobalTracking)} 
            />
          </div>

          <div className="bg-blue-50/50 p-4 rounded-2xl flex items-start gap-3">
             <Info className="text-blue-400 size-4 mt-0.5" />
             <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
               Tracking data is anonymized per Vemtap privacy standards before appearing in business dashboards.
             </p>
          </div>
        </motion.div>

        {/* Intelligence & Recommendations */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
            <Sparkles size={18} className="text-amber-500" />
            <h4 className="font-extrabold text-gray-800 text-sm">Intelligence Engine</h4>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black text-gray-900">Enable Recommendations</div>
              <div className="text-[10px] text-gray-400 leading-relaxed font-medium">Show suggested assets based on business activity.</div>
            </div>
            <Switch 
              checked={enableRecommendations} 
              onCheckedChange={(v) => handleToggle('enable_recommendations', v, setEnableRecommendations)} 
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black text-gray-900">AI Content Assistance</div>
              <div className="text-[10px] text-gray-400 leading-relaxed font-medium">Allow businesses to use AI prompts for copy.</div>
            </div>
            <Switch 
              checked={aiContentGeneration} 
              onCheckedChange={(v) => handleToggle('enable_ai', v, setAiContentGeneration)} 
            />
          </div>
        </motion.div>

        {/* Instructional Content */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-2 border-b border-gray-50 pb-4">
            <MapPin size={18} className="text-green-500" />
            <h4 className="font-extrabold text-gray-800 text-sm">User Guidance</h4>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black text-gray-900">Show Placement Guides</div>
              <div className="text-[10px] text-gray-400 leading-relaxed font-medium">Display instructional maps for asset types.</div>
            </div>
            <Switch 
              checked={showPlacementGuides} 
              onCheckedChange={(v) => handleToggle('show_guides', v, setShowPlacementGuides)} 
            />
          </div>
        </motion.div>

        {/* System & Maintenance */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
        >
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Shield size={18} className="text-primary" />
            <h4 className="font-extrabold text-white text-sm">System Ops</h4>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-black text-white">Marketing Maintenance</div>
              <div className="text-[10px] text-slate-400 leading-relaxed font-medium">Temporarily disable asset creation for users.</div>
            </div>
            <Switch 
              checked={maintenanceMode} 
              onCheckedChange={(v) => handleToggle('marketing_maintenance', v, setAiMaintenanceMode)} 
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center gap-2 text-primary">
             <AlertCircle size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest">Sudo Overrides Enabled</span>
          </div>
        </motion.div>

      </div>

      {/* Audit Note */}
      <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[2px]">
        All changes are logged in the System Audit Trail
      </div>

    </div>
  );
}

// Helper Info Component (not really needed since we used raw icons but keeps it clean)
function Info({ className, size }: { className?: string; size?: number }) {
  return <AlertCircle className={className} size={size} />;
}
