'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { toast } from 'react-hot-toast';
import DynamicQRCode from '@/components/shared/DynamicQRCode';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
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
    'FCT - Abuja': ['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Jabi'],
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
    const user = useAuthStore((state) => state.user);
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
    const [publicProfileUrl, setPublicProfileUrl] = useState('');
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
    const [cacType, setCacType] = useState('RC');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [cacDocument, setCacDocument] = useState('');
    const [idDocument, setIdDocument] = useState('');
    const [isDocsCollapsed, setIsDocsCollapsed] = useState(false);

    const [facebookUrl, setFacebookUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [tiktokUrl, setTiktokUrl] = useState('');
    const [xUrl, setXUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [customLink, setCustomLink] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [reviewUrl, setReviewUrl] = useState('');
    const [trustpilotUrl, setTrustpilotUrl] = useState('');

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

    const qrId = (isAllBranches ? business?.uniqueCode : branch?.uniqueCode) || business?.uniqueCode || '';

    useEffect(() => {
        const source = (isAllBranches && business) ? business : branch;
        
        if (source) {
            setName(source.name || '');
            setLogo(source.logoUrl || '');
            
            // For categories/location, prioritize business-level data if it's main branch or all-branches
            const catSource = (business || source) as any;
            setCategoryId(catSource.categoryId || '');
            setSubcategoryId(catSource.subcategoryId || '');
            setOtherSubcategoryName(catSource.otherSubcategoryName || '');
            setState(source.state || business?.state || '');
            setCity(source.city || business?.city || '');
            
            setSupportEmail(source.officialEmail || '');
            setSupportPhone(source.phone || source.whatsappNumber || '');
            setAddress(source.address || '');

            setAbout(source.about || '');
            setWelcomeMessage(source.welcomeMessage || '');
            setSuccessMessage(source.successMessage || '');
            setPrivacyMessage(source.privacyMessage || '');
            setRewardMessage(source.rewardMessage || '');

            if (source.businessHours) {
                setBusinessHours(source.businessHours);
            } else {
                const defaultHours: Record<string, BusinessHours> = {};
                DAYS.forEach(day => {
                    defaultHours[day] = { open: '09:00', close: '18:00', closed: false };
                });
                setBusinessHours(defaultHours);
            }

            setRewardEnabled(source.rewardEnabled || false);
            setRewardVisitThreshold(source.rewardVisitThreshold || 5);

            setFacebookUrl(business?.facebookUrl || '');
            setInstagramUrl(business?.instagramUrl || '');
            setTiktokUrl(business?.tiktokUrl || '');
            setXUrl(business?.xUrl || '');
            setYoutubeUrl(business?.youtubeUrl || '');
            setCustomLink(business?.customLink || '');
            
            setLinkedinUrl(source.linkedinUrl || '');
            setReviewUrl(source.reviewUrl || '');
            setTrustpilotUrl(source.trustpilotUrl || '');

            setShowReview(source.showReview ?? true);
            setShowSocial(source.showSocial ?? true);
            setShowFeedback(source.showFeedback ?? true);

            if (business) {
                setCacDocument(business.cacDocument || '');
                setIdDocument(business.idDocument || '');
                setIsRegistered(business.isRegistered || false);
                setRegistrationNumber(business.registrationNumber || '');
                if ((business.registrationNumber || '').startsWith('BN')) setCacType('BN');
                else if ((business.registrationNumber || '').startsWith('IT')) setCacType('IT');
                else setCacType('RC');
            }

            if (source.uniqueCode) {
                const nextPublicUrl = `${origin}/b/${source.uniqueCode}`;
                setPublicProfileUrl(nextPublicUrl);
                if (qrId) {
                    setRedirect(qrId, nextPublicUrl);
                }
            } else {
                setPublicProfileUrl('');
            }
        } else if (user && !businessLoading) {
            setName(user.businessName || '');
            setLogo(user.businessLogo || '');
        }
    }, [business, branch, isAllBranches, activeBranchId, origin, branches.length, user, businessLoading]);

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
                if (hasChanged(cacType, business.cacType)) businessUpdates.cacType = cacType;
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
                if (hasChanged(trustpilotUrl, branch.trustpilotUrl)) branchUpdates.trustpilotUrl = trustpilotUrl;
                if (hasChanged(showReview, branch.showReview)) branchUpdates.showReview = showReview;
                if (hasChanged(showSocial, branch.showSocial)) branchUpdates.showSocial = showSocial;

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
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Social Media & Reviews</h3>
                                <p className="text-xs text-text-secondary mt-1">Manage links to your social pages and review platforms.</p>
                            </div>
                            { (instagramUrl || linkedinUrl || reviewUrl || trustpilotUrl) && (
                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-main">Enable in Journey</span>
                                        <span className="text-[9px] text-text-secondary">Show after form submission</span>
                                    </div>
                                    <button
                                        onClick={() => setShowSocial(!showSocial)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${showSocial ? 'bg-primary' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform ${showSocial ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Instagram URL</label>
                                    <input 
                                        type="url" 
                                        value={instagramUrl} 
                                        onChange={(e) => setInstagramUrl(e.target.value)} 
                                        placeholder="https://instagram.com/your-business" 
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">LinkedIn URL</label>
                                    <input 
                                        type="url" 
                                        value={linkedinUrl} 
                                        onChange={(e) => setLinkedinUrl(e.target.value)} 
                                        placeholder="https://linkedin.com/company/your-business" 
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Google Review URL</label>
                                    <input 
                                        type="url" 
                                        value={reviewUrl} 
                                        onChange={(e) => setReviewUrl(e.target.value)} 
                                        placeholder="https://g.page/r/your-google-code" 
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Trustpilot URL</label>
                                    <input 
                                        type="url" 
                                        value={trustpilotUrl} 
                                        onChange={(e) => setTrustpilotUrl(e.target.value)} 
                                        placeholder="https://trustpilot.com/review/your-business" 
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" 
                                    />
                                </div>
                            </div>

                            {!(instagramUrl || linkedinUrl || reviewUrl || trustpilotUrl) && (
                                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                                    <div className="size-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                        <span className="material-icons-round text-lg">lock</span>
                                    </div>
                                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                        Add at least one link above to enable the social media step in your customer journey.
                                    </p>
                                </div>
                            )}
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
                            {qrId ? (
                                <DynamicQRCode
                                    redirectId={qrId}
                                    label="Scan to Visit Profile"
                                    subLabel={origin.replace(/^https?:\/\//, '')}
                                    color="#000000"
                                />
                            ) : (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-xs text-amber-800 font-bold max-w-sm">
                                    Unique code not available for this business yet.
                                </div>
                            )}
                            <div className="w-full max-w-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Public Profile Link</p>
                                {publicProfileUrl ? (
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                                        <div className="text-xs font-bold text-text-main break-all">{publicProfileUrl}</div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(publicProfileUrl);
                                                toast.success('Public link copied');
                                            }}
                                            className="w-full h-10 rounded-xl bg-white border border-gray-200 text-xs font-black text-text-secondary hover:text-primary hover:border-primary transition-colors"
                                        >
                                            Copy Public Link
                                        </button>
                                        <p className="text-[10px] text-text-secondary">
                                            This link opens the public business profile for the selected branch.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800 font-bold">
                                        Unique code not available for this branch yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (isAllBranches || branches.length <= 1) && (() => {
                    const tasks = [
                        { label: 'Business Name', completed: !!name, icon: 'business' },
                        { label: 'Business Logo', completed: !!logo, icon: 'image' },
                        { label: 'Category & Sub', completed: !!categoryId && (subcategoryId !== 'other' || !!otherSubcategoryName), icon: 'category' },
                        { label: 'Contact Info', completed: !!supportEmail || !!supportPhone, icon: 'contact_phone' },
                        { label: 'Location Details', completed: !!state && !!city && !!address, icon: 'map' },
                        { label: 'Business Reg.', completed: !!registrationNumber, icon: 'fact_check' },
                        { label: 'CAC Document', completed: !!cacDocument, icon: 'description' },
                        { label: 'Owner Identity', completed: !!idDocument, icon: 'person_pin' },
                    ];
                    const completedCount = tasks.filter(t => t.completed).length;
                    const totalCount = tasks.length;
                    const progress = (completedCount / totalCount) * 100;

                    return (
                        <div className="space-y-6">
                            {/* Health Check Progress UI */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-display font-bold text-text-main">Health Check Progress</h3>
                                            {progress === 100 && (
                                                <span className="material-icons-round text-green-500 text-xl">verified</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-text-secondary font-normal">Verify your business to establish trust and unlock all features.</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-2xl font-display font-black text-primary">{Math.round(progress)}% <span className="text-text-secondary text-sm font-normal">Health Score</span></div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1">{completedCount} of {totalCount} tasks completed</div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 flex flex-col gap-6">
                                    <div className="relative pt-1">
                                        <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-100">
                                            <div 
                                                style={{ width: `${progress}%` }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-1000 ease-in-out relative"
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {tasks.map((task, i) => (
                                            <div key={i} className={`flex flex-col gap-2 p-3 rounded-2xl border transition-all ${
                                                task.completed 
                                                ? 'bg-green-50 border-green-100 text-green-700' 
                                                : 'bg-gray-50/50 border-gray-100 text-text-secondary opacity-60'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="material-icons-round text-lg">{task.icon}</span>
                                                    {task.completed && <span className="material-icons-round text-xs">check_circle</span>}
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-tighter truncate">{task.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Business Identity Section (Redesigned & Collapsible) */}
                            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                                <button 
                                    onClick={() => setIsDocsCollapsed(!isDocsCollapsed)}
                                    className="w-full px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                            <span className="material-icons-round text-2xl">corporate_fare</span>
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Business Identity (CAC)</h3>
                                            <p className="text-xs text-text-secondary font-normal">Official Corporate Affairs Commission details</p>
                                        </div>
                                    </div>
                                    <div className={`size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center transition-transform duration-300 ${isDocsCollapsed ? 'rotate-180' : ''}`}>
                                        <span className="material-icons-round text-gray-400">expand_more</span>
                                    </div>
                                </button>

                                {!isDocsCollapsed && (
                                    <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Registration Type</label>
                                                    <select
                                                        value={cacType}
                                                        onChange={(e) => setCacType(e.target.value)}
                                                        className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-normal focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                                                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239ca3af\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.25rem' }}
                                                    >
                                                        <option value="RC">Limited Liability Company (RC)</option>
                                                        <option value="BN">Business Name (BN)</option>
                                                        <option value="IT">Incorporated Trustees (IT)</option>
                                                        <option value="LLP">Limited Liability Partnership (LLP)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">{cacType} Number</label>
                                                    <input
                                                        type="text"
                                                        value={registrationNumber}
                                                        onChange={(e) => setRegistrationNumber(e.target.value)}
                                                        placeholder={`Enter your ${cacType} number`}
                                                        className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-normal focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Upload CAC Document / Certificate</label>
                                                <div className="relative group">
                                                    {!cacDocument ? (
                                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-gray-50 hover:bg-white hover:border-primary/30 transition-all">
                                                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                                                <div className="size-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm text-gray-400 group-hover:text-primary transition-colors">
                                                                    <span className="material-icons-round">cloud_upload</span>
                                                                </div>
                                                                <p className="text-xs font-normal text-text-main">Click to upload doc</p>
                                                                <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-tighter">MAX. 10MB</p>
                                                            </div>
                                                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (ev) => setCacDocument(ev.target?.result as string);
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }} />
                                                        </label>
                                                    ) : (
                                                        <div className="flex items-center justify-between bg-green-50 p-5 rounded-2xl border border-green-100">
                                                            <div className="flex items-center gap-4">
                                                                <div className="size-12 rounded-xl bg-white flex items-center justify-center text-green-600 shadow-sm">
                                                                    <span className="material-icons-round">description</span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-normal text-text-main truncate">CAC Certificate</p>
                                                                    <p className="text-[10px] text-green-600 font-normal uppercase tracking-widest">Attached</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => setCacDocument('')}
                                                                className="size-10 rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                                                            >
                                                                <span className="material-icons-round text-lg">delete_outline</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Means of Identity Section (Personal ID) */}
                            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                            <span className="material-icons-round text-2xl">badge</span>
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Means of Identity</h3>
                                            <p className="text-xs text-text-secondary font-normal">Valid government-issued ID for verification</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-amber-100/50 text-amber-600 text-[10px] font-normal uppercase tracking-widest rounded-lg border border-amber-200/50">KYC Requirement</span>
                                </div>

                                <div className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Identity Type</label>
                                            <select
                                                className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-normal focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%239ca3af\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.25rem' }}
                                            >
                                                <option>National ID (NIN)</option>
                                                <option>Drivers License</option>
                                                <option>International Passport</option>
                                                <option>Voter's Card</option>
                                            </select>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Upload Identity Card Photo</label>
                                            <div className="relative group">
                                                {!idDocument ? (
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-gray-50 hover:bg-white hover:border-primary/30 transition-all">
                                                        <div className="flex flex-col items-center justify-center p-6 text-center">
                                                            <div className="size-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm text-gray-400 group-hover:text-primary transition-colors">
                                                                <span className="material-icons-round">face</span>
                                                            </div>
                                                            <p className="text-xs font-normal text-text-main">Click to upload ID</p>
                                                        </div>
                                                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (ev) => setIdDocument(ev.target?.result as string);
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }} />
                                                    </label>
                                                ) : (
                                                    <div className="flex items-center justify-between bg-green-50 p-5 rounded-2xl border border-green-100">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-12 rounded-xl bg-white flex items-center justify-center text-green-600 shadow-sm">
                                                                <span className="material-icons-round">assignment_ind</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-normal text-text-main truncate">Owner ID Document</p>
                                                                <p className="text-[10px] text-green-600 font-normal uppercase tracking-widest">Attached</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setIdDocument('')}
                                                            className="size-10 rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                                                        >
                                                            <span className="material-icons-round text-lg">delete_outline</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {activeTab === 'general' && (
                    <div className="pt-4 flex items-center justify-between px-2">
                        <button className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors">Deactivate Business Profile</button>
                    </div>
                )}
            </div>
        </div>
    );
}
