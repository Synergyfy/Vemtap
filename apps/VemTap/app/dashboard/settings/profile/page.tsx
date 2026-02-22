'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { toast } from 'react-hot-toast';
import DynamicQRCode from '@/components/shared/DynamicQRCode';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

export default function BusinessProfilePage() {
    const { storeName, logoUrl, updateCustomSettings, setBusinessType, businessType, setRedirect, redirects } = useCustomerFlowStore();
    const [name, setName] = useState(storeName);
    const [logo, setLogo] = useState(logoUrl || '');
    const [profileSlug, setProfileSlug] = useState('');
    const [origin, setOrigin] = useState('https://vemtap.com');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    // Config for Dynamic QR
    const qrId = 'biz-profile-main';

    useEffect(() => {
        setName(storeName);
        setLogo(logoUrl || '');
        if (!profileSlug) {
            const slug = storeName.toLowerCase().replace(/\s+/g, '-');
            setProfileSlug(slug);
            // Initialize redirect
            setRedirect(qrId, `${origin}/${slug}`);
        }
    }, [storeName, logoUrl, origin]);

    const handleSave = () => {
        updateCustomSettings({
            logoUrl: logo
        });
        useCustomerFlowStore.setState({ storeName: name });
        // Update the dynamic redirect destination
        const fullProfileUrl = `${origin}/${profileSlug}`;
        setRedirect(qrId, fullProfileUrl);

        toast.success('Business profile and QR Link updated!');
    };


    return (
        <div className="p-8 max-w-4xl mx-auto">
            <PageHeader
                title="Business Profile"
                description="Update your business information and online presence"
                actions={
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20"
                    >
                        Save Changes
                    </button>
                }
            />

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Basic Info & Branding */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Branding & Identity</h3>
                        <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-green-100">Verified Business</span>
                    </div>
                    <div className="p-8 space-y-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                            {/* Logo Section */}
                            <div className="flex flex-col items-center space-y-4">
                                <div className="size-32 rounded-3xl bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden relative shadow-inner group">
                                    {logo ? (
                                        <>
                                            <img src={logo} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" />
                                            <button
                                                onClick={() => setLogo('')}
                                                className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <span className="material-icons-round text-sm">delete</span>
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <span className="material-icons-round text-4xl">add_a_photo</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">No Logo</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setLogo(reader.result as string);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </div>
                                <div className="w-full max-w-[200px] space-y-3">
                                    <button
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                        className="w-full h-10 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons-round text-sm">upload</span>
                                        Upload Logo
                                    </button>
                                    <div className="relative">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-1 block">Or Paste Image URL</label>
                                        <input
                                            type="text"
                                            value={logo}
                                            onChange={(e) => setLogo(e.target.value)}
                                            placeholder="https://..."
                                            className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Business Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Business Category</label>
                                        <select
                                            value={businessType}
                                            onChange={(e) => setBusinessType(e.target.value as any)}
                                            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                                        >
                                            <option value="RESTAURANT">Restaurant & Cafe</option>
                                            <option value="RETAIL">Retail Store</option>
                                            <option value="GYM">Fitness Center</option>
                                            <option value="EVENT">Events & Others</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <div className="h-12 px-4 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl flex items-center text-xs font-bold text-gray-400 select-none tracking-tight">
                                            {origin.replace(/^https?:\/\//, '')}/
                                        </div>
                                        <input
                                            type="text"
                                            value={profileSlug}
                                            onChange={(e) => setProfileSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                            className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-r-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            placeholder="your-business-link"
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">This is your public landing page link for customers.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact & Location */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Contact & Location</h3>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Support Email</label>
                            <input type="email" defaultValue="hello@vemtap.com" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Support Phone</label>
                            <input type="tel" defaultValue="+234 801 234 5678" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Detailed Address</label>
                            <textarea defaultValue="42 Admiralty Way, Lekki Phase 1, Lagos, Nigeria" rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none" />
                        </div>
                    </div>
                </div>

                {/* Dynamic QR Code Section */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Dynamic Business QR</h3>
                        <p className="text-xs text-text-secondary font-medium">This QR code always redirects to your profile link above. You can change the link anytime without reprinting.</p>
                    </div>
                    <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                        <DynamicQRCode
                            redirectId={qrId}
                            label="Scan to Visit Profile"
                            subLabel={origin.replace(/^https?:\/\//, '')}
                            color="#000000"
                        />
                        <div className="space-y-4 flex-1">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                                    <span className="material-icons-round text-base">info</span>
                                    How it works
                                </h4>
                                <p className="text-xs text-blue-800 leading-relaxed">
                                    This QR code points to a permanent redirection service. When scanned, it instantly redirects users to your <strong>Profile URL / Handle</strong> configured above.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Current Destination</label>
                                <div className="h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 flex items-center text-sm font-bold text-gray-600">
                                    {`${origin}/${profileSlug}`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="pt-4 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <span className="material-icons-round text-amber-500">warning</span>
                        <p className="text-xs font-bold text-text-secondary">Changes to business name may affect your URL slug.</p>
                    </div>
                    <button className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors">
                        Deactivate Business Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
