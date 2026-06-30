'use client';

import React, { useState } from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Store, Receipt, Calculator, Bell, Save, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePosSettingsStore } from '@/store/usePosSettingsStore';

type SettingsTab = 'business' | 'receipt' | 'tax' | 'notifications' | 'loyalty';

export default function POSSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  const [saved, setSaved] = useState(false);

  const settings = usePosSettingsStore();
  const [localSettings, setLocalSettings] = useState({
    businessName: '',
    businessAddress: '',
    phoneNumber: '',
    currency: 'NGN',
    receiptHeader: '',
    receiptFooter: '',
    autoPrintReceipt: false,
    showLogo: true,
    taxEnabled: false,
    taxRate: 7.5,
    taxLabel: 'VAT',
    pricesIncludeTax: true,
    lowStockAlerts: true,
    dailySalesSummary: true,
    newOrderAlert: false,
    staffActivityAlerts: false,
    loyaltyEnabled: false,
    loyaltyRedeemThreshold: 100,
  });

  React.useEffect(() => {
    setLocalSettings({
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      phoneNumber: settings.phoneNumber,
      currency: settings.currency,
      receiptHeader: settings.receiptHeader,
      receiptFooter: settings.receiptFooter,
      autoPrintReceipt: settings.autoPrintReceipt,
      showLogo: settings.showLogo,
      taxEnabled: settings.taxEnabled,
      taxRate: settings.taxRate,
      taxLabel: settings.taxLabel,
      pricesIncludeTax: settings.pricesIncludeTax,
      lowStockAlerts: settings.lowStockAlerts,
      dailySalesSummary: settings.dailySalesSummary,
      newOrderAlert: settings.newOrderAlert,
      staffActivityAlerts: settings.staffActivityAlerts,
      loyaltyEnabled: settings.loyaltyEnabled,
      loyaltyRedeemThreshold: settings.loyaltyRedeemThreshold,
    });
  }, [settings]);

  const updateField = (field: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'business', label: 'Business Info', icon: Store },
    { id: 'receipt', label: 'Receipt', icon: Receipt },
    { id: 'tax', label: 'Tax & Pricing', icon: Calculator },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'loyalty', label: 'Loyalty', icon: Coins },
  ];

  const handleSave = () => {
    settings.updateSettings(localSettings);
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
        {activeTab === 'business' && <BusinessInfoSettings values={localSettings} onChange={updateField} />}
        {activeTab === 'receipt' && <ReceiptSettings values={localSettings} onChange={updateField} />}
        {activeTab === 'tax' && <TaxSettings values={localSettings} onChange={updateField} />}
        {activeTab === 'notifications' && <AlertSettings values={localSettings} onChange={updateField} />}
        {activeTab === 'loyalty' && <LoyaltySettings values={localSettings} onChange={updateField} />}
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

interface SettingsProps {
  values: any;
  onChange: (field: string, value: any) => void;
}

function BusinessInfoSettings({ values, onChange }: SettingsProps) {
  return (
    <div>
      <SettingsField label="Business Name" description="Appears on receipts and reports">
        <input 
          type="text" 
          value={values.businessName} 
          onChange={(e) => onChange('businessName', e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" 
        />
      </SettingsField>
      <SettingsField label="Business Address" description="Shown on printed receipts">
        <textarea 
          value={values.businessAddress} 
          onChange={(e) => onChange('businessAddress', e.target.value)}
          rows={2} 
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 resize-none" 
        />
      </SettingsField>
      <SettingsField label="Phone Number">
        <input 
          type="tel" 
          value={values.phoneNumber} 
          onChange={(e) => onChange('phoneNumber', e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" 
        />
      </SettingsField>
      <SettingsField label="Currency" description="Default currency for all transactions">
        <select 
          value={values.currency} 
          onChange={(e) => onChange('currency', e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] bg-white"
        >
          <option value="NGN">₦ Nigerian Naira (NGN)</option>
          <option value="USD">$ US Dollar (USD)</option>
          <option value="GBP">£ British Pound (GBP)</option>
          <option value="EUR">€ Euro (EUR)</option>
        </select>
      </SettingsField>
    </div>
  );
}

function ReceiptSettings({ values, onChange }: SettingsProps) {
  return (
    <div>
      <SettingsField label="Receipt Header" description="Custom text at the top of every receipt">
        <input 
          type="text" 
          value={values.receiptHeader} 
          onChange={(e) => onChange('receiptHeader', e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" 
        />
      </SettingsField>
      <SettingsField label="Receipt Footer" description="Shown at the bottom of every receipt">
        <input 
          type="text" 
          value={values.receiptFooter} 
          onChange={(e) => onChange('receiptFooter', e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" 
        />
      </SettingsField>
      <SettingsField label="Auto-Print Receipt" description="Automatically print after each sale">
        <ToggleSwitch checked={values.autoPrintReceipt} onChange={(val) => onChange('autoPrintReceipt', val)} />
      </SettingsField>
      <SettingsField label="Show Business Logo" description="Display your logo on digital receipts">
        <ToggleSwitch checked={values.showLogo} onChange={(val) => onChange('showLogo', val)} />
      </SettingsField>
    </div>
  );
}

function TaxSettings({ values, onChange }: SettingsProps) {
  return (
    <div>
      <SettingsField label="Enable Tax" description="Apply tax to all transactions">
        <ToggleSwitch checked={values.taxEnabled} onChange={(val) => onChange('taxEnabled', val)} />
      </SettingsField>
      <SettingsField label="Tax Rate (%)" description="Default tax percentage applied to products">
        <input 
          type="number" 
          value={values.taxRate} 
          onChange={(e) => onChange('taxRate', parseFloat(e.target.value) || 0)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" 
        />
      </SettingsField>
      <SettingsField label="Tax Label" description="How tax is labeled on receipts">
        <input 
          type="text" 
          value={values.taxLabel} 
          onChange={(e) => onChange('taxLabel', e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10" 
        />
      </SettingsField>
      <SettingsField label="Prices Include Tax" description="Whether listed prices already include tax">
        <ToggleSwitch checked={values.pricesIncludeTax} onChange={(val) => onChange('pricesIncludeTax', val)} />
      </SettingsField>
    </div>
  );
}

function AlertSettings({ values, onChange }: SettingsProps) {
  return (
    <div>
      <SettingsField label="Low Stock Alerts" description="Get notified when products drop below minimum">
        <ToggleSwitch checked={values.lowStockAlerts} onChange={(val) => onChange('lowStockAlerts', val)} />
      </SettingsField>
      <SettingsField label="Daily Sales Summary" description="Receive end-of-day revenue report">
        <ToggleSwitch checked={values.dailySalesSummary} onChange={(val) => onChange('dailySalesSummary', val)} />
      </SettingsField>
      <SettingsField label="New Order Alert" description="Notify when a new order is placed">
        <ToggleSwitch checked={values.newOrderAlert} onChange={(val) => onChange('newOrderAlert', val)} />
      </SettingsField>
      <SettingsField label="Staff Activity Alerts" description="Notify on refunds, voids, and drawer openings">
        <ToggleSwitch checked={values.staffActivityAlerts} onChange={(val) => onChange('staffActivityAlerts', val)} />
      </SettingsField>
    </div>
  );
}

function LoyaltySettings({ values, onChange }: SettingsProps) {
  return (
    <div>
      <SettingsField label="Enable Loyalty Program" description="Allow cashiers to award points to customers at checkout">
        <ToggleSwitch checked={values.loyaltyEnabled} onChange={(val) => onChange('loyaltyEnabled', val)} />
      </SettingsField>
      <SettingsField label="Redemption Threshold" description="Minimum points required before a customer can redeem rewards">
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={values.loyaltyRedeemThreshold}
            onChange={(e) => onChange('loyaltyRedeemThreshold', parseInt(e.target.value) || 100)}
            min={1}
            className="w-32 h-12 px-4 rounded-xl border border-gray-200 text-sm font-bold focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
          />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">pts</span>
        </div>
      </SettingsField>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      type="button"
      className={cn(
        "w-12 h-7 rounded-full transition-colors relative shrink-0",
        checked ? "bg-[#066CF4]" : "bg-gray-200"
      )}
    >
      <div className={cn(
        "size-5 bg-white rounded-full shadow absolute top-1 transition-all",
        checked ? "left-6" : "left-1"
      )} />
    </button>
  );
}
