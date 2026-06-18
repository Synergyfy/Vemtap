"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, 
  Tags, 
  Crop, 
  Palette, 
  ChevronRight, 
  Layers, 
  Info,
  Maximize,
  ArrowRight
} from 'lucide-react';

// I will import the logic from the existing screens and combine them here.
// For now, I'll build the cohesive structure and section logic.
import AdminAssetTypesPage from '../asset-types/page';
import AdminTemplateFormatsPage from '../template-formats/page';
import AdminTemplateStylesPage from '../template-styles/page';

const SECTIONS = [
  { id: 'types', label: 'Physical Asset Types', icon: Tags, desc: 'DNA & Base Shapes' },
  { id: 'formats', label: 'Print Specifications', icon: Crop, desc: 'Millimeter Precision' },
  { id: 'styles', label: 'Visual Styles', icon: Palette, desc: 'Aesthetic DNA' }
];

export default function DesignFactoryFlowPage() {
  const [activeSection, setActiveSection] = useState('types');

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
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-6 ml-1">Factory Navigator</h3>
            
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

          <div className="bg-slate-900 rounded-[32px] p-6 text-white border border-slate-800 relative overflow-hidden">
             <div className="absolute -top-10 -right-10 bg-primary/10 size-32 rounded-full blur-3xl" />
             <div className="relative z-10 space-y-4">
                <div className="bg-primary/20 w-fit p-2 rounded-xl">
                   <Maximize size={16} className="text-primary" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider">Print Accuracy Mode</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Ensure 300 DPI standards are maintained for all physical formats. Changes here affect the business "Safe Export" engine.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-24 pb-40">
        
        {/* Section 1: Asset Types */}
        <section id="types" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8">
             <div className="size-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Tags size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Physical Asset Types</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Screen 2 • Base DNA</p>
             </div>
          </div>
          <AdminAssetTypesPage />
        </section>

        {/* Section 2: Print Formats */}
        <section id="formats" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Crop size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Millimeter Print Formats</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Screen 3 • Dimension Engine</p>
             </div>
          </div>
          <AdminTemplateFormatsPage />
        </section>

        {/* Section 3: Template Styles */}
        <section id="styles" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Palette size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Visual Aesthetic DNA</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Legacy Module • Style Presets</p>
             </div>
          </div>
          <AdminTemplateStylesPage />
        </section>

      </div>
    </div>
  );
}
