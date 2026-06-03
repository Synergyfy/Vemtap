"use client";

import React, { useState, useEffect } from 'react';
import { useBrandRules, useSaveBrandRules } from '@/services/marketing-assets/hooks';
import { Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function AdminBrandRulesPage() {
  const { data: rules, isLoading } = useBrandRules();
  const saveMutation = useSaveBrandRules();

  const [logoRequired, setLogoRequired] = useState(true);
  const [primaryColorRequired, setPrimaryColorRequired] = useState(true);
  const [secondaryColorRequired, setSecondaryColorRequired] = useState(false);
  const [fontFamilyRequired, setFontFamilyRequired] = useState(false);
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [socialLinks, setSocialLinks] = useState('{}');

  useEffect(() => {
    if (rules) {
      setLogoRequired(rules.logoRequired ?? true);
      setPrimaryColorRequired(rules.primaryColorRequired ?? true);
      setSecondaryColorRequired(rules.secondaryColorRequired ?? false);
      setFontFamilyRequired(rules.fontFamilyRequired ?? false);
      setWebsite(rules.website || '');
      setPhone(rules.phone || '');
      setEmail(rules.email || '');
      setSocialLinks(rules.socialLinks ? JSON.stringify(rules.socialLinks, null, 2) : '{}');
    }
  }, [rules]);

  const handleSave = async () => {
    let parsedSocial: any = {};
    try {
      parsedSocial = socialLinks.trim() ? JSON.parse(socialLinks) : {};
    } catch {
      toast.error('Social links must be valid JSON');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        logoRequired,
        primaryColorRequired,
        secondaryColorRequired,
        fontFamilyRequired,
        website: website || undefined,
        phone: phone || undefined,
        email: email || undefined,
        socialLinks: parsedSocial,
      });
      toast.success('Brand rules saved');
    } catch {
      toast.error('Failed to save brand rules');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-primary size-5" />
            Brand Validation Rules
          </h3>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/95 text-white rounded-xl font-bold gap-2">
            <Save size={16} />
            Save Rules
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-3">Required Brand Fields</h4>
              <div className="space-y-3">
                {[
                  { label: 'Logo URL', key: 'logoRequired', val: logoRequired, set: setLogoRequired },
                  { label: 'Primary Color', key: 'primaryColorRequired', val: primaryColorRequired, set: setPrimaryColorRequired },
                  { label: 'Secondary Color', key: 'secondaryColorRequired', val: secondaryColorRequired, set: setSecondaryColorRequired },
                  { label: 'Font Family', key: 'fontFamilyRequired', val: fontFamilyRequired, set: setFontFamilyRequired },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-bold text-gray-700">{item.label}</span>
                    <button
                      onClick={() => item.set(!item.val)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.val ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block size-5 transform rounded-full bg-white transition-transform ${item.val ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-3">Business Contact Info (used as defaults)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Website</label>
                  <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Phone</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold">Email</label>
                  <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-3">Social Media Links (JSON)</h4>
              <textarea value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} rows={4} className="w-full px-3 py-2 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono" placeholder='{"instagram": "https://instagram.com/...", "facebook": "https://facebook.com/..."}' />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
