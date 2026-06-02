"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMarketingTemplates, useTemplateCategories } from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { QrCode, Search, Filter, Layers, ArrowRight, Sparkles, HelpCircle, Palette, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TemplateLibraryPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data: templates, isLoading } = useMarketingTemplates(
    selectedCategory === 'all' ? undefined : selectedCategory,
    selectedType === 'all' ? undefined : selectedType
  );

  const { data: categories } = useTemplateCategories();
  const { data: business } = useMyBusiness();

  // Category Auto-detection (PRD §7)
  React.useEffect(() => {
    if (business?.category && categories && categories.length > 0) {
      const bizCatName = typeof (business as any).category === 'object' ? (business as any).category.name : business.category;
      if (bizCatName) {
        const match = categories.find(
          (cat) =>
            cat.toLowerCase() === bizCatName.toLowerCase() ||
            bizCatName.toLowerCase().includes(cat.toLowerCase())
        );
        if (match) {
          setSelectedCategory(match);
        }
      }
    }
  }, [business, categories]);

  // Search filtering
  const filteredTemplates = templates
    ? templates.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const typesList = [
    { label: 'All Layouts', value: 'all' },
    { label: 'Table Tents', value: 'table_tent' },
    { label: 'Posters', value: 'poster' },
    { label: 'Business Cards', value: 'business_card' },
    { label: 'Flyers', value: 'flyer' },
  ];

  // Recommended Placement map (PRD §13)
  const PLACEMENT_MAP: Record<string, string> = {
    table_tent:        'Table Stand',
    poster_a4:         'Wall / Window (A4)',
    poster_a5:         'Counter / Desk (A5)',
    poster_a3:         'Wall / Entrance (A3)',
    social_media:      'Social Media',
    flyer:             'Handout / Flyer',
    roll_up_banner:    'Event / Entrance',
    square_acrylic:    'Counter / Reception',
    rectangle_acrylic: 'Wall / Counter',
    window_sticker:    'Window / Glass Door',
  };

  const getPlacement = (type: string) =>
    PLACEMENT_MAP[type] || PLACEMENT_MAP[Object.keys(PLACEMENT_MAP).find((k) => type.includes(k)) || ''] || 'Any Surface';

  return (
    <div className="space-y-6">
      
      {/* 🚀 Step-by-Step Educational Tutorial Guide Section (Dummy Proof) */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50/60 border border-blue-100 rounded-3xl p-3 md:p-6 space-y-2 md:space-y-4"
      >
        <div className="flex items-center gap-2 text-blue-800 font-extrabold text-[11px] md:text-base">
          <HelpCircle className="size-3.5 md:size-5 text-blue-600 animate-pulse shrink-0" />
          <span>How to create your print materials in 3 easy steps:</span>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="bg-white/80 backdrop-blur rounded-xl md:rounded-2xl p-2 md:p-4 border border-blue-100/50 space-y-0.5 md:space-y-2 text-center md:text-left">
            <div className="flex items-center gap-1.5 md:gap-2 justify-center md:justify-start">
              <span className="size-4 md:size-5 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-[8px] md:text-[10px] shrink-0">1</span>
              <span className="font-extrabold text-blue-900 text-[9px] md:text-sm leading-tight">Choose a Base Design</span>
            </div>
            <p className="leading-relaxed text-gray-500 hidden md:block text-xs">
              Pick a styled preset catalog below (like a stand-up table card or poster). These are custom configured and look professional out of the box.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl md:rounded-2xl p-2 md:p-4 border border-blue-100/50 space-y-0.5 md:space-y-2 text-center md:text-left">
            <div className="flex items-center gap-1.5 md:gap-2 justify-center md:justify-start">
              <span className="size-4 md:size-5 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-[8px] md:text-[10px] shrink-0">2</span>
              <span className="font-extrabold text-blue-900 text-[9px] md:text-sm leading-tight">Personalize in Workspace</span>
            </div>
            <p className="leading-relaxed text-gray-500 hidden md:block text-xs">
              Customize colors, fonts, or drop in your text. You can also use our AI Copywriter Helper to generate tagline suggestions with a single click.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl md:rounded-2xl p-2 md:p-4 border border-blue-100/50 space-y-0.5 md:space-y-2 text-center md:text-left">
            <div className="flex items-center gap-1.5 md:gap-2 justify-center md:justify-start">
              <span className="size-4 md:size-5 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-[8px] md:text-[10px] shrink-0">3</span>
              <span className="font-extrabold text-blue-900 text-[9px] md:text-sm leading-tight">Print or Download</span>
            </div>
            <p className="leading-relaxed text-gray-500 hidden md:block text-xs">
              Instantly save your custom design to your library, then download a print-ready vector PDF or high-resolution PNG to print locally!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium text-gray-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          {/* Category Filter — Locked for Category Detection Engine compliance (PRD §7.0) */}
          <div className="flex items-center gap-1.5 shrink-0 bg-blue-50 border border-blue-100 text-blue-700 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
            <CheckCircle2 size={13} className="text-blue-600 shrink-0" />
            <span className="capitalize">
              Industry: {selectedCategory === 'all' ? 'General' : selectedCategory}
            </span>
          </div>

          {/* Type Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
            {typesList.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedType === t.value
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 🚀 Highly Compact Templates Grid (grid-cols-2 to grid-cols-5) */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-[3/4] bg-gray-50 border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 space-y-4">
          <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
            <Layers size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900">No templates available.</h4>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTemplates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              {/* Very Compact Cover Preview (aspect-[3/4] and small padding) */}
              <div className="h-36 sm:h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-gray-50">
                {template.thumbnailUrl ? (
                  <img
                    src={template.thumbnailUrl}
                    alt={template.name}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-gray-300">
                    <QrCode size={30} className="stroke-[1.5]" />
                    <span className="text-[8px] font-extrabold uppercase tracking-wider">Hi-Fi Stand</span>
                  </div>
                )}
                
                {/* Compact Industry Category Tag */}
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/95 backdrop-blur text-[8px] font-extrabold text-gray-800 rounded-md border border-gray-100/50 uppercase">
                  {template.category}
                </span>
                
                {/* Print Format Tag */}
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-white text-[8px] font-extrabold rounded-md uppercase">
                  {template.type.replace('_', ' ')}
                </span>
              </div>

              {/* Compact details and actions */}
              <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-gray-900 group-hover:text-primary transition-colors text-xs sm:text-sm line-clamp-1 leading-tight">
                    {template.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 line-clamp-1 leading-relaxed">
                    {template.description || 'Quick customized QR printable flyer.'}
                  </p>
                  {/* Recommended Placement (PRD §13) */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[9px] font-extrabold uppercase tracking-wide border border-slate-100 mt-0.5">
                    📌 {getPlacement(template.type)}
                  </span>
                </div>

                <Link href={`/dashboard/marketing-assets/create?templateId=${template.id}`}>
                  <Button className="w-full bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-xl font-bold h-9 border-none shadow-none text-xs transition-all flex items-center justify-center gap-1.5 group-hover:bg-primary group-hover:text-white">
                    Customize
                    <ArrowRight size={12} />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
