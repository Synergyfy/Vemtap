'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import { useRewards } from '@/services/loyalty/hooks';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import ProfileTabs from '@/components/dashboard/settings/profile/ProfileTabs';
import PushNotificationsTab from '@/components/dashboard/settings/profile/PushNotificationsTab';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, Instagram, Linkedin, Twitter, Facebook, Globe, Star, Plus, Trash2, X,
    ChevronDown
} from 'lucide-react';

// Social Media Platforms Configuration
const SOCIAL_PLATFORMS = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', placeholder: 'yourbrand', prefix: 'https://instagram.com/' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', placeholder: 'yourbrand', prefix: 'https://facebook.com/' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50', placeholder: 'company/yourbrand', prefix: 'https://linkedin.com/' },
    { id: 'google', name: 'Google Review', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', placeholder: 'https://g.page/r/...' },
    { id: 'trustpilot', name: 'Trustpilot', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50', placeholder: 'https://trustpilot.com/review/...' },
    { id: 'custom', name: 'Custom Link', icon: Globe, color: 'text-slate-600', bg: 'bg-slate-50', placeholder: 'https://...' },
];

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
    const searchParams = useSearchParams();
    const { storeName, logoUrl, updateCustomSettings, setRedirect } = useCustomerFlowStore();
    const user = useAuthStore((state) => state.user);
    const { activeBranchId, isAllBranches: rawIsAllBranches } = useActiveBranch();

    const { data: business, isLoading: businessLoading } = useMyBusiness();
    const { data: branches = [] } = useBranches();
    
    const isAllBranches = rawIsAllBranches && branches.length > 1;
    const effectiveBranchId = activeBranchId || (branches.length === 1 ? branches[0].id : '');
    const { data: branch, isLoading: branchLoading } = useBranch(effectiveBranchId);
    const { data: rewards = [], isLoading: rewardsLoading } = useRewards(effectiveBranchId || undefined);
    
    const updateMutation = useUpdateBusiness();
    const updateBranchMutation = useUpdateBranch();
    const [selectedRewardToEnable, setSelectedRewardToEnable] = useState<{
        reward: any;
        targetStatus: boolean;
        previousStatus: boolean;
    } | null>(null);
    const [localRewardVisibility, setLocalRewardVisibility] = useState<Record<string, boolean>>({});

    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
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
    const [identityNumber, setIdentityNumber] = useState('');
    const [utilityBill, setUtilityBill] = useState('');
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
    const [showRewards, setShowRewards] = useState(true);
    const [activeTab, setActiveTab] = useState('general');

    // Social Media Selection State
    const [isSocialDropdownOpen, setIsSocialDropdownOpen] = useState(false);
    const [selectedSocial, setSelectedSocial] = useState<typeof SOCIAL_PLATFORMS[0] | null>(null);
    const [socialHandle, setSocialHandle] = useState('');

    const handleAddSocial = () => {
        if (!selectedSocial || !socialHandle.trim()) return;

        let finalUrl = socialHandle.trim();
        if (selectedSocial.prefix && !finalUrl.startsWith('http')) {
            finalUrl = selectedSocial.prefix + finalUrl;
        }

        if (selectedSocial.id === 'instagram') setInstagramUrl(finalUrl);
        else if (selectedSocial.id === 'facebook') setFacebookUrl(finalUrl);
        else if (selectedSocial.id === 'linkedin') setLinkedinUrl(finalUrl);
        else if (selectedSocial.id === 'google') setReviewUrl(finalUrl);
        else if (selectedSocial.id === 'trustpilot') setTrustpilotUrl(finalUrl);
        else if (selectedSocial.id === 'custom') setCustomLink(finalUrl);

        setSocialHandle('');
        setSelectedSocial(null);
        setIsSocialDropdownOpen(false);
    };

    const removeSocial = (id: string) => {
        if (id === 'instagram') setInstagramUrl('');
        else if (id === 'facebook') setFacebookUrl('');
        else if (id === 'linkedin') setLinkedinUrl('');
        else if (id === 'google') setReviewUrl('');
        else if (id === 'trustpilot') setTrustpilotUrl('');
        else if (id === 'custom') setCustomLink('');
    };

    const activeSocials = [
        { ...SOCIAL_PLATFORMS[0], url: instagramUrl },
        { ...SOCIAL_PLATFORMS[1], url: facebookUrl },
        { ...SOCIAL_PLATFORMS[2], url: linkedinUrl },
        { ...SOCIAL_PLATFORMS[3], url: reviewUrl },
        { ...SOCIAL_PLATFORMS[4], url: trustpilotUrl },
        { ...SOCIAL_PLATFORMS[5], url: customLink },
    ].filter(s => s.url);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['general', 'push', 'schedule', 'socials', 'rewards', 'qr', 'documents'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const [isEditingGeneral, setIsEditingGeneral] = useState(false);
    const [showRewardsModal, setShowRewardsModal] = useState(false);
    const [pushSupported, setPushSupported] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [pushSubscribed, setPushSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushError, setPushError] = useState<string | null>(null);

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

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i += 1) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const refreshPushStatus = async () => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            setPushSubscribed(false);
            return;
        }
        const subscription = await registration.pushManager.getSubscription();
        setPushSubscribed(!!subscription);
    };

    const handleEnablePush = async () => {
        if (!pushSupported) {
            toast.error('Push notifications are not supported on this device.');
            return;
        }
        setPushLoading(true);
        setPushError(null);
        try {
            const permission = await Notification.requestPermission();
            setPushPermission(permission);
            if (permission !== 'granted') {
                toast.error('Please allow browser notifications to continue.');
                return;
            }
            if (!vapidPublicKey) {
                setPushError('Missing VAPID public key. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to enable push.');
                toast.error('Push setup is missing a VAPID public key.');
                return;
            }

            await navigator.serviceWorker.register('/sw.js');
            const registration = await navigator.serviceWorker.ready;

            if (!registration.active) {
                throw new Error('Service Worker failed to activate.');
            }

            const existing = await registration.pushManager.getSubscription();
            const subscription = existing || await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            await api.post('/notifications/push/register', {
                token: JSON.stringify(subscription),
                isUser: user?.role === 'customer',
            });

            setPushSubscribed(true);
            toast.success('Push notifications enabled.');
        } catch (error: any) {
            const message = error?.message || 'Failed to enable push notifications.';
            setPushError(message);
            toast.error(message);
        } finally {
            setPushLoading(false);
        }
    };

    const handleDisablePush = async () => {
        setPushLoading(true);
        setPushError(null);
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            const subscription = await registration?.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }
            setPushSubscribed(false);
            toast.success('Push notifications disabled.');
        } catch (error: any) {
            const message = error?.message || 'Failed to disable push notifications.';
            setPushError(message);
            toast.error(message);
        } finally {
            setPushLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
        setPushSupported(supported);
        if (!supported) return;
        setPushPermission(Notification.permission);
        refreshPushStatus();
    }, []);

    useEffect(() => {
        if (activeTab === 'push') {
            refreshPushStatus();
        }
    }, [activeTab]);

    const firstBranchWithCode = branches.find((b) => b.uniqueCode);
    const fallbackProfileCode = firstBranchWithCode?.uniqueCode || business?.uniqueCode || '';
    
    // Check if the current branch is the main branch or if it's the only branch
    const isMainBranch = branch?.isMainBranch || (branches.length === 1 && branches[0].id === effectiveBranchId);
    const useBusinessLevelCode = isAllBranches || isMainBranch;

    // Use business unique code for main branch or aggregate view
    const qrId = (useBusinessLevelCode ? (business?.uniqueCode || branch?.uniqueCode) : branch?.uniqueCode) || fallbackProfileCode || '';
    
    // Calculate publicProfileUrl directly in render for reliability
    const derivedPublicCode = (useBusinessLevelCode ? (business?.uniqueCode || branch?.uniqueCode) : (branch?.uniqueCode || business?.uniqueCode)) || fallbackProfileCode || qrId;
    const derivedPublicProfileUrl = derivedPublicCode ? `${origin}/b/${derivedPublicCode}` : '';

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

            setFacebookUrl(source.facebookUrl || business?.facebookUrl || '');
            setInstagramUrl(source.instagramUrl || business?.instagramUrl || '');
            setTiktokUrl(source.tiktokUrl || business?.tiktokUrl || '');
            setXUrl(source.xUrl || business?.xUrl || '');
            setYoutubeUrl(source.youtubeUrl || business?.youtubeUrl || '');
            setCustomLink(source.customLink || business?.customLink || '');
            
            setLinkedinUrl(source.linkedinUrl || business?.linkedinUrl || '');
            setReviewUrl(source.reviewUrl || '');
            setTrustpilotUrl(source.trustpilotUrl || '');

            setShowReview(business?.showReview ?? true);
            setShowSocial(business?.showSocial ?? true);
            setShowFeedback(business?.showFeedback ?? true);
            setShowRewards(business?.showRewards ?? true);

            if (business) {
                setCacDocument(business.cacDocument || '');
                setIdDocument(business.idDocument || '');
                setIsRegistered(business.isRegistered || false);
                setRegistrationNumber(business.registrationNumber || '');
                if ((business.registrationNumber || '').startsWith('BN')) setCacType('BN');
                else if ((business.registrationNumber || '').startsWith('IT')) setCacType('IT');
                else setCacType('RC');
                setIdentityNumber(business.identityNumber || '');
                setUtilityBill(business.utilityBill || '');
            }

            // Still update the redirect side effect
            if (qrId && derivedPublicProfileUrl) {
                setRedirect(qrId, derivedPublicProfileUrl);
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
            setTrustpilotUrl(branch.trustpilotUrl || '');

            setShowReview(branch.showReview ?? true);
            setShowSocial(branch.showSocial ?? true);
            setShowFeedback(branch.showFeedback ?? true);
            setShowRewards(branch.showRewards ?? true);
            setIdentityNumber(branch.identityNumber || '');
            setUtilityBill(branch.utilityBill || '');


            // Still update the redirect side effect
            if (qrId && derivedPublicProfileUrl) {
                setRedirect(qrId, derivedPublicProfileUrl);
            }
        } else if (user) {
            setName(user.businessName || '');
            setLogo(user.businessLogo || '');
            
            // Still update the redirect side effect
            if (qrId && derivedPublicProfileUrl) {
                setRedirect(qrId, derivedPublicProfileUrl);
            }
        }
    }, [business, branch, isAllBranches, activeBranchId, origin, branches.length, fallbackProfileCode, qrId, user, useBusinessLevelCode, setRedirect, derivedPublicProfileUrl]);

    const loadLocalRewardVisibilityFromStorage = () => {
        if (typeof window === 'undefined') return;
        try {
            const data = localStorage.getItem('vemtap_reward_visibility');
            if (data) {
                const parsed = JSON.parse(data || '{}');
                if (parsed && typeof parsed === 'object') {
                    setLocalRewardVisibility(parsed);
                }
            }
        } catch (error) {
            console.warn('Failed to read reward visibility from localStorage', error);
        }
    };

    const persistRewardVisibilityToStorage = (updatedVisibility: Record<string, boolean>) => {
        setLocalRewardVisibility(updatedVisibility);
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('vemtap_reward_visibility', JSON.stringify(updatedVisibility));
        } catch (error) {
            console.warn('Failed to save reward visibility to localStorage', error);
        }
    };

    useEffect(() => {
        loadLocalRewardVisibilityFromStorage();
    }, []);

    const handleRewardToggle = (reward: any) => {
        if (!reward?.id) return;

        const currentlyActive = localRewardVisibility.hasOwnProperty(reward.id)
            ? localRewardVisibility[reward.id]
            : reward.isActive !== false;

        const targetStatus = !currentlyActive;
        setSelectedRewardToEnable({ reward, targetStatus, previousStatus: currentlyActive });

        // optimistic UI toggle before confirmation
        setLocalRewardVisibility(prev => ({ ...prev, [reward.id]: targetStatus }));
        setShowRewardsModal(true);
    };

    const cancelRewardToggle = () => {
        if (selectedRewardToEnable?.reward?.id) {
            setLocalRewardVisibility(prev => ({
                ...prev,
                [selectedRewardToEnable.reward.id]: selectedRewardToEnable.previousStatus,
            }));
        }
        setSelectedRewardToEnable(null);
        setShowRewardsModal(false);
    };

    const confirmRewardToggle = () => {
        if (!selectedRewardToEnable?.reward?.id) {
            setShowRewardsModal(false);
            return;
        }

        const { reward, targetStatus } = selectedRewardToEnable;
        const updatedVisibility = {
            ...localRewardVisibility,
            [reward.id]: targetStatus,
        };

        persistRewardVisibilityToStorage(updatedVisibility);
        setShowRewardsModal(false);
        setSelectedRewardToEnable(null);
        toast.success(`${reward.name || 'Reward'} ${targetStatus ? 'enabled' : 'disabled'} for public profiles.`);
    };

    const handleSave = async () => {
        const hasChanged = (current: any, original: any) => {
            const normalizedCurrent = current === '' || current === null ? undefined : current;
            const normalizedOriginal = original === '' || original === null ? undefined : original;
            return normalizedCurrent !== normalizedOriginal;
        };

        try {
            if (!business && !branch) {
                toast.error('Profile data not loaded yet. Please try again.');
                return;
            }

            let finalLogoUrl = logo;
            if (logo && logo.startsWith('data:image')) {
                const uploadToast = toast.loading('Uploading new logo...');
                
                finalLogoUrl = await uploadToCloudinary(logo);
                setLogo(finalLogoUrl);
                toast.dismiss(uploadToast);
            }

            let finalCacDocument = cacDocument;
            let finalIdDocument = idDocument;
            let finalUtilityBill = utilityBill;
            if (cacDocument && cacDocument.startsWith('data:image')) finalCacDocument = await uploadToCloudinary(cacDocument);
            if (idDocument && idDocument.startsWith('data:image')) finalIdDocument = await uploadToCloudinary(idDocument);
            if (utilityBill && utilityBill.startsWith('data:image')) finalUtilityBill = await uploadToCloudinary(utilityBill);

            let didUpdate = false;

            if (business) {
                const businessUpdates: any = {};
                const normalizedSubcategoryId = subcategoryId === 'other' ? null : (subcategoryId || null);
                const nextOtherSubcategoryName = subcategoryId === 'other' ? otherSubcategoryName : '';

                if (hasChanged(instagramUrl, business.instagramUrl)) businessUpdates.instagramUrl = instagramUrl;
                if (hasChanged(facebookUrl, business.facebookUrl)) businessUpdates.facebookUrl = facebookUrl;
                if (hasChanged(linkedinUrl, business.linkedinUrl)) businessUpdates.linkedinUrl = linkedinUrl;
                if (hasChanged(reviewUrl, business.reviewUrl)) businessUpdates.reviewUrl = reviewUrl;
                if (hasChanged(trustpilotUrl, business.trustpilotUrl)) businessUpdates.trustpilotUrl = trustpilotUrl;
                if (hasChanged(customLink, business.customLink)) businessUpdates.customLink = customLink;

                if (hasChanged(categoryId, business.categoryId)) businessUpdates.categoryId = categoryId || null;
                if (hasChanged(normalizedSubcategoryId, business.subcategoryId)) businessUpdates.subcategoryId = normalizedSubcategoryId;
                if (hasChanged(nextOtherSubcategoryName, business.otherSubcategoryName)) {
                    businessUpdates.otherSubcategoryName = nextOtherSubcategoryName || null;
                }
                if (hasChanged(isRegistered, business.isRegistered)) businessUpdates.isRegistered = isRegistered;
                if (hasChanged(registrationNumber, business.registrationNumber)) businessUpdates.registrationNumber = registrationNumber;
                if (hasChanged(identityNumber, business.identityNumber)) businessUpdates.identityNumber = identityNumber;

                if (isAllBranches) {
                    if (hasChanged(name, business.name)) businessUpdates.name = name;
                    if (hasChanged(state, business.state)) businessUpdates.state = state;
                    if (hasChanged(city, business.city)) businessUpdates.city = city;
                    if (hasChanged(finalLogoUrl, business.logoUrl)) businessUpdates.logoUrl = finalLogoUrl;
                }

                const docs = [finalCacDocument, finalIdDocument, finalUtilityBill].filter(Boolean);
                if (docs.length > 0) businessUpdates.documents = docs;

                if (Object.keys(businessUpdates).length > 0) {
                    await updateMutation.mutateAsync({ id: business.id, updates: businessUpdates });
                    toast.success('Business profile updated successfully!');
                    didUpdate = true;
                }
            }

            if (!isAllBranches && branch) {
                const branchUpdates: any = {};
                if (hasChanged(name, branch.name)) branchUpdates.name = name;
                if (hasChanged(finalLogoUrl, branch.logoUrl)) branchUpdates.logoUrl = finalLogoUrl;

                if (hasChanged(instagramUrl, branch.instagramUrl)) branchUpdates.instagramUrl = instagramUrl;
                if (hasChanged(facebookUrl, branch.facebookUrl)) branchUpdates.facebookUrl = facebookUrl;
                if (hasChanged(linkedinUrl, branch.linkedinUrl)) branchUpdates.linkedinUrl = linkedinUrl;
                if (hasChanged(reviewUrl, branch.reviewUrl)) branchUpdates.reviewUrl = reviewUrl;
                if (hasChanged(trustpilotUrl, branch.trustpilotUrl)) branchUpdates.trustpilotUrl = trustpilotUrl;

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

                if (hasChanged(linkedinUrl, branch.linkedinUrl)) branchUpdates.linkedinUrl = linkedinUrl;
                if (hasChanged(reviewUrl, branch.reviewUrl)) branchUpdates.reviewUrl = reviewUrl;
                if (hasChanged(showReview, branch.showReview)) branchUpdates.showReview = showReview;
                if (hasChanged(showSocial, branch.showSocial)) branchUpdates.showSocial = showSocial;
                if (hasChanged(showFeedback, branch.showFeedback)) branchUpdates.showFeedback = showFeedback;
                if (hasChanged(identityNumber, branch.identityNumber)) branchUpdates.identityNumber = identityNumber;
                if (hasChanged(finalUtilityBill, branch.utilityBill)) branchUpdates.utilityBill = finalUtilityBill;

                if (Object.keys(branchUpdates).length > 0) {
                    await updateBranchMutation.mutateAsync({ id: branch.id, updates: branchUpdates });
                    toast.success('Branch profile updated successfully!');
                    didUpdate = true;
                }
                }
                if (didUpdate) {
                setIsEditingGeneral(false);
                } else {
                toast.success('No changes discovered.');
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
        { id: 'push', label: 'Push', icon: 'notifications_active' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar_today', branchOnly: true },
        { id: 'socials', label: 'Socials', icon: 'share', branchOnly: true },
        { id: 'rewards', label: 'Rewards', icon: 'auto_awesome', branchOnly: true },
        { id: 'qr', label: 'QR Code', icon: 'qr_code_2' },
        { id: 'documents', label: 'Documents', icon: 'description', bizOnly: true },
    ].filter((tab) => {
        if (isAllBranches) {
            return !tab.branchOnly; 
        }
        return true; 
    });

    // Health Check Progress Data
    const healthTasks = [
        { label: 'Business Name', completed: !!name, icon: 'business' },
        { label: 'Business Logo', completed: !!logo, icon: 'image' },
        { label: 'Category & Sub', completed: !!categoryId && (subcategoryId !== 'other' || !!otherSubcategoryName), icon: 'category' },
        { label: 'Contact Info', completed: !!supportEmail || !!supportPhone, icon: 'contact_phone' },
        { label: 'Location Details', completed: !!state && !!city && !!address, icon: 'map' },
        { label: 'Business Reg.', completed: isRegistered ? !!registrationNumber : true, icon: 'fact_check' },
        { label: 'CAC Document', completed: isRegistered ? !!cacDocument : true, icon: 'description' },
        { label: 'Owner Identity', completed: !!idDocument && !!identityNumber, icon: 'person_pin' },
        { label: 'Utility Bill', completed: !!utilityBill, icon: 'receipt_long' },
    ];
    const completedCount = healthTasks.filter(t => t.completed).length;
    const totalCount = healthTasks.length;
    const progress = (completedCount / totalCount) * 100;


    return (
        <div className="p-8 max-w-4xl mx-auto">
            <PageHeader
                title="Business Profile"
                description="Update your business information and online presence"
                actions={
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending || updateBranchMutation.isPending || (activeTab === 'general' && !isEditingGeneral)}
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
                            You are viewing global settings. You can edit <strong>General Info</strong>, <strong>Documents</strong>, and <strong>Business QR</strong> here. 
                            To edit branch-specific schedules, socials, or rewards, please <strong>select a specific branch</strong> from the header.
                        </p>
                    </div>
                </div>
            )}

            <ProfileTabs tabs={availableTabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'general' && (
                    <div className="space-y-8">
                        {/* Health Check Progress UI */}
                        {(isAllBranches || branches.length <= 1) && (
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
                                        {healthTasks.map((task, i) => (
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
                        )}

                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Branding & Identity</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsEditingGeneral(!isEditingGeneral)}
                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                            isEditingGeneral 
                                            ? 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100' 
                                            : 'bg-white text-primary border border-primary/20 hover:bg-primary/5'
                                        }`}
                                    >
                                        <span className="material-icons-round text-sm">{isEditingGeneral ? 'close' : 'edit'}</span>
                                        {isEditingGeneral ? 'Cancel' : 'Edit Profile'}
                                    </button>
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-green-100">Verified Business</span>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className={`size-32 rounded-3xl bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden relative shadow-inner group ${!isEditingGeneral ? 'border-transparent bg-transparent shadow-none' : ''}`}>
                                            {logo ? (
                                                <>
                                                    <img src={logo} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" />
                                                    {isEditingGeneral && (
                                                        <button
                                                            onClick={() => setLogo('')}
                                                            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <span className="material-icons-round text-sm">delete</span>
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                                    <span className="material-icons-round text-4xl">add_a_photo</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">No Logo</span>
                                                </div>
                                            )}
                                            {isEditingGeneral && (
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
                                            )}
                                        </div>
                                        {isEditingGeneral && (
                                            <div className="w-full max-w-[200px] space-y-3">
                                                <button
                                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                                    className="w-full h-10 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-icons-round text-sm">upload</span>
                                                    Upload Logo
                                                </button>
                                            </div>
                                        )}
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
                                                    readOnly={!isEditingGeneral}
                                                    className={`w-full h-12 rounded-xl px-4 text-sm font-bold transition-all outline-none ${
                                                        isEditingGeneral 
                                                        ? 'bg-gray-50 border border-gray-200 focus:bg-white focus:ring-4 focus:ring-primary/10' 
                                                        : 'bg-transparent border-transparent cursor-default px-0'
                                                    }`}
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
                                                        ) : !isEditingGeneral ? (
                                                            <div className="w-full h-12 flex items-center text-sm font-bold">
                                                                {categories.find((c: any) => c.id === categoryId)?.name || 'Not specified'}
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
                                                        {!isEditingGeneral ? (
                                                            <div className="w-full h-12 flex items-center text-sm font-bold">
                                                                {subcategoryId === 'other' ? otherSubcategoryName : (subcategories.find((s: any) => s.id === subcategoryId)?.name || 'Not specified')}
                                                            </div>
                                                        ) : (
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
                                                        )}
                                                    </div>
                                                </div>

                                                {subcategoryId === 'other' && isEditingGeneral && (
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
                                                {!isEditingGeneral ? (
                                                    <div className="w-full h-12 flex items-center text-sm font-bold">
                                                        {state || 'Not specified'}
                                                    </div>
                                                ) : (
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
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">City</label>
                                                {!isEditingGeneral ? (
                                                    <div className="w-full h-12 flex items-center text-sm font-bold">
                                                        {city || 'Not specified'}
                                                    </div>
                                                ) : (
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
                                                )}
                                            </div>
                                        </div>

                                        {(isAllBranches || branches.length <= 1) && (
                                            <>
                                                
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
                                        <input 
                                            type="email" 
                                            value={supportEmail} 
                                            onChange={e => setSupportEmail(e.target.value)} 
                                            placeholder="hello@vemtap.com" 
                                            readOnly={!isEditingGeneral}
                                            className={`w-full h-12 rounded-xl px-4 text-sm font-bold transition-all outline-none ${
                                                isEditingGeneral 
                                                ? 'bg-gray-50 border border-gray-200 focus:bg-white focus:ring-4 focus:ring-primary/10' 
                                                : 'bg-transparent border-transparent cursor-default px-0'
                                            }`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Support Phone</label>
                                        <input 
                                            type="tel" 
                                            value={supportPhone} 
                                            onChange={e => setSupportPhone(e.target.value)} 
                                            placeholder="+234 801 234 5678" 
                                            readOnly={!isEditingGeneral}
                                            className={`w-full h-12 rounded-xl px-4 text-sm font-bold transition-all outline-none ${
                                                isEditingGeneral 
                                                ? 'bg-gray-50 border border-gray-200 focus:bg-white focus:ring-4 focus:ring-primary/10' 
                                                : 'bg-transparent border-transparent cursor-default px-0'
                                            }`}
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Detailed Address</label>
                                        <textarea 
                                            value={address} 
                                            onChange={e => setAddress(e.target.value)} 
                                            placeholder="Address..." 
                                            rows={3} 
                                            readOnly={!isEditingGeneral}
                                            className={`w-full rounded-xl p-5 text-sm font-bold transition-all outline-none resize-none ${
                                                isEditingGeneral 
                                                ? 'bg-gray-50 border border-gray-200 focus:bg-white focus:ring-4 focus:ring-primary/10' 
                                                : 'bg-transparent border-transparent cursor-default px-0'
                                            }`}
                                        />
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
                                            readOnly={!isEditingGeneral}
                                            className={`w-full rounded-xl p-5 text-sm font-bold transition-all outline-none resize-none ${
                                                isEditingGeneral 
                                                ? 'bg-gray-50 border border-gray-200 focus:bg-white focus:ring-4 focus:ring-primary/10' 
                                                : 'bg-transparent border-transparent cursor-default px-0'
                                            }`}
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
                            { activeSocials.length > 0 && (
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
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {/* Selection Area */}
                                    <div className="relative">
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSocialDropdownOpen(!isSocialDropdownOpen)}
                                                    className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl px-4 flex items-center justify-between text-sm font-bold text-text-main hover:bg-gray-100 transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {selectedSocial ? (
                                                            <>
                                                                <div className={`p-1.5 rounded-lg bg-white shadow-sm ${selectedSocial.color}`}>
                                                                    <selectedSocial.icon size={16} />
                                                                </div>
                                                                <span>{selectedSocial.name}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="p-1.5 rounded-lg bg-white shadow-sm text-gray-400">
                                                                    <Plus size={16} />
                                                                </div>
                                                                <span className="text-gray-400">Select Platform</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isSocialDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                <AnimatePresence>
                                                    {isSocialDropdownOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 10 }}
                                                            className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-2"
                                                        >
                                                            {SOCIAL_PLATFORMS.map((platform) => {
                                                                const isAlreadyAdded = activeSocials.some(s => s.id === platform.id);
                                                                return (
                                                                    <button
                                                                        key={platform.id}
                                                                        type="button"
                                                                        disabled={isAlreadyAdded && platform.id !== 'custom'}
                                                                        onClick={() => {
                                                                            setSelectedSocial(platform);
                                                                            setIsSocialDropdownOpen(false);
                                                                        }}
                                                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:grayscale"
                                                                    >
                                                                        <div className={`p-2 rounded-xl ${platform.bg} ${platform.color}`}>
                                                                            <platform.icon size={18} />
                                                                        </div>
                                                                        <div className="flex-1 text-left text-sm font-bold text-text-main">
                                                                            {platform.name}
                                                                            {isAlreadyAdded && platform.id !== 'custom' && (
                                                                                <span className="ml-2 text-[9px] uppercase tracking-widest text-green-500 font-black">Added</span>
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {selectedSocial && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-4 space-y-3 overflow-hidden"
                                            >
                                                <div className="flex gap-2">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={socialHandle}
                                                            onChange={(e) => setSocialHandle(e.target.value)}
                                                            placeholder={selectedSocial.placeholder}
                                                            className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold text-text-main focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                                            autoFocus
                                                        />
                                                        {selectedSocial.prefix && (
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase tracking-tighter">
                                                                Handle Only
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddSocial}
                                                        disabled={!socialHandle.trim()}
                                                        className="h-12 px-6 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-50"
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedSocial(null); setSocialHandle(''); }}
                                                        className="h-12 w-12 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                                {selectedSocial.prefix && (
                                                    <p className="text-[10px] text-gray-400 ml-1">
                                                        Your profile link will be: <span className="text-primary font-bold">{selectedSocial.prefix}{socialHandle || 'handle'}</span>
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Active Links List */}
                                    {activeSocials.length > 0 && (
                                        <div className="space-y-2 mt-6">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Active Links</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {activeSocials.map((social) => (
                                                    <motion.div
                                                        layout
                                                        key={social.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className={`p-2 rounded-xl ${social.bg} ${social.color} shrink-0`}>
                                                                <social.icon size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-black text-text-main uppercase tracking-tighter leading-none">{social.name}</p>
                                                                <p className="text-[11px] text-text-secondary font-medium truncate mt-1">
                                                                    {social.url}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSocial(social.id)}
                                                            className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {activeSocials.length === 0 && (
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

                {activeTab === 'push' && (
                    <PushNotificationsTab
                        pushSupported={pushSupported}
                        pushPermission={pushPermission}
                        pushSubscribed={pushSubscribed}
                        pushLoading={pushLoading}
                        pushError={pushError}
                        vapidPublicKey={vapidPublicKey}
                        onEnable={handleEnablePush}
                        onDisable={handleDisablePush}
                        supportEmail={supportEmail}
                    />
                )}

                {activeTab === 'rewards' && !isAllBranches && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Rewards Library</h3>
                                    <p className="text-xs text-text-secondary mt-1">
                                        Manage your branch rewards and toggle each reward on or off individually.
                                    </p>
                                </div>
                                <Link
                                    href="/dashboard/loyalty/rewards"
                                    className="text-[10px] font-black uppercase tracking-widest text-primary bg-white border border-primary/20 px-3 py-2 rounded-xl hover:bg-primary/5 transition-colors"
                                >
                                    Manage rewards
                                </Link>
                            </div>
                            <div className="p-8">
                                {rewardsLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <Loader2 size={16} className="animate-spin" />
                                        Loading rewards...
                                    </div>
                                ) : rewards.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-text-secondary">
                                        No rewards created yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {rewards.map((reward) => {
                                            const isActive = localRewardVisibility.hasOwnProperty(reward.id)
                                                ? localRewardVisibility[reward.id]
                                                : reward.isActive !== false;
                                            return (
                                                <div key={reward.id} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 space-y-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-bold text-text-main">{reward.name || 'Untitled reward'}</p>
                                                            <p className="text-xs text-text-secondary line-clamp-2 mt-1">{reward.description || 'No description provided.'}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRewardToggle(reward)}
                                                            disabled={showRewardsModal}
                                                            className={`relative w-12 h-6 rounded-full transition-all ${isActive ? 'bg-primary' : 'bg-gray-300'} ${showRewardsModal ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                                                            aria-label={`Toggle ${reward.name || 'reward'} ${isActive ? 'off' : 'on'}`}
                                                        >
                                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-text-secondary">
                                                        {reward.rewardType && (
                                                            <span className="px-2 py-1 bg-white border border-gray-200 rounded-full uppercase tracking-widest">
                                                                {reward.rewardType.replace(/_/g, ' ')}
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-1 bg-white border border-gray-200 rounded-full">{reward.pointCost ?? 0} pts</span>
                                                        {reward.validityDays ? (
                                                            <span className="px-2 py-1 bg-white border border-gray-200 rounded-full">{reward.validityDays} days</span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-white border border-gray-200 rounded-full">No expiry</span>
                                                        )}
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <Modal
                    isOpen={showRewardsModal}
                    onClose={cancelRewardToggle}
                    title="Confirm reward visibility"
                    description="This setting is saved locally and used for public profile visibility in your browser session."
                    size="md"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            {selectedRewardToEnable?.reward?.name && (
                                <span className="font-bold">{selectedRewardToEnable.reward.name}</span>
                            )}
                            {selectedRewardToEnable?.targetStatus ?
                                ' will be visible on your public business profile.' :
                                ' will be hidden from public business profile.'
                            }
                        </p>
                        <p className="text-xs text-slate-500">
                            No changes are sent to the backend. This is a local display override in the current browser.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={cancelRewardToggle}
                                className="px-4 py-2 rounded-lg text-sm font-bold border border-slate-300 hover:bg-slate-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRewardToggle}
                                className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-hover transition"
                            >
                                {selectedRewardToEnable?.targetStatus ? 'Enable' : 'Disable'}
                            </button>
                        </div>
                    </div>
                </Modal>

            
                {activeTab === 'qr' && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Dynamic Business QR</h3>
                        </div>
                        <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                            {qrId ? (
                                <DynamicQRCode
                                    redirectId={qrId}
                                    customUrl={derivedPublicProfileUrl}
                                    label="Scan to Visit Profile"
                                    subLabel={origin.replace(/^https?:\/\//, '')}
                                    color="#000000"
                                />
                            ) : (
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-xs text-amber-800 font-bold max-w-sm">
                                    Unique code not available yet.
                                </div>
                            )}
                            <div className="w-full max-w-sm">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Public Profile Link</p>
                                {derivedPublicProfileUrl ? (
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                                        <div className="text-xs font-bold text-text-main break-all">{derivedPublicProfileUrl}</div>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(derivedPublicProfileUrl);
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
                                        Unique code not available yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (isAllBranches || branches.length <= 1) && (
                    <div className="space-y-6">
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
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-text-main">Registered?</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsRegistered(!isRegistered);
                                            }}
                                            className={`w-12 h-6 rounded-full transition-all ${isRegistered ? 'bg-primary' : 'bg-gray-300'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isRegistered ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className={`size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center transition-transform duration-300 ${isDocsCollapsed ? 'rotate-180' : ''}`}>
                                        <span className="material-icons-round text-gray-400">expand_more</span>
                                    </div>
                                </div>
                            </button>

                            {!isDocsCollapsed && isRegistered && (
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

                            {!isDocsCollapsed && !isRegistered && (
                                <div className="p-8">
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-xs text-amber-800 font-medium">
                                        For unregistered businesses, verification is done via personal identity documents.
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
                                    <div className="space-y-4">
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
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Identity Number</label>
                                            <input
                                                type="text"
                                                value={identityNumber}
                                                onChange={(e) => setIdentityNumber(e.target.value)}
                                                placeholder="Enter ID / NIN Number"
                                                className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-normal focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            />
                                        </div>
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

                        {/* Utility Bill Section */}
                        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500">
                                        <span className="material-icons-round text-2xl">receipt_long</span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Proof of Address</h3>
                                        <p className="text-xs text-text-secondary font-normal">Recent utility bill (Electricity, Water, or Waste)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Upload Utility Bill (Last 3 Months)</label>
                                    <div className="relative group">
                                        {!utilityBill ? (
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-gray-50 hover:bg-white hover:border-primary/30 transition-all">
                                                <div className="flex flex-col items-center justify-center p-6 text-center">
                                                    <div className="size-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm text-gray-400 group-hover:text-primary transition-colors">
                                                        <span className="material-icons-round">upload_file</span>
                                                    </div>
                                                    <p className="text-xs font-normal text-text-main">Click to upload utility bill</p>
                                                </div>
                                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => setUtilityBill(ev.target?.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </label>
                                        ) : (
                                            <div className="flex items-center justify-between bg-green-50 p-5 rounded-2xl border border-green-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-xl bg-white flex items-center justify-center text-green-600 shadow-sm">
                                                        <span className="material-icons-round">receipt</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-normal text-text-main truncate">Utility Bill Document</p>
                                                        <p className="text-[10px] text-green-600 font-normal uppercase tracking-widest">Attached</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setUtilityBill('')}
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
                )}

                {activeTab === 'general' && (
                    <div className="pt-4 flex items-center justify-between px-2">
                        <button className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors">Deactivate Business Profile</button>
                    </div>
                )}

                <Modal
                    isOpen={showRewardsModal}
                    onClose={() => setShowRewardsModal(false)}
                    title="Rewards visibility"
                    description="Decide whether visitors can see your rewards on the public profile."
                    size="sm"
                >
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                            If rewards are hidden, the public profile will not show your reward list or loyalty perks.
                            Your rewards still work for existing customers; this only affects public visibility.
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => {
                                    setShowRewards(true);
                                    setShowRewardsModal(false);
                                }}
                                className={`flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                                    showRewards ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white border border-primary text-primary hover:bg-primary/5'
                                }`}
                            >
                                Show rewards
                            </button>
                            <button
                                onClick={() => {
                                    setShowRewards(false);
                                    setShowRewardsModal(false);
                                }}
                                className={`flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                                    !showRewards ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                Hide rewards
                            </button>
                        </div>
                        <p className="text-[11px] text-text-secondary">
                            Remember to save changes for the update to take effect.
                        </p>
                    </div>
                </Modal>
            </div>
        </div>
    );
}
