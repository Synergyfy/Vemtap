'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { toast } from 'react-hot-toast';
import DynamicQRCode from '@/components/shared/DynamicQRCode';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useMyBusiness, useUpdateBusiness } from '@/services/businesses/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { BusinessHours } from '@/services/businesses/types';
import { Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useUpdateBranch, useBranch, useBranches } from '@/services/branches/hooks';
import { useCategories } from '@/services/categories/hooks';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const statesData: Record<string, string[]> = {
    'Lagos': ['Ikeja', 'Lekki', 'Victoria Island', 'Surulere', 'Yaba', 'Ajah', 'Ikorodu', 'Epe'],
    'Abuja (FCT)': ['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Jabi'],
    'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Eleme', 'Oyigbo'],
    'Oyo': ['Ibadan', 'Ogbomosho', 'Oyo Town', 'Iseyin'],
    'Kano': ['Kano City', 'Wudil', 'Gwarzo'],
    'Ogun': ['Abeokuta', 'Ijebu Ode', 'Sango Ota', 'Ilaro'],
    'Edo': ['Benin City', 'Auchi', 'Ekpoma'],
    'Delta': ['Warri', 'Asaba', 'Sapele', 'Agbor'],
    'Enugu': ['Enugu City', 'Nsukka'],
    'Kaduna': ['Kaduna City', 'Zaria'],
    'Anambra': ['Awka', 'Onitsha', 'Nnewi']
};

