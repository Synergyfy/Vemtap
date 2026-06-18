"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Layers, 
  ClipboardList, 
  FileText, 
  ImageIcon,
  ArrowRight,
  Plus,
  Box,
  Library
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Consolidating Template list, CTAs, Destinations, and Mockups
import AdminTemplatesPage from '../templates/page';
import AdminCTALibraryPage from '../cta-library/page';
import AdminQRDestinationsPage from '../qr-destinations/page';
import AdminMockupsPage from '../mockups/page';

const SECTIONS = [
  { id: 'templates', label: 'Design Templates', icon: Layers, desc: 'Base Layout Presets' },
  { id: 'ctas', label: 'CTA Library', icon: ClipboardList, desc: 'Reusable Labels' },
  { id: 'destinations', label: 'QR Destinations', icon: FileText, desc: 'Routing Control' },
  { id: 'mockups', label: 'Mockup Presets', icon: ImageIcon, desc: 'Scene Renderers' }
];

export default function AssetLibraryFlowPage() {
  const [activeSection, setActiveSection] = useState('templates');

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
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-6 ml-1">Library Navigator</h3>
            
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

          <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm text-center space-y-4">
             <div className="bg-primary/10 size-12 rounded-2xl flex items-center justify-center mx-auto">
                <Box size={24} className="text-primary" />
             </div>
             <h4 className="text-sm font-black text-gray-900 leading-tight">Fast-Build Workspace</h4>
             <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
               Need a new base preset? Jump directly to the sudo builder.
             </p>
             <Link href="/admin/marketing-assets/templates/create" className="block w-full">
               <Button className="w-full bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider py-5 shadow-lg shadow-gray-200">
                  <Plus size={14} className="mr-1 stroke-[3px]" /> New Template
               </Button>
             </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-24 pb-40">
        
        {/* Section 1: Design Templates */}
        <section id="templates" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8">
             <div className="size-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Layers size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Design Templates</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Screen 4 • Layout Engine</p>
             </div>
          </div>
          <AdminTemplatesPage />
        </section>

        {/* Section 2: CTA Library */}
        <section id="ctas" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <ClipboardList size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Call-To-Action Library</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Screen 5 • Vocabulary</p>
             </div>
          </div>
          <AdminCTALibraryPage />
        </section>

        {/* Section 3: QR Destinations */}
        <section id="destinations" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <FileText size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">QR Code Destinations</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Screen 6 • Routing Engine</p>
             </div>
          </div>
          <AdminQRDestinationsPage />
        </section>

        {/* Section 4: Mockup Presets */}
        <section id="mockups" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <ImageIcon size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Photorealistic Mockups</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Legacy Module • Visualizer</p>
             </div>
          </div>
          <AdminMockupsPage />
        </section>

      </div>
    </div>
  );
}
