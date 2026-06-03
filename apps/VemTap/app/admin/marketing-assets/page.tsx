"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Image as ImageIcon, Sparkles, Plus, AlertCircle, TrendingUp, History, Award, Download, Tags } from 'lucide-react';
import Link from 'next/link';
import { useMarketingTemplates, useMockups, useAIPrompts, useMarketingAssets, useDownloadsLog, useMarketingCategories } from '@/services/marketing-assets/hooks';
import { Button } from '@/components/ui/button';
import RewardStatCard from '@/components/loyalty/RewardStatCard';

export default function AdminMarketingOverviewPage() {
  const { data: templates } = useMarketingTemplates(undefined, undefined, true);
  const { data: mockups } = useMockups(undefined, true);
  const { data: prompts } = useAIPrompts();
  const { data: assets } = useMarketingAssets();
  const { data: downloads } = useDownloadsLog();
  const { data: categories } = useMarketingCategories(true);

  return (
    <div className="space-y-8 pb-10">
      
      {/* PRD §47.1: Overview Cards — Total Templates, Assets, Downloads, Scans, Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        <RewardStatCard
          label="Design Templates"
          value={templates ? templates.length.toString() : '...'}
          icon={Layers}
          color="blue"
        />
        <RewardStatCard
          label="Total Assets Generated"
          value={assets ? assets.length.toString() : '...'}
          icon={Award}
          color="indigo"
        />
        <RewardStatCard
          label="Total Downloads"
          value={downloads ? downloads.length.toString() : '...'}
          icon={Download}
          color="green"
        />
        <RewardStatCard
          label="Active Categories"
          value={categories ? categories.filter(c => c.isActive).length.toString() : '...'}
          icon={Tags}
          color="amber"
        />
        <RewardStatCard
          label="Mockup Backdrops"
          value={mockups ? mockups.length.toString() : '...'}
          icon={ImageIcon}
          color="purple"
        />
        <RewardStatCard
          label="AI Prompts Presets"
          value={prompts ? prompts.length.toString() : '...'}
          icon={Sparkles}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left Column: Quick Config Actions */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Template Builder Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/admin/marketing-assets/templates/create" className="flex">
                <Button className="w-full h-auto py-6 flex-col gap-3 rounded-2xl bg-primary hover:bg-primary/95 text-white border-none shadow-lg shadow-primary/10 transition-all hover:scale-[1.02]">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Plus size={20} className="stroke-[3px]" />
                  </div>
                  <span className="font-bold text-sm">Create Base Template</span>
                </Button>
              </Link>
              <Link href="/admin/marketing-assets/mockups" className="flex">
                <Button variant="outline" className="w-full h-auto py-6 flex-col gap-3 rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <ImageIcon size={20} />
                  </div>
                  <span className="font-bold text-sm">Mockup Presets</span>
                </Button>
              </Link>
              <Link href="/admin/marketing-assets/ai-prompts" className="flex">
                <Button variant="outline" className="w-full h-auto py-6 flex-col gap-3 rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Sparkles size={20} />
                  </div>
                  <span className="font-bold text-sm">AI Prompts Presets</span>
                </Button>
              </Link>
            </div>
          </section>

          {/* System status details */}
          <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
              <History className="text-gray-500" />
              Recent System Presets
            </h3>
            
            <div className="space-y-4">
              {templates?.slice(0, 3).map((template) => (
                <div key={template.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                      {template.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-400 capitalize">{template.category} • {template.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <Link href={`/admin/marketing-assets/templates/${template.id}`}>
                    <Button variant="ghost" className="text-primary font-bold text-xs gap-1.5 bg-primary/5 rounded-xl hover:bg-primary/10">
                      Builder Workspace
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Platform Configuration status */}
        <div className="space-y-6">
          <section className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-md font-extrabold flex items-center gap-2">
              <AlertCircle className="text-primary size-5" />
              Sudo Rules
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              The self-service marketing module is active for all business levels (Free, Pro, Ultimate).
              <br /><br />
              Any new design layout configurations registered by admin will be immediately available in the business design workspace.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