export default function BusinessProfilePage() {
    const { storeName, logoUrl, updateCustomSettings, setRedirect } = useCustomerFlowStore();
    const { activeBranchId, isAllBranches: rawIsAllBranches } = useActiveBranch();

    const { data: business, isLoading: businessLoading } = useMyBusiness();
    const { data: branches = [] } = useBranches();
    
    const isAllBranches = rawIsAllBranches && branches.length > 1;
    const effectiveBranchId = activeBranchId || (branches.length === 1 ? branches[0].id : '');
    const { data: branch, isLoading: branchLoading } = useBranch(effectiveBranchId);
    
    const updateMutation = useUpdateBusiness();
    const updateBranchMutation = useUpdateBranch();

    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
    const [profileSlug, setProfileSlug] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategoryId, setSubcategoryId] = useState('');
    const [otherSubcategoryName, setOtherSubcategoryName] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    
    const [supportEmail, setSupportEmail] = useState('');
    const [supportPhone, setSupportPhone] = useState('');
    const [address, setAddress] = useState('');

    const [about, setAbout] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [privacyMessage, setPrivacyMessage] = useState('');
    const [rewardMessage, setRewardMessage] = useState('');

    const [businessHours, setBusinessHours] = useState<Record<string, BusinessHours>>({});

    const [rewardEnabled, setRewardEnabled] = useState(false);
    const [rewardVisitThreshold, setRewardVisitThreshold] = useState(5);

    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [cacDocument, setCacDocument] = useState('');
    const [idDocument, setIdDocument] = useState('');

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

    const { data: categoryData, isLoading: isCategoriesLoading } = useCategories({ limit: 100 });
    const categories = categoryData?.items || [];
    const currentCategory = categories.find((c: any) => c.id === categoryId);
    const subcategories = currentCategory?.subcategories || [];

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    const qrId = 'biz-profile-main';

    useEffect(() => {
        if (isAllBranches && business) {
            setName(business.name || '');
            setLogo(business.logoUrl || '');
            setCategoryId(business.categoryId || '');
            setSubcategoryId(business.subcategoryId || '');
            setOtherSubcategoryName(business.otherSubcategoryName || '');
            setState(business.state || '');
            setCity(business.city || '');
            
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

            if (!profileSlug) {
                const slug = (business.name).toLowerCase().replace(/\s+/g, '-');
                setProfileSlug(slug);
                setRedirect(qrId, `${origin}/${slug}`);
            }
        } else if (branch) {
            setName(branch.name || '');
            setLogo(branch.logoUrl || '');
            setState(branch.state || '');
            setCity(branch.city || '');
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
    }, [business, branch, isAllBranches, activeBranchId, origin, branches.length]);

    const handleSave = async () => {
        const hasChanged = (current: any, original: any) => {
            const normalizedCurrent = current === '' || current === null ? undefined : current;
            const normalizedOriginal = original === '' || original === null ? undefined : original;
            return normalizedCurrent !== normalizedOriginal;
        };

        try {
            let finalLogoUrl = logo;
            if (logo && logo.startsWith('data:image')) {
                const uploadToast = toast.loading('Uploading new logo...');
                finalLogoUrl = await uploadToCloudinary(logo);
                setLogo(finalLogoUrl);
                toast.dismiss(uploadToast);
            }

            let finalCacDocument = cacDocument;
            let finalIdDocument = idDocument;
            if (cacDocument && cacDocument.startsWith('data:image')) finalCacDocument = await uploadToCloudinary(cacDocument);
            if (idDocument && idDocument.startsWith('data:image')) finalIdDocument = await uploadToCloudinary(idDocument);

            if (isAllBranches && business) {
                const businessUpdates: any = {};
                if (hasChanged(name, business.name)) businessUpdates.name = name;
                if (hasChanged(categoryId, business.categoryId)) businessUpdates.categoryId = categoryId;
                if (hasChanged(subcategoryId, business.subcategoryId)) businessUpdates.subcategoryId = subcategoryId;
                if (hasChanged(otherSubcategoryName, business.otherSubcategoryName)) businessUpdates.otherSubcategoryName = otherSubcategoryName;
                if (hasChanged(state, business.state)) businessUpdates.state = state;
                if (hasChanged(city, business.city)) businessUpdates.city = city;
                if (hasChanged(isRegistered, business.isRegistered)) businessUpdates.isRegistered = isRegistered;
                if (hasChanged(registrationNumber, business.registrationNumber)) businessUpdates.registrationNumber = registrationNumber;
                if (hasChanged(finalLogoUrl, business.logoUrl)) businessUpdates.logoUrl = finalLogoUrl;

                const docs = [finalCacDocument, finalIdDocument].filter(Boolean);
                if (docs.length > 0) businessUpdates.documents = docs;

                if (Object.keys(businessUpdates).length === 0) {
                    toast.success('No changes discovered.');
                    return;
                }

                await updateMutation.mutateAsync({ id: business.id, updates: businessUpdates });
                toast.success('Business profile updated successfully!');
            } else if (branch) {
                const branchUpdates: any = {};
                if (hasChanged(name, branch.name)) branchUpdates.name = name;
                if (hasChanged(finalLogoUrl, branch.logoUrl)) branchUpdates.logoUrl = finalLogoUrl;
                if (hasChanged(supportEmail, branch.officialEmail)) branchUpdates.officialEmail = supportEmail;
                if (hasChanged(supportPhone, branch.phone)) branchUpdates.phone = supportPhone;
                if (hasChanged(address, branch.address)) branchUpdates.address = address;
                if (hasChanged(state, branch.state)) branchUpdates.state = state;
                if (hasChanged(city, branch.city)) branchUpdates.city = city;
                if (hasChanged(about, branch.about)) branchUpdates.about = about;
                if (hasChanged(welcomeMessage, branch.welcomeMessage)) branchUpdates.welcomeMessage = welcomeMessage;
                if (hasChanged(successMessage, branch.successMessage)) branchUpdates.successMessage = successMessage;
                if (hasChanged(privacyMessage, branch.privacyMessage)) branchUpdates.privacyMessage = privacyMessage;
                if (hasChanged(rewardMessage, branch.rewardMessage)) branchUpdates.rewardMessage = rewardMessage;

                const originalHours = branch.businessHours || {};
                if (JSON.stringify(businessHours) !== JSON.stringify(originalHours)) {
                    branchUpdates.businessHours = businessHours;
                }

                if (hasChanged(rewardEnabled, branch.rewardEnabled)) branchUpdates.rewardEnabled = rewardEnabled;
                if (hasChanged(rewardVisitThreshold, branch.rewardVisitThreshold)) branchUpdates.rewardVisitThreshold = rewardVisitThreshold;

                if (hasChanged(reviewUrl, branch.reviewUrl)) branchUpdates.reviewUrl = reviewUrl;
                if (hasChanged(showReview, branch.showReview)) branchUpdates.showReview = showReview;
                if (hasChanged(showSocial, branch.showSocial)) branchUpdates.showSocial = showSocial;
                if (hasChanged(showFeedback, branch.showFeedback)) branchUpdates.showFeedback = showFeedback;

                if (Object.keys(branchUpdates).length === 0) {
                    toast.success('No changes discovered.');
                    return;
                }

                await updateBranchMutation.mutateAsync({ id: branch.id, updates: branchUpdates });
                toast.success('Branch profile updated successfully!');
            }

            updateCustomSettings({ logoUrl: finalLogoUrl });
            useCustomerFlowStore.setState({ storeName: name });
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to update profile.');
        }
    };

    if (businessLoading || (effectiveBranchId && branchLoading)) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    const availableTabs = [
        { id: 'general', label: 'General', icon: 'business' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar_today', branchOnly: true },
        { id: 'messaging', label: 'Messaging', icon: 'forum', branchOnly: true },
        { id: 'socials', label: 'Socials', icon: 'share', branchOnly: true },
        { id: 'rewards', label: 'Rewards', icon: 'auto_awesome', branchOnly: true },
        { id: 'visibility', label: 'Visibility', icon: 'visibility', branchOnly: true },
        { id: 'qr', label: 'QR Code', icon: 'qr_code_2', branchOnly: true },
        { id: 'documents', label: 'Documents', icon: 'description', bizOnly: true },
    ].filter(tab => {
        if (isAllBranches) {
            return !tab.branchOnly; 
        }
        return true; 
    });


    return (
        <div className="p-8 max-w-4xl mx-auto">
            <PageHeader
                title="Business Profile"
                description="Update your business information and online presence"
                actions={
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending || updateBranchMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                        {updateMutation.isPending || updateBranchMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                    </button>
                }
            />

            {isAllBranches && (
                <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="material-icons-round text-amber-600">info</span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-900">Aggregate Mode (All Locations)</h4>
                        <p className="text-xs text-amber-800/80 leading-relaxed mt-1">
                            You are viewing global settings. You can only edit <strong>General Info</strong> and <strong>Documents</strong> here. 
                            To edit branch-specific settings, socials, or QR codes, please <strong>select a specific branch</strong> from the header.
                        </p>
                    </div>
                </div>
            )}

            <div className="relative mb-8">
                <div className="absolute left-0 top-0 bottom-2 z-10">
                    <button 
                        onClick={() => document.getElementById('tabs-container')?.scrollBy({ left: -200, behavior: 'smooth' })}
                        className="h-full px-2 bg-white border-r border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                    >
                        <span className="material-icons-round text-gray-400">chevron_left</span>
                    </button>
                </div>
                <div 
                    id="tabs-container"
                    className="flex items-center gap-1 overflow-x-auto scroll-smooth pb-2 border-b border-gray-100 px-10"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
                >
                    {availableTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-secondary hover:bg-gray-50'}`}
                        >
                            <span className="material-icons-round text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="absolute right-0 top-0 bottom-2 z-10">
                    <button 
                        onClick={() => document.getElementById('tabs-container')?.scrollBy({ left: 200, behavior: 'smooth' })}
                        className="h-full px-2 bg-white border-l border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                    >
                        <span className="material-icons-round text-gray-400">chevron_right</span>
                    </button>
                </div>
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'general' && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Branding & Identity</h3>
                                <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-green-100">Verified Business</span>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
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
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-6 w-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                                                    {isAllBranches ? 'Business Name' : 'Branch Name'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                />
                                            </div>
                                        </div>

                                        {(isAllBranches || branches.length <= 1) && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Category</label>
                                                        {isCategoriesLoading ? (
                                                            <div className="h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 flex items-center">
                                                                <Loader2 size={16} className="animate-spin text-primary" />
                                                            </div>
                                                        ) : (
                                                            <select
                                                                value={categoryId}
                                                                onChange={(e) => {
                                                                    setCategoryId(e.target.value);
                                                                    setSubcategoryId('');
                                                                }}
                                                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                                                            >
                                                                <option value="">Select Category</option>
                                                                {categories.map((cat: any) => (
                                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Sub-Category</label>
                                                        <select
                                                            value={subcategoryId}
                                                            onChange={(e) => setSubcategoryId(e.target.value)}
                                                            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                                                            disabled={!categoryId}
                                                        >
                                                            <option value="">Select Sub-Category</option>
                                                            {subcategories.map((sub: any) => (
                                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                            ))}
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {subcategoryId === 'other' && (
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Other Subcategory Name</label>
                                                        <input
                                                            type="text"
                                                            value={otherSubcategoryName}
                                                            onChange={(e) => setOtherSubcategoryName(e.target.value)}
                                                            placeholder="Specify your subcategory"
                                                            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">State</label>
                                                <select
                                                    value={state}
                                                    onChange={(e) => {
                                                        setState(e.target.value);
                                                        setCity('');
                                                    }}
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                >
                                                    <option value="">Select State</option>
                                                    {Object.keys(statesData).sort().map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">City</label>
                                                <select
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    disabled={!state}
                                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
                                                >
                                                    <option value="">Select City</option>
                                                    {state && statesData[state]?.sort().map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {(isAllBranches || branches.length <= 1) && (
                                            <>
                                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                                    <div className="flex-1">
                                                        <span className="text-sm font-bold text-text-main">Business Registration</span>
                                                        <p className="text-xs text-text-secondary">Is your business officially registered?</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsRegistered(!isRegistered)}
                                                        className={`w-12 h-6 rounded-full transition-all ${isRegistered ? 'bg-primary' : 'bg-gray-300'}`}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isRegistered ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                                    </button>
                                                </div>

                                                {isRegistered && (
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Registration Number (RC / BN)</label>
                                                        <input
                                                            type="text"
                                                            value={registrationNumber}
                                                            onChange={(e) => setRegistrationNumber(e.target.value)}
                                                            placeholder="RC1234567"
                                                            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!isAllBranches && (
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Contact & Location</h3>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Support Email</label>
                                        <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="hello@vemtap.com" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Support Phone</label>
                                        <input type="tel" value={supportPhone} onChange={e => setSupportPhone(e.target.value)} placeholder="+234 801 234 5678" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Detailed Address</label>
                                        <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Address..." rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isAllBranches && (
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-display font-bold text-text-main text-lg tracking-tight">About Your Business</h3>
                                    <p className="text-xs text-text-secondary font-medium">Tell customers more about your business</p>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">About</label>
                                        <textarea
                                            value={about}
                                            onChange={(e) => setAbout(e.target.value)}
                                            placeholder="About info..."
                                            rows={4}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'schedule' && !isAllBranches && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Business Hours</h3>
                        </div>
                        <div className="p-8 space-y-4">
                            {DAYS.map((day) => (
                                <div key={day} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-28"><span className="text-xs font-black uppercase text-text-secondary capitalize">{day}</span></div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!businessHours[day]?.closed} onChange={(e) => setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !e.target.checked } }))} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                                        <span className="text-xs font-bold text-text-secondary">Open</span>
                                    </label>
                                    <div className="flex-1 flex items-center gap-3">
                                        <input type="time" value={businessHours[day]?.open || '09:00'} onChange={(e) => setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))} disabled={businessHours[day]?.closed} className="w-32 h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none disabled:opacity-50" />
                                        <span className="text-text-secondary text-xs font-bold">to</span>
                                        <input type="time" value={businessHours[day]?.close || '18:00'} onChange={(e) => setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))} disabled={businessHours[day]?.closed} className="w-32 h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none disabled:opacity-50" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'messaging' && !isAllBranches && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Customer Messages</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-text-secondary ml-1">Welcome Message</label>
                                <input type="text" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-text-secondary ml-1">Success Message</label>
                                <input type="text" value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'socials' && !isAllBranches && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Social Media & Links</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-text-secondary ml-1">Instagram URL</label>
                                <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-text-secondary ml-1">LinkedIn URL</label>
                                <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'visibility' && !isAllBranches && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Display Settings</h3>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div><span className="text-sm font-bold text-text-main">Show Reviews</span></div>
                                <button onClick={() => setShowReview(!showReview)} className={`w-12 h-6 rounded-full transition-all ${showReview ? 'bg-primary' : 'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${showReview ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'qr' && !isAllBranches && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Dynamic Business QR</h3>
                        </div>
                        <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                            <DynamicQRCode redirectId={qrId} label="Scan to Visit Profile" subLabel={origin.replace(/^https?:\/\//, '')} color="#000000" />
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (isAllBranches || branches.length <= 1) && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Business Documents</h3>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-text-secondary ml-1">CAC Registration / Business License</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50/50">
                                        {cacDocument ? (
                                            <div className="w-full text-center">
                                                <img src={cacDocument} alt="CAC" className="mx-auto max-h-48 object-contain rounded-lg mb-4" />
                                                <button onClick={() => setCacDocument('')} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center">
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => setCacDocument(ev.target?.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                                <span className="material-icons-round text-4xl text-gray-300">upload_file</span>
                                                <span className="text-sm font-bold text-text-secondary">Click to upload CAC</span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'general' && (
                    <div className="pt-4 flex items-center justify-between px-2">
                        <button className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors">Deactivate Business Profile</button>
                    </div>
                )}
            </div>
        </div>
    );
}
