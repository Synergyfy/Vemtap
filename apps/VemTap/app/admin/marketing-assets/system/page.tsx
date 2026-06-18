"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Settings, 
  Shield, 
  ClipboardList, 
  Users,
  Download,
  ArrowRight,
  Lock,
  History
} from 'lucide-react';

// Consolidating Global Settings, Brand Rules, Audit Logs, Permissions, and Downloads
import AdminMarketingSettingsPage from '../settings/page';
import AdminBrandRulesPage from '../brand-rules/page';
import AdminAuditLogsPage from '../audit-logs/page';
import AdminPermissionsPage from '../permissions/page';
import AdminDownloadsPage from '../downloads/page';

const SECTIONS = [
  { id: 'settings', label: 'Global Settings', icon: Settings, desc: 'System Toggles' },
  { id: 'brand', label: 'Brand Safety Rules', icon: Shield, desc: 'Quality Guardrails' },
  { id: 'audit', label: 'Audit Trail', icon: ClipboardList, desc: 'Activity Logs' },
  { id: 'permissions', label: 'Access Control', icon: Users, desc: 'Role Management' },
  { id: 'downloads', label: 'Export History', icon: Download, desc: 'File Monitoring' }
];

export default function SystemGuardrailsFlowPage() {
  const [activeSection, setActiveSection] = useState('settings');

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
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-6 ml-1">System Navigator</h3>
            
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
             <div className="absolute top-0 left-0 w-full h-1 bg-primary/30" />
             <div className="relative z-10 space-y-4">
                <div className="bg-primary/20 w-fit p-2 rounded-xl">
                   <Lock size={16} className="text-primary" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider">Root Override Active</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Administrative changes in this flow bypass standard business logic. Proceed with millimeter-perfect caution.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-24 pb-40">
        
        {/* Section 1: Global Settings */}
        <section id="settings" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8">
             <div className="size-10 bg-slate-900 text-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/5">
                <Settings size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Global System Settings</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Screen 14 • Core Toggles</p>
             </div>
          </div>
          <AdminMarketingSettingsPage />
        </section>

        {/* Section 2: Brand Rules */}
        <section id="brand" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Shield size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Brand Safety Guardrails</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Legacy Module • Consistency</p>
             </div>
          </div>
          <AdminBrandRulesPage />
        </section>

        {/* Section 3: Audit trail */}
        <section id="audit" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <ClipboardList size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Platform Audit Trail</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Internal Ops • Accountability</p>
             </div>
          </div>
          <AdminAuditLogsPage />
        </section>

        {/* Section 4: Permissions */}
        <section id="permissions" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Users size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Administrative Access</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Role Engine • Security</p>
             </div>
          </div>
          <AdminPermissionsPage />
        </section>

        {/* Section 5: Downloads */}
        <section id="downloads" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3 mb-8 pt-10 border-t border-gray-100">
             <div className="size-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <Download size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-gray-900">Asset Export Monitor</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">File Traffic • Logging</p>
             </div>
          </div>
          <AdminDownloadsPage />
        </section>

      </div>
    </div>
  );
}
