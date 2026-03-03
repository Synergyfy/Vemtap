'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { toast } from 'react-hot-toast';
import DynamicQRCode from '@/components/shared/DynamicQRCode';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useMyBusiness, useUpdateBusiness } from '@/services/businesses/hooks';
import { BusinessHours } from '@/services/businesses/types';
import { Loader2 } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function BusinessProfilePage() {
    const { storeName, logoUrl, updateCustomSettings, setRedirect } = useCustomerFlowStore();

    const { data: business, isLoading } = useMyBusiness();
    const updateMutation = useUpdateBusiness();

    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
    const [profileSlug, setProfileSlug] = useState('');
    const [businessType, setBusinessType] = useState('');
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

    const [origin, setOrigin] = useState('https://vemtap.com');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    // Config for Dynamic QR
    const qrId = 'biz-profile-main';

    useEffect(() => {
        if (business) {
            setName(business.name || storeName);
            setLogo(business.logoUrl || logoUrl || '');
            setBusinessType(business.category || 'RESTAURANT');
            setSupportEmail(business.officialEmail || 'hello@vemtap.com');
            setSupportPhone(business.whatsappNumber || '+234 801 234 5678');
            setAddress(business.address || '42 Admiralty Way, Lekki Phase 1, Lagos, Nigeria');

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

            if (!profileSlug) {
                const slug = (business.name || storeName).toLowerCase().replace(/\s+/g, '-');
                setProfileSlug(slug);
                setRedirect(qrId, `${origin}/${slug}`);
            }
        }
    }, [business, storeName, logoUrl, origin]);

    const handleSave = () => {
        if (!business) return;

        updateMutation.mutate({
            id: business.id,
            updates: {
                name,
                logoUrl: logo,
                category: businessType,
                officialEmail: supportEmail,
                whatsappNumber: supportPhone,
                address: address,
                about,
                welcomeMessage,
                successMessage,
                privacyMessage,
                rewardMessage,
                businessHours,
                rewardEnabled,
                rewardVisitThreshold,
                facebookUrl,
                instagramUrl,
                tiktokUrl,
                xUrl,
                youtubeUrl,
                customLink,
                linkedinUrl,
                reviewUrl,
                showReview,
                showSocial,
                showFeedback
            }
        }, {
            onSuccess: () => {
                updateCustomSettings({ logoUrl: logo });
                useCustomerFlowStore.setState({ storeName: name });
                const fullProfileUrl = `${origin}/${profileSlug}`;
                setRedirect(qrId, fullProfileUrl);
                toast.success('Business profile and QR Link updated!');
            },
            onError: () => {
                toast.error('Failed to update business profile.');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }


    return (
        <div className="p-8 max-w-4xl mx-auto">
            <PageHeader
                title="Business Profile"
                description="Update your business information and online presence"
                actions={
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                        {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
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
                            <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="hello@vemtap.com" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Support Phone</label>
                            <input type="tel" value={supportPhone} onChange={e => setSupportPhone(e.target.value)} placeholder="+234 801 234 5678" className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                        </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Detailed Address</label>
                            <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="42 Admiralty Way, Lekki Phase 1, Lagos, Nigeria" rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none" />
                        </div>
                    </div>
                </div>

                {/* About Section */}
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
                                placeholder="A luxury dining experience with ocean views."
                                rows={4}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Business Hours Section */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Business Hours</h3>
                        <p className="text-xs text-text-secondary font-medium">Set your operating hours for each day</p>
                    </div>
                    <div className="p-8 space-y-4">
                        {DAYS.map((day) => (
                            <div key={day} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-28">
                                    <span className="text-xs font-black uppercase tracking-widest text-text-secondary capitalize">{day}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!businessHours[day]?.closed}
                                            onChange={(e) => {
                                                setBusinessHours(prev => ({
                                                    ...prev,
                                                    [day]: { ...prev[day], closed: !e.target.checked }
                                                }));
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-xs font-bold text-text-secondary">Open</span>
                                    </label>
                                </div>
                                <div className="flex-1 flex items-center gap-3">
                                    <input
                                        type="time"
                                        value={businessHours[day]?.open || '09:00'}
                                        onChange={(e) => {
                                            setBusinessHours(prev => ({
                                                ...prev,
                                                [day]: { ...prev[day], open: e.target.value }
                                            }));
                                        }}
                                        disabled={businessHours[day]?.closed}
                                        className="w-32 h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-text-secondary text-xs font-bold">to</span>
                                    <input
                                        type="time"
                                        value={businessHours[day]?.close || '18:00'}
                                        onChange={(e) => {
                                            setBusinessHours(prev => ({
                                                ...prev,
                                                [day]: { ...prev[day], close: e.target.value }
                                            }));
                                        }}
                                        disabled={businessHours[day]?.closed}
                                        className="w-32 h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Messages Section */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Customer Messages</h3>
                        <p className="text-xs text-text-secondary font-medium">Customize messages shown to customers during check-in</p>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Welcome Message</label>
                            <input
                                type="text"
                                value={welcomeMessage}
                                onChange={(e) => setWelcomeMessage(e.target.value)}
                                placeholder="Welcome to our store!"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Success Message</label>
                            <input
                                type="text"
                                value={successMessage}
                                onChange={(e) => setSuccessMessage(e.target.value)}
                                placeholder="Check-in Complete!"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Privacy Message</label>
                            <input
                                type="text"
                                value={privacyMessage}
                                onChange={(e) => setPrivacyMessage(e.target.value)}
                                placeholder="We value your privacy."
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Reward Message</label>
                            <input
                                type="text"
                                value={rewardMessage}
                                onChange={(e) => setRewardMessage(e.target.value)}
                                placeholder="10% Off your next visit!"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Media Links */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Social Media & Links</h3>
                        <p className="text-xs text-text-secondary font-medium">Add your social media profiles and other links</p>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Facebook URL</label>
                            <input
                                type="url"
                                value={facebookUrl}
                                onChange={(e) => setFacebookUrl(e.target.value)}
                                placeholder="https://facebook.com/yourbusiness"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Instagram URL</label>
                            <input
                                type="url"
                                value={instagramUrl}
                                onChange={(e) => setInstagramUrl(e.target.value)}
                                placeholder="https://instagram.com/yourbusiness"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">TikTok URL</label>
                            <input
                                type="url"
                                value={tiktokUrl}
                                onChange={(e) => setTiktokUrl(e.target.value)}
                                placeholder="https://tiktok.com/@yourbusiness"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">X (Twitter) URL</label>
                            <input
                                type="url"
                                value={xUrl}
                                onChange={(e) => setXUrl(e.target.value)}
                                placeholder="https://x.com/yourbusiness"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">YouTube URL</label>
                            <input
                                type="url"
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://youtube.com/@yourbusiness"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">LinkedIn URL</label>
                            <input
                                type="url"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                placeholder="https://linkedin.com/company/yourbusiness"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Custom Link</label>
                            <input
                                type="url"
                                value={customLink}
                                onChange={(e) => setCustomLink(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Review URL</label>
                            <input
                                type="url"
                                value={reviewUrl}
                                onChange={(e) => setReviewUrl(e.target.value)}
                                placeholder="https://google.com/reviews/yourbusiness"
                                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Display Settings */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Display Settings</h3>
                        <p className="text-xs text-text-secondary font-medium">Control what customers see on your profile</p>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <span className="text-sm font-bold text-text-main">Show Reviews</span>
                                <p className="text-xs text-text-secondary">Display review option on customer check-in</p>
                            </div>
                            <button
                                onClick={() => setShowReview(!showReview)}
                                className={`w-12 h-6 rounded-full transition-all ${showReview ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${showReview ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <span className="text-sm font-bold text-text-main">Show Social Links</span>
                                <p className="text-xs text-text-secondary">Display social media links on your profile</p>
                            </div>
                            <button
                                onClick={() => setShowSocial(!showSocial)}
                                className={`w-12 h-6 rounded-full transition-all ${showSocial ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${showSocial ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <span className="text-sm font-bold text-text-main">Show Feedback</span>
                                <p className="text-xs text-text-secondary">Allow customers to leave feedback</p>
                            </div>
                            <button
                                onClick={() => setShowFeedback(!showFeedback)}
                                className={`w-12 h-6 rounded-full transition-all ${showFeedback ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${showFeedback ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reward Settings */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Reward Settings</h3>
                        <p className="text-xs text-text-secondary font-medium">Set up loyalty rewards for your customers</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <span className="text-sm font-bold text-text-main">Enable Rewards</span>
                                <p className="text-xs text-text-secondary">Allow customers to earn rewards on visits</p>
                            </div>
                            <button
                                onClick={() => setRewardEnabled(!rewardEnabled)}
                                className={`w-12 h-6 rounded-full transition-all ${rewardEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${rewardEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Visits Until Reward</label>
                            <input
                                type="number"
                                value={rewardVisitThreshold}
                                onChange={(e) => setRewardVisitThreshold(parseInt(e.target.value) || 1)}
                                min={1}
                                disabled={!rewardEnabled}
                                className="w-full md:w-48 h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <p className="text-xs text-text-secondary">Number of visits required before a reward is given</p>
                        </div>
                    </div>
                </div>

                {/* Dynamic QR Code Section */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div>
                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Dynamic Business QR</h3>
                            <p className="text-xs text-text-secondary font-medium">This QR code always redirects to your profile link above. You can change the link anytime without reprinting.</p>
                        </div>
                        <button
                            onClick={() => window.open(`/${profileSlug}`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary/20 transition-colors"
                        >
                            <span className="material-icons-round text-sm">open_in_new</span>
                            View Public Profile
                        </button>
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
                                <div 
                                    onClick={() => window.open(`/${profileSlug}`, '_blank')}
                                    className="h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 flex items-center text-sm font-bold text-primary cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all"
                                >
                                    {`${origin.replace(/^https?:\/\//, '')}/${profileSlug}`}
                                    <span className="material-icons-round text-sm ml-auto">open_in_new</span>
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
