'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { toast } from 'react-hot-toast';
import DynamicQRCode from '@/components/shared/DynamicQRCode';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useMyBusiness, useUpdateBusiness } from '@/services/businesses/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { BusinessHours } from '@/services/businesses/types';
import { Loader2, Lock, Info } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useUpdateBranch } from '@/services/branches/hooks';
import { fetchDevices } from '@/lib/api/devices';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function BusinessProfilePage() {
    const { storeName, updateCustomSettings, setRedirect } = useCustomerFlowStore();
    const { activeBranchId, isAllBranches } = useActiveBranch();

    // Data Fetching
    const { data: business, isLoading: businessLoading } = useMyBusiness();
    const { data: branch, isLoading: branchLoading } = useBranch(activeBranchId || '');
    
    const updateBusinessMutation = useUpdateBusiness();
    const updateBranchMutation = useUpdateBranch();

    // 1. Core Identity States
    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
    const [profileSlug, setProfileSlug] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    const [otherSubcategoryName, setOtherSubcategoryName] = useState('');
    
    // 2. Location States
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    
    // 3. Contact States
    const [supportEmail, setSupportEmail] = useState('');
    const [supportPhone, setSupportPhone] = useState('');

    // 4. Content States
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [verificationDoc, setVerificationDoc] = useState<string | null>(null);

    const [about, setAbout] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [privacyMessage, setPrivacyMessage] = useState('');
    const [rewardMessage, setRewardMessage] = useState('');

    // 5. Operation States
    const [businessHours, setBusinessHours] = useState<Record<string, BusinessHours>>({});
    const [rewardEnabled, setRewardEnabled] = useState(false);
    const [rewardVisitThreshold, setRewardVisitThreshold] = useState(5);

    // 6. Registration & Docs
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [cacDocument, setCacDocument] = useState('');
    const [idDocument, setIdDocument] = useState('');

    // 7. Socials & Visibility
    const [facebookUrl, setFacebookUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [tiktokUrl, setTiktokUrl] = useState('');
    const [xUrl, setXUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [customLink, setCustomLink] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [reviewUrl, setReviewUrl] = useState('');

    const [showReview, setShowReview] = useState(true);
    const [showSocial, setShowSocial] = useState(true);
    const [showFeedback, setShowFeedback] = useState(true);

    const [activeTab, setActiveTab] = useState('general');
    const [origin, setOrigin] = useState('https://vemtap.com');
    const [deviceCode, setDeviceCode] = useState('');

    // Dropdown Hooks
    const { data: categoriesData } = useCategories({ limit: 100 });
    const { data: subcategoriesData } = useSubcategories(categoryId, { limit: 100 });
    const categories = categoriesData?.items || [];
    const subcategories = subcategoriesData?.items || [];

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    const qrId = 'biz-profile-main';
    const publicProfileUrl = business?.id
        ? `${origin}/b/${business.id}`
        : `${origin}/${profileSlug}`;

    const syncRedirect = async (url: string) => {
        setRedirect(qrId, url);
        try {
            await fetch('/api/q/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: qrId, url }),
            });
        } catch (error) {
            console.error('Failed to sync redirect mapping:', error);
        }
    };

    // Synchronization Logic
    useEffect(() => {
        if (isAllBranches && business) {
            setName(business.name || '');
            setLogo(business.logoUrl || '');
            setBusinessType(business.type || 'RESTAURANT');
            setCategoryId(business.categoryId || '');
            setSubcategoryId(business.subcategoryId || '');
            setOtherSubcategoryName(business.otherSubcategoryName || '');
            setState(business.state || '');
            setCity(business.city || '');
            
            // These are branch-level in DB, but we show them from main branch or business fallback
            setSupportEmail(business.officialEmail || '');
            setSupportPhone(business.phone || business.whatsappNumber || '');
            setAddress(business.address || '');
            setAbout(business.about || '');

            setWelcomeMessage(business.welcomeMessage || '');
            setSuccessMessage(business.successMessage || '');
            setPrivacyMessage(business.privacyMessage || '');
            setRewardMessage(business.rewardMessage || '');

            if (business.businessHours) {
                setBusinessHours(business.businessHours);
            } else {
                const defaultHours: Record<string, BusinessHours> = {};
                DAYS.forEach(day => {
                    defaultHours[day] = { open: '09:00', close: '18:00', closed: false };
                });
                setBusinessHours(defaultHours);
            }

            setRewardEnabled(business.rewardEnabled || false);
            setRewardVisitThreshold(business.rewardVisitThreshold || 5);

            setFacebookUrl(business.facebookUrl || '');
            setInstagramUrl(business.instagramUrl || '');
            setTiktokUrl(business.tiktokUrl || '');
            setXUrl(business.xUrl || '');
            setYoutubeUrl(business.youtubeUrl || '');
            setCustomLink(business.customLink || '');
            setLinkedinUrl(business.linkedinUrl || '');
            setReviewUrl(business.reviewUrl || '');

            setShowReview(business.showReview ?? true);
            setShowSocial(business.showSocial ?? true);
            setShowFeedback(business.showFeedback ?? true);

            setCacDocument(business.cacDocument || '');
            setIdDocument(business.idDocument || '');
            setIsRegistered(business.isRegistered || false);
            setRegistrationNumber(business.registrationNumber || '');

            if (!profileSlug && business.name) {
                const slug = business.name.toLowerCase().replace(/\s+/g, '-');
                setProfileSlug(slug);
                void syncRedirect(publicProfileUrl);
            }
        } else if (activeBranchId && branch) {
            setName(branch.name || '');
            setLogo(branch.logoUrl || '');
            setSupportEmail(branch.officialEmail || '');
            setSupportPhone(branch.phone || branch.whatsappNumber || '');
            setAddress(branch.address || '');
            setAbout(branch.about || '');

            setWelcomeMessage(branch.welcomeMessage || '');
            setSuccessMessage(branch.successMessage || '');
            setPrivacyMessage(branch.privacyMessage || '');
            setRewardMessage(branch.rewardMessage || '');

            if (branch.businessHours) {
                setBusinessHours(branch.businessHours);
            } else {
                const defaultHours: Record<string, BusinessHours> = {};
                DAYS.forEach(day => {
                    defaultHours[day] = { open: '09:00', close: '18:00', closed: false };
                });
                setBusinessHours(defaultHours);
            }

            setRewardEnabled(branch.rewardEnabled || false);
            setRewardVisitThreshold(branch.rewardVisitThreshold || 5);

            setLinkedinUrl(branch.linkedinUrl || '');
            setReviewUrl(branch.reviewUrl || '');

            setShowReview(branch.showReview ?? true);
            setShowSocial(branch.showSocial ?? true);
            setShowFeedback(branch.showFeedback ?? true);
        }
    }, [business, storeName, logoUrl, origin, profileSlug, publicProfileUrl]);

    useEffect(() => {
        const loadDeviceCode = async () => {
            if (!business) return;
            const mainBranch = business.branches?.find(b => b.isMainBranch);
            const selectedBranch = activeBranchId ? business.branches?.find(b => b.id === activeBranchId) : null;
            const currentBranch = selectedBranch || mainBranch;
            if (!currentBranch?.id) return;

            try {
                const devices = await fetchDevices(currentBranch.id);
                const preferred = devices.find((d) => d.status === 'active') || devices[0];
                if (preferred?.code) setDeviceCode(preferred.code);
            } catch (error) {
                console.error('Failed to load devices for profile link:', error);
            }
        };
        loadDeviceCode();
    }, [business, activeBranchId]);

    const handleSave = async () => {
        const hasChanged = (current: any, original: any) => {
            const normalizedCurrent = current === '' || current === null ? undefined : current;
            const normalizedOriginal = original === '' || original === null ? undefined : original;
            return normalizedCurrent !== normalizedOriginal;
        };

        try {
            // 1. Handle Uploads
            let finalLogoUrl = logo;
            if (logo && logo.startsWith('data:image')) {
                const uploadToast = toast.loading('Uploading logo...');
                finalLogoUrl = await uploadToCloudinary(logo);
                setLogo(finalLogoUrl);
                toast.dismiss(uploadToast);
            }

            let finalCacDocument = cacDocument;
            let finalIdDocument = idDocument;
            if (cacDocument && cacDocument.startsWith('data:image')) finalCacDocument = await uploadToCloudinary(cacDocument);
            if (idDocument && idDocument.startsWith('data:image')) finalIdDocument = await uploadToCloudinary(idDocument);

            // 2. Business Level Update
            if (isAllBranches && business) {
                const updates: any = {};
                if (hasChanged(name, business.name)) updates.name = name;
                if (hasChanged(businessType, business.type)) updates.type = businessType;
                if (hasChanged(categoryId, business.categoryId)) updates.categoryId = categoryId;
                if (hasChanged(subcategoryId, business.subcategoryId)) updates.subcategoryId = subcategoryId;
                if (hasChanged(otherSubcategoryName, business.otherSubcategoryName)) updates.otherSubcategoryName = otherSubcategoryName;
                if (hasChanged(state, business.state)) updates.state = state;
                if (hasChanged(city, business.city)) updates.city = city;
                if (hasChanged(isRegistered, business.isRegistered)) updates.isRegistered = isRegistered;
                if (hasChanged(registrationNumber, business.registrationNumber)) updates.registrationNumber = registrationNumber;
                if (hasChanged(finalLogoUrl, business.logoUrl)) updates.logoUrl = finalLogoUrl;
                if (hasChanged(finalCacDocument, business.cacDocument)) updates.cacDocument = finalCacDocument;
                if (hasChanged(finalIdDocument, business.idDocument)) updates.idDocument = finalIdDocument;

                if (Object.keys(updates).length === 0) {
                    toast.success('No changes discovered.');
                    return;
                }

                await updateBusinessMutation.mutateAsync({ id: business.id, updates });
                toast.success('Business settings updated!');
            } 
            // 3. Branch Level Update
            else if (activeBranchId && branch) {
                const updates: any = {};
                if (hasChanged(name, branch.name)) updates.name = name;
                if (hasChanged(finalLogoUrl, branch.logoUrl)) updates.logoUrl = finalLogoUrl;
                if (hasChanged(state, branch.state)) updates.state = state;
                if (hasChanged(city, branch.city)) updates.city = city;
                if (hasChanged(supportEmail, branch.officialEmail)) updates.officialEmail = supportEmail;
                if (hasChanged(supportPhone, branch.phone)) updates.phone = supportPhone;
                if (hasChanged(address, branch.address)) updates.address = address;
                if (hasChanged(about, branch.about)) updates.about = about;
                if (hasChanged(welcomeMessage, branch.welcomeMessage)) updates.welcomeMessage = welcomeMessage;
                if (hasChanged(successMessage, branch.successMessage)) updates.successMessage = successMessage;
                if (hasChanged(privacyMessage, branch.privacyMessage)) updates.privacyMessage = privacyMessage;
                if (hasChanged(rewardMessage, branch.rewardMessage)) updates.rewardMessage = rewardMessage;
                
                if (JSON.stringify(businessHours) !== JSON.stringify(branch.businessHours || {})) {
                    updates.businessHours = businessHours;
                }
                
                if (hasChanged(rewardEnabled, branch.rewardEnabled)) updates.rewardEnabled = rewardEnabled;
                if (hasChanged(rewardVisitThreshold, branch.rewardVisitThreshold)) updates.rewardVisitThreshold = rewardVisitThreshold;
                if (hasChanged(reviewUrl, branch.reviewUrl)) updates.reviewUrl = reviewUrl;
                if (hasChanged(showReview, branch.showReview)) updates.showReview = showReview;
                if (hasChanged(showSocial, branch.showSocial)) updates.showSocial = showSocial;
                if (hasChanged(showFeedback, branch.showFeedback)) updates.showFeedback = showFeedback;

                if (Object.keys(updates).length === 0) {
                    toast.success('No changes discovered.');
                    return;
                }

                await updateBranchMutation.mutateAsync({ id: branch.id, updates });
                toast.success('Location settings updated!');
            }

            updateCustomSettings({ logoUrl: finalLogoUrl });
            useCustomerFlowStore.setState({ storeName: name });
            await syncRedirect(publicProfileUrl);

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Update failed.');
        }
    };

    if (businessLoading || (activeBranchId && branchLoading)) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    const renderLockOverlay = (message: string) => (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md mt-1 border border-amber-100 w-fit">
            <Lock size={10} />
            {message}
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <PageHeader
                title={isAllBranches ? "Global Business Profile" : "Location Profile"}
                description={isAllBranches ? "Manage branding and legal information for your entire business" : `Manage details for ${branch?.name}`}
                actions={
                    <button
                        onClick={handleSave}
                        disabled={updateBusinessMutation.isPending || updateBranchMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md disabled:opacity-50"
                    >
                        {updateBusinessMutation.isPending || updateBranchMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                    </button>
                }
            />

            {/* Contextual Information Banner */}
            <div className={`mb-8 p-4 rounded-2xl border flex items-start gap-4 transition-all duration-300 ${isAllBranches ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                <div className={`p-2 rounded-xl ${isAllBranches ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    <Info size={20} />
                </div>
                <div>
                    <h4 className={`text-sm font-bold ${isAllBranches ? 'text-blue-900' : 'text-green-900'}`}>
                        {isAllBranches ? "Global View Mode" : "Specific Location View"}
                    </h4>
                    <p className={`text-xs mt-0.5 leading-relaxed ${isAllBranches ? 'text-blue-800' : 'text-green-800'}`}>
                        {isAllBranches 
                            ? "You are managing settings for your entire brand. Location-specific details like address and hours are locked. Switch to a specific location in the header to edit them."
                            : "You are managing this specific location. Changes here will only affect this branch."
                        }
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="relative mb-8 overflow-hidden">
                <div className="flex items-center gap-1 overflow-x-auto scroll-smooth pb-2 border-b border-gray-100 no-scrollbar">
                    {[
                        { id: 'general', label: 'General', icon: 'business' },
                        { id: 'schedule', label: 'Schedule', icon: 'calendar_today' },
                        { id: 'messaging', label: 'Messaging', icon: 'forum' },
                        { id: 'socials', label: 'Socials', icon: 'share' },
                        { id: 'rewards', label: 'Rewards', icon: 'auto_awesome' },
                        { id: 'visibility', label: 'Visibility', icon: 'visibility' },
                        { id: 'qr', label: 'QR Code', icon: 'qr_code_2' },
                        { id: 'documents', label: 'Documents', icon: 'description' },
                    ].filter(tab => {
                        if (isAllBranches && tab.id === 'schedule') return false;
                        if (!isAllBranches && tab.id === 'documents') return false;
                        return true;
                    }).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:bg-gray-50'}`}
                        >
                            <span className="material-icons-round text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8 animate-in fade-in duration-500">
                {activeTab === 'general' && (
                    <div className="space-y-8">
                        {/* Identity Section */}
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Identity & Branding</h3>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="flex flex-col md:flex-row gap-10">
                                    <div className="flex flex-col items-center space-y-4 min-w-[160px]">
                                        <div className="size-32 rounded-3xl bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden relative group">
                                            {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain p-4" /> : <span className="material-icons-round text-4xl text-gray-300">add_a_photo</span>}
                                            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const r = new FileReader();
                                                    r.onload = ev => setLogo(ev.target?.result as string);
                                                    r.readAsDataURL(file);
                                                }
                                            }} />
                                        </div>
                                        <button onClick={() => document.getElementById('logo-upload')?.click()} className="w-full h-10 bg-primary/10 text-primary font-bold text-[10px] rounded-xl uppercase tracking-wider hover:bg-primary/20 transition-all">
                                            Upload Logo
                                        </button>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Brand Name</label>
                                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Business Type</label>
                                                <select 
                                                    value={businessType} 
                                                    onChange={e => setBusinessType(e.target.value)} 
                                                    disabled={!isAllBranches}
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none cursor-pointer disabled:opacity-60"
                                                >
                                                    <option value="RESTAURANT">Restaurant & Cafe</option>
                                                    <option value="RETAIL">Retail Store</option>
                                                    <option value="GYM">Fitness & Health</option>
                                                    <option value="EVENT">Events & Leisure</option>
                                                    <option value="LOGISTICS">Logistics & Service</option>
                                                    <option value="BEAUTY_WELLNESS">Beauty & Wellness</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Details */}
                        <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition-opacity duration-300 ${isAllBranches ? 'opacity-70' : 'opacity-100'}`}>
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Location & Contact</h3>
                                {isAllBranches && <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-600"><Lock size={12} /> Read Only</span>}
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">State</label>
                                        <input type="text" value={state} onChange={e => setState(e.target.value)} readOnly={isAllBranches} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">City</label>
                                        <input type="text" value={city} onChange={e => setCity(e.target.value)} readOnly={isAllBranches} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Detailed Address</label>
                                    <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} readOnly={isAllBranches} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && !isAllBranches && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Business Hours</h3>
                        </div>
                        <div className="p-8 space-y-4">
                            {DAYS.map(day => (
                                <div key={day} className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                                    <span className="w-24 text-xs font-black uppercase tracking-widest text-text-secondary">{day}</span>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!businessHours[day]?.closed} onChange={e => setBusinessHours(p => ({ ...p, [day]: { ...p[day], closed: !e.target.checked } }))} />
                                        <span className="text-xs font-bold">Open</span>
                                    </label>
                                    <div className="flex-1 flex items-center gap-3">
                                        <input type="time" value={businessHours[day]?.open || '09:00'} onChange={e => setBusinessHours(p => ({ ...p, [day]: { ...p[day], open: e.target.value } }))} disabled={businessHours[day]?.closed} className="h-10 bg-white border rounded-lg px-3 text-sm font-bold outline-none" />
                                        <span className="text-xs font-bold text-gray-300">to</span>
                                        <input type="time" value={businessHours[day]?.close || '18:00'} onChange={e => setBusinessHours(p => ({ ...p, [day]: { ...p[day], close: e.target.value } }))} disabled={businessHours[day]?.closed} className="h-10 bg-white border rounded-lg px-3 text-sm font-bold outline-none" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'messaging' && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Welcome Message</label>
                            <input type="text" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} className="w-full h-12 bg-gray-50 border rounded-xl px-4 text-sm font-bold outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Success Message</label>
                            <input type="text" value={successMessage} onChange={e => setSuccessMessage(e.target.value)} className="w-full h-12 bg-gray-50 border rounded-xl px-4 text-sm font-bold outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Privacy Message</label>
                            <input type="text" value={privacyMessage} onChange={e => setPrivacyMessage(e.target.value)} className="w-full h-12 bg-gray-50 border rounded-xl px-4 text-sm font-bold outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Reward Message</label>
                            <input type="text" value={rewardMessage} onChange={e => setRewardMessage(e.target.value)} className="w-full h-12 bg-gray-50 border rounded-xl px-4 text-sm font-bold outline-none" />
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && isAllBranches && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Business Documents</h3>
                                <p className="text-xs text-text-secondary font-medium mt-1">Upload your business registration documents for verification</p>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">CAC Document</label>
                                        <div className="h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative group">
                                            {cacDocument ? <img src={cacDocument} alt="CAC" className="w-full h-full object-contain p-4" /> : <span className="material-icons-round text-4xl text-gray-300">upload_file</span>}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const r = new FileReader();
                                                    r.onload = ev => setCacDocument(ev.target?.result as string);
                                                    r.readAsDataURL(file);
                                                }
                                            }} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Government ID</label>
                                        <div className="h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative group">
                                            {idDocument ? <img src={idDocument} alt="ID" className="w-full h-full object-contain p-4" /> : <span className="material-icons-round text-4xl text-gray-300">badge</span>}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const r = new FileReader();
                                                    r.onload = ev => setIdDocument(ev.target?.result as string);
                                                    r.readAsDataURL(file);
                                                }
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
