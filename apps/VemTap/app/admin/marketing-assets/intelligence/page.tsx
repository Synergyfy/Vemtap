"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  BarChart2, 
  Users, 
  Sparkles, 
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  Lightbulb
} from 'lucide-react';

// Consolidating Analytics, Business Monitor, Recommendations, and AI Prompts
import AdminAnalyticsPage from '../analytics/page';
import AdminGeneratedAssetsPage from '../generated-assets/page';
import AdminRecommendationsPage from '../recommendations/page';
import AdminAIPromptsPage from '../ai-prompts/page';

const SECTIONS = [
  { id: 'analytics', label: 'Platform Analytics', icon: BarChart2, desc: 'Network Performance' },
  { id: 'monitor', label: 'Business Monitor', icon: Users, desc: 'Usage & Attribution' },
  { id: 'rules', label: 'Smart Recommendations', icon: Zap, desc: 'Suggestion Logic' },
  { id: 'ai', label: 'AI Prompt Library', icon: Sparkles, desc: 'Copywriter Presets' }
];

export default function IntelligenceHubFlowPage() {
  const [activeSection, setActiveSection] = useState('analytics');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 relative">
      
      {/* Sticky Side Navigation */}
      <div className="lg:w-72 shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-6 ml-1">Intelligence Navigator</h3>
            
            <nav className="space-y-2">
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all group ${
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <section.icon size={18} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'} />
                    <div>
                      <div className="text-xs font-black leading-none">{section.label}</div>
                      <div className={`text-[9px] font-bold mt-1 opacity-70 ${isActive ? 'text-white' : 'text-gray-400'}`}>{section.desc}</div>
                    </div>
                    {isActive && <ArrowRight size={14} className="ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 space-y-4">
             <div className="bg-amber-100 size-10 rounded-xl flex items-center justify-center">
                <Lightbulb size={20} className="text-amber-600" />
             </div>
             <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Logic Optimization</h4>
             <p className="text-[10px] text-amber-700 leading-relaxed font-bold">
               Refine recommendation rules based on high-performing business patterns observed in the analytics dashboard.
             </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-24 pb-40">
        
        {/* Section 1: Platform Analytics */}
        <section id="analytics" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8">
             <div className="size-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <BarChart2 size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Platform Analytics</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Screen 8 • Performance</p>
             </div>
          </div>
          <AdminAnalyticsPage />
        </section>

        {/* Section 2: Business Monitor */}
        <section id="monitor" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <Users size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Business Usage Monitor</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Screen 12 • Attribution</p>
             </div>
          </div>
          <AdminGeneratedAssetsPage />
        </section>

        {/* Section 3: Recommendation Rules */}
        <section id="rules" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Zap size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Smart Logic Builder</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Screen 10 • Suggestion Engine</p>
             </div>
          </div>
          <AdminRecommendationsPage />
        </section>

        {/* Section 4: AI Prompts */}
        <section id="ai" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <Sparkles size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Copywriter AI Library</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Legacy Module • AI Context</p>
             </div>
          </div>
          <AdminAIPromptsPage />
        </section>

      </div>
    </div>
  );
}
