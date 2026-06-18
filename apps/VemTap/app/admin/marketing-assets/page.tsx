"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  ImageIcon, 
  Sparkles, 
  BarChart2, 
  Tags, 
  QrCode, 
  UserCheck, 
  ChevronRight, 
  ClipboardList, 
  FileText, 
  MapPin, 
  Zap, 
  Users,
  Settings,
  Shield,
  Download,
  Factory,
  Database,
  Brain,
  Terminal,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useAnalyticsOverview } from '@/services/marketing-assets/hooks';
import RewardStatCard from '@/components/loyalty/RewardStatCard';

export default function MarketingControlCenterPage() {
  const { data: analytics } = useAnalyticsOverview();

  const zones = [
    {
      id: 'factory',
      title: 'Design Factory',
      desc: 'Define the physical DNA, formats, and premium styles for all assets.',
      icon: Factory,
      color: 'blue',
      href: '/admin/marketing-assets/factory',
      stats: 'Asset Types • Print Formats • Styles',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-100'
    },
    {
      id: 'library',
      title: 'Asset Library',
      desc: 'Manage reusable building blocks: Templates, CTAs, and QR Destinations.',
      icon: Database,
      color: 'indigo',
      href: '/admin/marketing-assets/library',
      stats: 'Templates • CTAs • Destinations',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-100'
    },
    {
      id: 'intelligence',
      title: 'Intelligence Hub',
      desc: 'Observe platform health and configure smart suggestion logic.',
      icon: Brain,
      color: 'purple',
      href: '/admin/marketing-assets/intelligence',
      stats: 'Analytics • Monitoring • Rules',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-100'
    },
    {
      id: 'system',
      title: 'System Guardrails',
      desc: 'Global configurations, brand safety rules, and administrative logs.',
      icon: Terminal,
      color: 'slate',
      href: '/admin/marketing-assets/system',
      stats: 'Settings • Brand Rules • Logs',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-200'
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Platform Overview</h2>
          <p className="text-gray-500 font-medium max-w-2xl">
            Welcome to the centralized marketing engine. Monitor performance across the network and configure the base parameters for the self-service design workspace.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-2">
              <div className="size-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Network Live</span>
           </div>
           <div className="px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-2">
              <Sparkles className="text-blue-500 size-3" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">v2.4 Core</span>
           </div>
        </div>
      </div>

      {/* Global Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <RewardStatCard
          label="Total QR Scans"
          value={analytics?.totals.scans?.toLocaleString() || '0'}
          icon={QrCode}
          color="blue"
        />
        <RewardStatCard
          label="Customer Captures"
          value={analytics?.totals.views?.toLocaleString() || '0'}
          icon={UserCheck}
          color="green"
        />
        <RewardStatCard
          label="Total Downloads"
          value={analytics?.totals.downloads?.toLocaleString() || '0'}
          icon={Download}
          color="amber"
        />
        <RewardStatCard
          label="Avg Conversion"
          value={`${analytics?.totals.conversionRate || 0}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Main Flow Zones Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[3px]">Workspace Flows</h3>
           <div className="h-[1px] bg-gray-100 flex-1" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {zones.map((zone, i) => (
            <Link key={zone.id} href={zone.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer overflow-hidden h-full flex flex-col justify-between"
              >
                {/* Decorative Background Icon */}
                <zone.icon className="absolute -bottom-10 -right-10 size-48 text-gray-50/50 group-hover:text-primary/5 transition-colors duration-500 -rotate-12" />
                
                <div className="relative z-10 space-y-6">
                  <div className={`${zone.bgColor} ${zone.textColor} size-16 rounded-[24px] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                    <zone.icon size={32} />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors">{zone.title}</h4>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      {zone.desc}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 mt-10 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${zone.textColor}`}>
                      {zone.stats}
                    </span>
                  </div>
                  <div className="bg-gray-900 text-white size-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-500 shadow-lg">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-slate-900 rounded-[40px] p-10 md:p-12 relative overflow-hidden text-white shadow-2xl">
         <div className="absolute top-0 right-0 size-96 bg-primary/20 rounded-full blur-[120px] -mr-48 -mt-48" />
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
               <div className="bg-primary/20 w-fit p-3 rounded-2xl">
                  <Shield size={24} className="text-primary" />
               </div>
               <h4 className="text-2xl md:text-3xl font-black leading-tight">Administrative Configuration Policy</h4>
               <p className="text-slate-400 font-medium leading-relaxed">
                 Settings applied in this command center affect the entire Vemtap network globally. Ensure all base templates and formats meet the required physical print standards (millimeter precision) before activation.
               </p>
               <div className="flex items-center gap-6">
                  <div className="space-y-1">
                     <div className="text-xs font-black text-white uppercase tracking-wider">Last Audit</div>
                     <div className="text-[10px] text-slate-500 font-bold">2 hours ago by System</div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-xs font-black text-white uppercase tracking-wider">Active Assets</div>
                     <div className="text-[10px] text-slate-500 font-bold">14,204 across all hubs</div>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: 'Security', val: 'Active' },
                 { label: 'Latency', val: '24ms' },
                 { label: 'Uptime', val: '99.9%' },
                 { label: 'Nodes', val: 'Active' }
               ].map((item) => (
                 <div key={item.label} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className="text-lg font-black text-white">{item.val}</div>
                 </div>
               ))}
            </div>
         </div>
      </div>

    </div>
  );
}
