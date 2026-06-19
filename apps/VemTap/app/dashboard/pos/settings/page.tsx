'use client';

import React, { useState } from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Store, Receipt, Barcode, Calculator, Bell, Save, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'business' | 'receipt' | 'tax' | 'notifications';

export default function POSSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  const [saved, setSaved] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'business', label: 'Business Info', icon: Store },
    { id: 'receipt', label: 'Receipt', icon: Receipt },
    { id: 'tax', label: 'Tax & Pricing', icon: Calculator },
    { id: 'notifications', label: 'Alerts', icon: Bell },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="POS Settings"
        subtitle="Configure your retail operations"
        actions={
          <button
            onClick={handleSave}
            className={cn(
              "h-10 md:h-12 px-6 rounded-2xl flex items-center gap-2 transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest",
              saved
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-[#066CF4] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600"
            )}
          >
            <Save size={16} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        }
      />

      {/* Tab Bar */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0",
              activeTab === tab.id
                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        {activeTab === 'business' && <BusinessInfoSettings />}
        {activeTab === 'receipt' && <ReceiptSettings />}
        {activeTab === 'tax' && <TaxSettings />}
        {activeTab === 'notifications' && <AlertSettings />}
      </div>
    </div>
  );
}

function SettingsField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 py-6 px-6 border-b border-gray-100 last:border-b-0">
      <div className="md:w-1/3 shrink-0">
        <p className="text-sm font-black text-gray-900">{label}</p>
        {description && <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">{description}</p>}
      </div>
      <div className="md:w-2/3">{children}</div>
    </div>
  );
}

function BusinessInfoSettings() {
  return (
    <div>
      <SettingsField label="Business Name" description="Appears on receipts and reports">
        <input type="text" defaultValue="VemTap Retail Store" className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" />
      </SettingsField>
      <SettingsField label="Business Address" description="Shown on printed receipts">
        <textarea defaultValue="123 Lagos Rd, Victoria Island, Lagos" rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 resize-none" />
      </SettingsField>
      <SettingsField label="Phone Number">
        <input type="tel" defaultValue="+234 800 000 0000" className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" />
      </SettingsField>
      <SettingsField label="Currency" description="Default currency for all transactions">
        <select defaultValue="NGN" className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] bg-white">
          <option value="NGN">₦ Nigerian Naira (NGN)</option>
          <option value="USD">$ US Dollar (USD)</option>
          <option value="GBP">£ British Pound (GBP)</option>
          <option value="EUR">€ Euro (EUR)</option>
        </select>
      </SettingsField>
    </div>
  );
}

function ReceiptSettings() {
  return (
    <div>
      <SettingsField label="Receipt Header" description="Custom text at the top of every receipt">
        <input type="text" defaultValue="Thank you for shopping with us!" className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" />
      </SettingsField>
      <SettingsField label="Receipt Footer" description="Shown at the bottom of every receipt">
        <input type="text" defaultValue="No returns after 7 days. Receipt required." className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" />
      </SettingsField>
      <SettingsField label="Auto-Print Receipt" description="Automatically print after each sale">
        <ToggleSwitch defaultChecked={false} />
      </SettingsField>
      <SettingsField label="Show Business Logo" description="Display your logo on digital receipts">
        <ToggleSwitch defaultChecked={true} />
      </SettingsField>
    </div>
  );
}

function TaxSettings() {
  return (
    <div>
      <SettingsField label="Enable Tax" description="Apply tax to all transactions">
        <ToggleSwitch defaultChecked={false} />
      </SettingsField>
      <SettingsField label="Tax Rate (%)" description="Default tax percentage applied to products">
        <input type="number" defaultValue="7.5" className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" />
      </SettingsField>
      <SettingsField label="Tax Label" description="How tax is labeled on receipts">
        <input type="text" defaultValue="VAT" className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" />
      </SettingsField>
      <SettingsField label="Prices Include Tax" description="Whether listed prices already include tax">
        <ToggleSwitch defaultChecked={true} />
      </SettingsField>
    </div>
  );
}

function AlertSettings() {
  return (
    <div>
      <SettingsField label="Low Stock Alerts" description="Get notified when products drop below minimum">
        <ToggleSwitch defaultChecked={true} />
      </SettingsField>
      <SettingsField label="Daily Sales Summary" description="Receive end-of-day revenue report">
        <ToggleSwitch defaultChecked={true} />
      </SettingsField>
      <SettingsField label="New Order Alert" description="Notify when a new order is placed">
        <ToggleSwitch defaultChecked={false} />
      </SettingsField>
      <SettingsField label="Staff Activity Alerts" description="Notify on refunds, voids, and drawer openings">
        <ToggleSwitch defaultChecked={false} />
      </SettingsField>
    </div>
  );
}

function ToggleSwitch({ defaultChecked }: { defaultChecked: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn(
        "w-12 h-7 rounded-full transition-colors relative shrink-0",
        on ? "bg-[#066CF4]" : "bg-gray-200"
      )}
    >
      <div className={cn(
        "size-5 bg-white rounded-full shadow absolute top-1 transition-all",
        on ? "left-6" : "left-1"
      )} />
    </button>
  );
}
