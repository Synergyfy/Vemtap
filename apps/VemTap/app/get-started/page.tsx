'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Logo from '@/components/brand/Logo';
import { SanitizedInput } from '@/components/ui/SanitizedInput';
import { sanitizeFormData } from '@/lib/utils/sanitize';
import { useRegisterOwner, useOtp, useRegister, useGoogleLogin } from '@/services/auth/hooks';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { useQuery } from '@tanstack/react-query';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { CheckCircle2, Loader2, ChevronDown, Sparkles, Key, Instagram, Linkedin, Twitter, Facebook, Globe, Star, Plus, Trash2, X } from 'lucide-react';
import PasswordValidation from '@/components/shared/PasswordValidation';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useCategories } from '@/services/categories/hooks';

// Comprehensive Nigerian States and Cities Data
const statesData: Record<string, string[]> = {
    'Abia': ['Aba', 'Umuahia', 'Ohafia', 'Arochukwu', 'Bende'],
    'Adamawa': ['Yola', 'Mubi', 'Numan', 'Jimeta', 'Michika'],
    'Akwa Ibom': ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Ibeno'],
    'Anambra': ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Aguata'],
    'Bauchi': ['Bauchi', 'Azare', 'Misau', 'Jama\'are', 'Katagum'],
    'Bayelsa': ['Yenagoa', 'Brass', 'Ogbia', 'Sagbama', 'Ekeremor'],
    'Benue': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Zaki Biam'],
    'Borno': ['Maiduguri', 'Biu', 'Bama', 'Gwoza', 'Dikwa'],
    'Cross River': ['Calabar', 'Akamkpa', 'Ikom', 'Obudu', 'Ogoja'],
    'Delta': ['Asaba', 'Warri', 'Sapele', 'Agbor', 'Ughelli', 'Ogwashi-Uku'],
    'Ebonyi': ['Abakaliki', 'Afikpo', 'Onueke', 'Edda', 'Effium'],
    'Edo': ['Benin City', 'Auchi', 'Uromi', 'Ekpoma', 'Igarra'],
    'Ekiti': ['Ado-Ekiti', 'Ikere', 'Oye', 'Ikole', 'Emure'],
    'Enugu': ['Enugu City', 'Nsukka', 'Agbani', 'Awgu', 'Udi'],
    'FCT - Abuja': ['Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Jabi', 'Kuje', 'Lugbe'],
    'Gombe': ['Bauchi', 'Gombe', 'Kumo', 'Billiri', 'Dukku'],
    'Imo': ['Owerri', 'Orlu', 'Okigwe', 'Oguta', 'Mbaise'],
    'Jigawa': ['Dutse', 'Hadejia', 'Gumel', 'Birnin Kudu', 'Kazaure'],
    'Kaduna': ['Kaduna City', 'Zaria', 'Kafanchan', 'Kagoro', 'Zonkwa'],
    'Kano': ['Kano City', 'Wudil', 'Gwarzo', 'Bichi', 'Gaya'],
    'Katsina': ['Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Dutsin-Ma'],
    'Kebbi': ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru', 'Bunza'],
    'Kogi': ['Lokoja', 'Okene', 'Idah', 'Anyigba', 'Kabba'],
    'Kwara': ['Ilorin', 'Offa', 'Oro', 'Omu-Aran', 'Lafiagi'],
    'Lagos': ['Ikeja', 'Lekki', 'Victoria Island', 'Surulere', 'Yaba', 'Ajah', 'Ikorodu', 'Epe', 'Badagry', 'Oshodi'],
    'Nasarawa': ['Lafia', 'Keffi', 'Akwanga', 'Nasarawa', 'Karu'],
    'Niger': ['Minna', 'Bida', 'Kontagora', 'Suleja', 'Lapai'],
    'Ogun': ['Abeokuta', 'Ijebu Ode', 'Sango Ota', 'Ilaro', 'Sagamu'],
    'Ondo': ['Akure', 'Ondo Town', 'Owo', 'Okitipupa', 'Ikare'],
    'Osun': ['Osogbo', 'Ife', 'Ilesa', 'Iwo', 'Ede'],
    'Oyo': ['Ibadan', 'Ogbomosho', 'Oyo Town', 'Iseyin', 'Saki'],
    'Plateau': ['Jos', 'Bukuru', 'Panyam', 'Shendam', 'Barkin Ladi'],
    'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Eleme', 'Oyigbo', 'Bonny', 'Degema'],
    'Sokoto': ['Birnin Sokoto', 'Gwadabawa', 'Bodinga', 'Wurno'],
    'Taraba': ['Jalingo', 'Wukari', 'Bali', 'Gembu', 'Mutum Biyu'],
    'Yobe': ['Damaturu', 'Potiskum', 'Gashua', 'Nguru'],
    'Zamfara': ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Gummi']
};

// Social Media Platforms Configuration
const SOCIAL_PLATFORMS = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', placeholder: 'yourbrand', prefix: 'https://instagram.com/' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', placeholder: 'yourbrand', prefix: 'https://facebook.com/' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50', placeholder: 'company/yourbrand', prefix: 'https://linkedin.com/' },
    { id: 'google', name: 'Google Review', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', placeholder: 'https://g.page/r/...' },
    { id: 'trustpilot', name: 'Trustpilot', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50', placeholder: 'https://trustpilot.com/review/...' },
    { id: 'custom', name: 'Custom Link', icon: Globe, color: 'text-slate-600', bg: 'bg-slate-50', placeholder: 'https://...' },
];

export default function GetStarted() {
    const { registerOwner, requestOwnerOtp, isLoading: isRegistering } = useRegisterOwner();
    const { registerUser, isLoading: isRegisteringGeneric } = useRegister();
    const { sendOtp, verifyOtp, isLoading: isOtpLoading } = useOtp();
    const router = useRouter();
    const { signup, user } = useAuthStore();
    const [step, setStep] = useState(1);
    const [subStep, setSubStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'quarterly'>('monthly');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        businessLogo: null as string | null,
        category: '',
        categoryId: '',
        subcategory: '',
        subcategoryId: '',
        selectedRole: 'Owner' as 'Owner' | 'Manager',
        branchCount: '1',
        visitors: '',
        whatsappNumber: '',
        phone: '',
        officialEmail: '',
        businessAddress: '',
        businessWebsite: '',
        isRegistered: 'No' as 'Yes' | 'No',
        otherSubcategoryName: '',
        state: '',
        city: '',
        goals: [] as string[],
        serialNumber: '',
        businessId: '',
        otp: '',
        instagramUrl: '',
        facebookUrl: '',
        linkedinUrl: '',
        reviewUrl: '',
        trustpilotUrl: '',
        agreeToTerms: false,
        isGoogleUser: false,
    });

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

        const updateData: any = { ...formData };
        if (selectedSocial.id === 'instagram') updateData.instagramUrl = finalUrl;
        else if (selectedSocial.id === 'facebook') updateData.facebookUrl = finalUrl;
        else if (selectedSocial.id === 'linkedin') updateData.linkedinUrl = finalUrl;
        else if (selectedSocial.id === 'google') updateData.reviewUrl = finalUrl;
        else if (selectedSocial.id === 'trustpilot') updateData.trustpilotUrl = finalUrl;
        
        setFormData(updateData);
        setSocialHandle('');
        setSelectedSocial(null);
        setIsSocialDropdownOpen(false);
    };

    /**
     * Google Auth Logic: 
     * If the user came from the login page after a Google sign-in but hasn't 
     * completed onboarding, we pre-fill their info and lock certain fields.
     */
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const isFromGoogle = params.get('from') === 'google';

            if (isFromGoogle && user) {
                setFormData(prev => ({
                    ...prev,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    isGoogleUser: true,
                    agreeToTerms: true,
                }));
                
                // If they have a phone number, they've passed initial verification
                if (user.phone) {
                    setStep(3);
                }
            }
        }
    }, [user]);

    const removeSocial = (id: string) => {
        const updateData: any = { ...formData };
        if (id === 'instagram') updateData.instagramUrl = '';
        else if (id === 'facebook') updateData.facebookUrl = '';
        else if (id === 'linkedin') updateData.linkedinUrl = '';
        else if (id === 'google') updateData.reviewUrl = '';
        else if (id === 'trustpilot') updateData.trustpilotUrl = '';
        setFormData(updateData);
    };

    const activeSocials = [
        { ...SOCIAL_PLATFORMS[0], url: formData.instagramUrl },
        { ...SOCIAL_PLATFORMS[1], url: formData.facebookUrl },
        { ...SOCIAL_PLATFORMS[2], url: formData.linkedinUrl },
        { ...SOCIAL_PLATFORMS[3], url: formData.reviewUrl },
        { ...SOCIAL_PLATFORMS[4], url: formData.trustpilotUrl },
    ].filter(s => s.url);

    const { data: plans = [] } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => fetchPricingPlans()
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
    
    const { data: categoryData, isLoading: isCategoriesLoading } = useCategories({ limit: 100 });
    const categories = categoryData?.items || [];



    const goals = ['Capture Leads', 'Automated Rewards', 'Customer Feedback', 'Digital Loyalty'];

    const checkRequirement = (regex: RegExp) => regex.test(formData.password);

    
    // Password logic now handled by PasswordValidation component


    const isManager = formData.selectedRole === 'Manager';
    const maxSubStep = isManager ? 3 : 9;

    const nextStep = () => {
        if (step === 3 && subStep < maxSubStep) {
            setSubStep(prev => prev + 1);
        } else if (step === 3 && subStep === maxSubStep) {
            setStep(5);
            setSubStep(1);
        } else if (step === 1 && formData.isGoogleUser) {
            setStep(3);
            setSubStep(1);
        } else {
            setStep(prev => prev + 1);
            setSubStep(1);
        }
    };
    const prevStep = () => {
        if (step === 5) {
            setStep(3);
            setSubStep(maxSubStep);
        } else if (step === 3 && subStep > 1) {
            setSubStep(prev => prev - 1);
        } else if (step === 3 && subStep === 1 && formData.isGoogleUser) {
            setStep(1);
        } else {
            setStep(prev => prev - 1);
        }
    };

    const calculatePersonalPrice = () => {
        const base = 15000;
        const branchNum = parseInt(formData.branchCount) || 1;
        const branchVal = branchNum <= 1 ? 0 :
            branchNum <= 5 ? 5000 :
                branchNum <= 10 ? 15000 :
                    branchNum <= 50 ? 40000 : 100000;

        const visitorVal = formData.visitors === 'Less than 500' ? 0 :
            formData.visitors === '501-2000' ? 10000 :
                formData.visitors === '2001-5000' ? 25000 : 60000;

        return base + branchVal + visitorVal;
    };

    const handleCreateAccount = async () => {
        const errors: Record<string, string> = {};

        if (!formData.firstName) errors.firstName = 'First name is required';
        if (!formData.lastName) errors.lastName = 'Last name is required';
        if (!formData.email) errors.email = 'Email is required';
        if (!formData.phone) errors.phone = 'Phone number is required';
        if (!formData.password) errors.password = 'Password is required';

        if (formData.password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                errors.password = 'Password must be at least 8 characters, include uppercase, lowercase, a number and a special symbol';
            }
        }
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        try {
            if (formData.selectedRole === 'Owner') {
                await requestOwnerOtp({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    role: 'Owner'
                });
            } else {
                await sendOtp({ email: formData.email });
            }
            toast.success('Verification code sent to your email.');
            nextStep();
        } catch (error: any) {
            if (error.message?.includes('already exist')) {
                setFieldErrors({ email: 'An account with this email already exists' });
            } else {
                toast.error(error.message || 'Failed to send verification code.');
            }
        }
    };

    const handleVerifyOtp = async () => {
        if (formData.otp.length !== 4) {
            toast.error('Please enter the 4-digit code.');
            return;
        }
        try {
            await verifyOtp({ email: formData.email, code: formData.otp });
            toast.success('Email verified successfully!');
            nextStep();
        } catch (error: any) {
            toast.error(error.message || 'Invalid code. Please try again.');
        }
    };

    const handleResendOtp = async () => {
        try {
            await sendOtp({ email: formData.email });
            toast.success('New verification code sent!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend code.');
        }
    };

    const handleFinalize = async () => {
        setIsLoading(true);
        try {
            const cleanData = sanitizeFormData(formData);
            let response: any;

            let businessLogoUrl = cleanData.businessLogo;

            if (!isManager) {
                if (cleanData.businessLogo && cleanData.businessLogo.startsWith('data:image')) {
                    const uploadToast = toast.loading('Uploading business logo...');
                    try {
                        businessLogoUrl = await uploadToCloudinary(cleanData.businessLogo);
                        toast.success('Logo uploaded!', { id: uploadToast });
                    } catch (uploadError: any) {
                        console.error('Logo upload failed:', uploadError);
                        toast.error('Logo upload failed. Proceeding...', { id: uploadToast });
                        businessLogoUrl = null;
                    }
                }
            }


            if (isManager) {
                const payload = {
                    firstName: cleanData.firstName,
                    lastName: cleanData.lastName,
                    email: cleanData.email,
                    password: formData.password || undefined,
                    role: 'Manager',
                    businessId: cleanData.businessId || undefined,
                };
                response = await registerUser(payload);
            } else {
                const selectedCategory = categories.find((c: any) => c.id === formData.categoryId);
                const selectedSubcategory = selectedCategory?.subcategories?.find((s: any) => s.id === formData.subcategoryId);

                const payload = {
                    email: cleanData.email,
                    password: formData.password || undefined,
                    businessName: cleanData.businessName,
                    businessLogo: businessLogoUrl || undefined,
                    categoryId: formData.categoryId,
                    subcategoryId: formData.subcategoryId || '',
                    otherSubcategoryName: formData.subcategory === 'Others' ? (cleanData as any).otherSubcategoryName : undefined,
                    visitors: cleanData.visitors || undefined,
                    goals: cleanData.goals && cleanData.goals.length > 0 ? cleanData.goals : undefined,
                    whatsappNumber: cleanData.whatsappNumber || undefined,
                    officialEmail: cleanData.officialEmail || cleanData.email,
                    businessNumber: formData.phone,
                    businessAddress: cleanData.businessAddress || undefined,
                    businessWebsite: cleanData.businessWebsite || undefined,
                    isRegistered: cleanData.isRegistered === 'Yes',
                    state: cleanData.state || undefined,
                    city: cleanData.city || undefined,
                    engagement: {
                        instagram: cleanData.instagramUrl || undefined,
                        facebook: cleanData.facebookUrl || undefined,
                        linkedin: cleanData.linkedinUrl || undefined,
                        reviewUrl: cleanData.reviewUrl || undefined,
                        trustpilot: cleanData.trustpilotUrl || undefined,
                    },
                };

                response = await registerOwner(payload as any);
            }

            // Use the full user object from the backend response
            // This ensures businessId and other metadata are correctly synced
            await signup(response.user as any, response.access_token);
            
            // If the backend returned a businessId, we might want to pre-set it as active 
            // for immediate data fetching when they arrive at the dashboard
            if (response.user.businessId && setActiveBranch) {
                // If the response also contains a branchId, set it
                if (response.user.branchId) {
                    setActiveBranch(response.user.branchId);
                }
            }

            setStep(6);

            // Give the user a moment to see the success state before redirecting
            setTimeout(() => {
                const target = isManager ? '/dashboard' : '/dashboard/settings/subscription';
                router.push(target);
            }, 2500);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-white flex overflow-hidden font-sans">
            <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto">
                <div className="p-8 md:p-16 lg:p-24">
                    <Logo className="flex items-center gap-3" />

                    <div className="max-w-md w-full mx-auto lg:mx-0">
                        <div className="flex gap-1.5 mb-12">
                            {[1, 2, 3, 5, 6].map(s => {
                                let progress = 0;
                                if (step > s) progress = 100;
                                else if (step === s) {
                                    if (step === 3) progress = (subStep / 9) * 100;
                                    else progress = 100;
                                }
                                return (
                                    <div key={s} className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h1 className="text-2xl font-display font-bold text-text-main mb-2 leading-tight tracking-tight">Create your account</h1>
                                        <p className="text-[13px] text-text-secondary font-medium leading-relaxed">Join 2,000+ businesses who have digitized their physical visitor experience.</p>
                                    </div>

                                    <div className="space-y-5">
                                        <GoogleAuthButton 
                                            role="owner" 
                                            onSuccess={(res) => {
                                                setFormData({
                                                    ...formData,
                                                    firstName: res.user.firstName,
                                                    lastName: res.user.lastName,
                                                    email: res.user.email,
                                                    isGoogleUser: true,
                                                    agreeToTerms: true // They already implicitly agreed by choosing social login usually, but we can also check
                                                });
                                                if (res.user.phone) {
                                                    setStep(3); // Skip OTP if already authenticated and has phone
                                                } else {
                                                    // Stay on step 1 to collect phone
                                                    toast.success("Google linked! Please provide your phone number to complete account setup.");
                                                }
                                            }}
                                        />

                                        <div className="relative my-6 border-t border-slate-100">
                                            <div className="absolute left-1/2 -top-3 -translate-x-1/2 px-4 bg-white text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">
                                                OR SIGN UP MANUALLY
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <SanitizedInput
                                                label="First Name"
                                                value={formData.firstName}
                                                onChange={(v) => { setFormData({ ...formData, firstName: v }); setFieldErrors(prev => ({ ...prev, firstName: '' })); }}
                                                icon="person"
                                                placeholder="Daniel"
                                                required
                                                tooltip="Your legal first name as it will appear on your account"
                                                error={fieldErrors.firstName}
                                                readOnly={formData.isGoogleUser}
                                            />
                                            <SanitizedInput
                                                label="Last Name"
                                                value={formData.lastName}
                                                onChange={(v) => { setFormData({ ...formData, lastName: v }); setFieldErrors(prev => ({ ...prev, lastName: '' })); }}
                                                icon="person"
                                                placeholder="Smith"
                                                required
                                                tooltip="Your legal last name"
                                                error={fieldErrors.lastName}
                                                readOnly={formData.isGoogleUser}
                                            />
                                        </div>
                                        <SanitizedInput
                                            label="Business Email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(v) => { setFormData({ ...formData, email: v }); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                                            icon="mail"
                                            placeholder="daniel@company.com"
                                            required
                                            tooltip="We'll send verification codes and account updates to this email"
                                            error={fieldErrors.email}
                                            readOnly={formData.isGoogleUser}
                                        />
                                        <SanitizedInput
                                            label="Phone Number"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(v) => { setFormData({ ...formData, phone: v }); setFieldErrors(prev => ({ ...prev, phone: '' })); }}
                                            icon="phone"
                                            placeholder="+234 801 234 5678"
                                            required
                                            tooltip="Required for identity verification and account recovery"
                                            error={fieldErrors.phone}
                                        />

                                        {!formData.isGoogleUser && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <SanitizedInput
                                                        label="Password"
                                                        type="password"
                                                        value={formData.password}
                                                        onChange={(v) => { 
                                                            setFormData({ ...formData, password: v }); 
                                                            setFieldErrors(prev => ({ ...prev, password: '' })); 
                                                        }}
                                                        onFocus={() => setShowPasswordRequirements(true)}
                                                        icon="lock"
                                                        placeholder="••••••••"
                                                        required
                                                        tooltip="Min 8 characters, with uppercase, lowercase, number and symbol"
                                                        error={fieldErrors.password}
                                                        showPasswordToggle
                                                        showPassword={showPassword}
                                                        onTogglePassword={() => setShowPassword(!showPassword)}
                                                    />
                                                    
                                                    <PasswordValidation 
                                                        password={formData.password}
                                                        onSuggest={(p) => setFormData({ ...formData, password: p })}
                                                        showAlways={showPasswordRequirements}
                                                    />
                                                </div>

                                                <SanitizedInput
                                                    label="Confirm Password"
                                                    type="password"
                                                    value={formData.confirmPassword}
                                                    onChange={(v) => { setFormData({ ...formData, confirmPassword: v }); setFieldErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                                                    icon="lock_reset"
                                                    placeholder="••••••••"
                                                    required
                                                    tooltip="Re-enter your password to confirm"
                                                    error={fieldErrors.confirmPassword}
                                                    showPasswordToggle
                                                    showPassword={showConfirmPassword}
                                                    onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3 mt-4">
                                            <input
                                                type="checkbox"
                                                id="terms"
                                                className="mt-1 size-4 accent-primary rounded"
                                                checked={formData.agreeToTerms}
                                                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                                            />
                                            <label htmlFor="terms" className="text-[11px] font-medium text-text-secondary leading-normal">
                                                I agree to the <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</Link>.
                                            </label>
                                        </div>

                                        <button
                                            onClick={formData.isGoogleUser ? nextStep : handleCreateAccount}
                                            disabled={!formData.agreeToTerms || isOtpLoading || isRegistering || !formData.email || (!formData.isGoogleUser && !formData.password) || !formData.firstName || !formData.lastName || !formData.phone}
                                            className="w-full h-14 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            {isOtpLoading || isRegistering ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    {formData.isGoogleUser ? 'Continue Setup' : 'Create Account'}
                                                    <span className="material-icons-round text-lg">arrow_forward</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h1 className="text-2xl font-display font-bold text-text-main mb-2 leading-tight tracking-tight">Verify your email</h1>
                                        <p className="text-[13px] text-text-secondary font-medium leading-relaxed">We've sent a code to <span className="text-primary font-bold">{formData.email || 'your email'}</span>. Please enter it below.</p>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex gap-3 justify-between">
                                            {[0, 1, 2, 3].map(index => (
                                                <input
                                                    key={index}
                                                    id={`otp-${index}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={formData.otp[index] || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val && !/^\d$/.test(val)) return;
                                                        const otpArr = formData.otp.split('');
                                                        while (otpArr.length < 4) otpArr.push('');
                                                        otpArr[index] = val;
                                                        setFormData({ ...formData, otp: otpArr.join('').replace(/\s+/g, '') });
                                                        if (val && index < 3) {
                                                            document.getElementById(`otp-${index + 1}`)?.focus();
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
                                                            document.getElementById(`otp-${index - 1}`)?.focus();
                                                        }
                                                    }}
                                                    onPaste={(e) => {
                                                        e.preventDefault();
                                                        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                                                        if (paste) {
                                                            setFormData({ ...formData, otp: paste });
                                                            const focusIdx = Math.min(paste.length, 3);
                                                            document.getElementById(`otp-${focusIdx}`)?.focus();
                                                        }
                                                    }}
                                                    className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-xl text-center font-display font-black text-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all"
                                                />
                                            ))}
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                                                Didn't receive it? <button onClick={handleResendOtp} disabled={isOtpLoading} className="text-primary hover:underline disabled:opacity-50">Resend code</button>
                                            </p>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button onClick={prevStep} className="h-12 px-8 border border-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">Back</button>
                                            <button
                                                onClick={handleVerifyOtp}
                                                disabled={isOtpLoading || formData.otp.length < 4}
                                                className="flex-1 h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all text-sm flex items-center justify-center disabled:opacity-50"
                                            >
                                                {isOtpLoading ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    'Verify & Continue'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h1 className="text-2xl font-display font-bold text-text-main mb-2 leading-tight tracking-tight">
                                            {subStep === 3 && "Business Industry"}
                                            {subStep === 4 && "Business Locations / Branch"}
                                            {subStep === 7 && "What are your goals?"}
                                            {subStep === 8 && "Vital Business Info"}
                                        </h1>
                                        <p className="text-[13px] text-text-secondary font-medium leading-relaxed">
                                            {subStep === 1 && "Start with the name customers know you by."}
                                            {subStep === 2 && "Upload your logo to personalize your dashboard and customer tags."}
                                            {subStep === 3 && "Select the category that best fits your business."}
                                            {subStep === 4 && "Enter the total number of locations your business operates from."}
                                            {subStep === 5 && "Important for campaign communications and support."}
                                            {subStep === 6 && "This helps us optimize your experience for your footfall volume."}
                                            {subStep === 7 && "Tell us what you want to achieve with VemTap."}
                                            {subStep === 8 && "Adding your address, location and website helps us localize your profile."}
                                        </p>

                                    </div>

                                    <div className="space-y-6">
                                        {subStep === 1 && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <SanitizedInput
                                                    label="Business Name"
                                                    type="businessName"
                                                    value={formData.businessName}
                                                    onChange={(v) => setFormData({ ...formData, businessName: v })}
                                                    icon="storefront"
                                                    placeholder="Green Terrace Cafe"
                                                    required
                                                    tooltip="The name customers know your business by — shown on your NFC tags and dashboard"
                                                />

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Is your business registered?</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <button
                                                            onClick={() => setFormData({ ...formData, isRegistered: 'Yes' })}
                                                            className={`p-4 rounded-xl text-left transition-all border ${formData.isRegistered === 'Yes' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-gray-50 border-gray-100 text-text-secondary hover:bg-gray-100'}`}
                                                        >
                                                            <div className="text-sm font-bold mb-1">YES</div>
                                                            <div className="text-[10px] leading-relaxed opacity-80">My business has the approval, documentation, and licences required to operate legally.</div>
                                                        </button>
                                                        <button
                                                            onClick={() => setFormData({ ...formData, isRegistered: 'No' })}
                                                            className={`p-4 rounded-xl text-left transition-all border ${formData.isRegistered === 'No' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-gray-50 border-gray-100 text-text-secondary hover:bg-gray-100'}`}
                                                        >
                                                            <div className="text-sm font-bold mb-1">NO</div>
                                                            <div className="text-[10px] leading-relaxed opacity-80">My business is not formally registered yet.</div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {subStep === 2 && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Business Logo</label>
                                                <div className="flex flex-col items-center gap-6 p-8 border-2 border-dashed border-gray-100 rounded-4xl bg-gray-50/50">
                                                    <div className="size-24 rounded-3xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                                                        {formData.businessLogo ? (
                                                            <img src={formData.businessLogo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                                        ) : (
                                                            <span className="material-icons-round text-gray-300 text-4xl">image</span>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            id="logo-upload"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        setFormData({ ...formData, businessLogo: reader.result as string });
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor="logo-upload" className="inline-flex px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-primary/20 active:scale-95">
                                                            Upload Brand Logo
                                                        </label>
                                                        <p className="text-[10px] text-text-secondary mt-3 font-medium">PNG or SVG, max. 2MB</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {subStep === 3 && isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                                <div>
                                                    <h1 className="text-2xl font-display font-bold text-text-main mb-2 leading-tight tracking-tight">Join a Business</h1>
                                                    <p className="text-[13px] text-text-secondary font-medium leading-relaxed">Enter the Business ID provided by the business owner to join their team.</p>
                                                </div>
                                                <SanitizedInput
                                                    label="Business ID / Invite Code"
                                                    value={formData.businessId}
                                                    onChange={(v) => setFormData({ ...formData, businessId: v })}
                                                    icon="vpn_key"
                                                    placeholder="e.g. abc123-def456-ghi789"
                                                    required
                                                    tooltip="The Business ID is provided by the business owner from their dashboard settings"
                                                />
                                            </motion.div>
                                        )}

                                        {subStep === 3 && !isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Business Category</label>
                                                    {isCategoriesLoading ? (
                                                        <div className="col-span-full flex items-center justify-center p-8">
                                                            <Loader2 size={24} className="animate-spin text-primary" />
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <select
                                                                value={formData.categoryId}
                                                                onChange={(e) => {
                                                                    const selected = categories.find((c: any) => c.id === e.target.value);
                                                                    setFormData({ ...formData, categoryId: e.target.value, category: selected?.name || '', subcategory: '', subcategoryId: '' });
                                                                }}
                                                                className="w-full h-14 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold text-text-main focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                                                            >
                                                                <option value="">Select Category</option>
                                                                {categories.map((c: any) => (
                                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={18} />
                                                        </div>
                                                    )}
                                                </div>


                                                <AnimatePresence mode="wait">
                                                    {formData.categoryId && (
                                                        <motion.div
                                                            key={formData.categoryId}
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="space-y-6 overflow-hidden"
                                                        >
                                                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
                                                                <div className="shrink-0">
                                                                    <span className="material-icons-round text-blue-500 text-lg">info</span>
                                                                </div>
                                                                <p className="text-xs text-blue-800 font-medium leading-relaxed italic">
                                                                    {categories.find((c: any) => c.id === formData.categoryId)?.description}
                                                                </p>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Select Subcategory</label>
                                                                <div className="relative">
                                                                    <select
                                                                        value={formData.subcategoryId}
                                                                        onChange={(e) => {
                                                                            const selected = categories.find((c: any) => c.id === formData.categoryId)?.subcategories?.find((s: any) => s.id === e.target.value);
                                                                            setFormData({ ...formData, subcategoryId: e.target.value, subcategory: selected?.name || '' });
                                                                        }}
                                                                        className="w-full h-14 bg-white border border-gray-100 rounded-xl px-4 text-sm font-bold text-text-main focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                                                                    >
                                                                        <option value="">Select Subcategory</option>
                                                                        {categories.find((c: any) => c.id === formData.categoryId)?.subcategories?.map((sub: any) => (
                                                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                                        ))}
                                                                        <option value="other">Others</option>
                                                                    </select>
                                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={18} />
                                                                </div>
                                                            </div>

                                                            {formData.subcategoryId === 'other' && (
                                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                                    <SanitizedInput
                                                                        label="Specify Your Business Type"
                                                                        value={formData.otherSubcategoryName}
                                                                        onChange={(v) => setFormData({ ...formData, otherSubcategoryName: v })}
                                                                        icon="edit"
                                                                        placeholder="e.g. Art Gallery, Fitness Center"
                                                                        required
                                                                        tooltip="Tell us specifically what your business does if it's not listed above."
                                                                    />
                                                                </motion.div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )}

                                        {subStep === 4 && !isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                <SanitizedInput
                                                    label="Number of Business Locations"
                                                    type="number"
                                                    value={formData.branchCount}
                                                    onChange={(v) => {
                                                        const num = parseInt(v);
                                                        if (num < 1) return;
                                                        setFormData({ ...formData, branchCount: v });
                                                    }}
                                                    icon="store"
                                                    placeholder="e.g. 1"
                                                    required
                                                    min="1"
                                                    tooltip="Include your main location and all branches."
                                                />
                                            </motion.div>
                                        )}


                                        {subStep === 5 && !isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-3">
                                                    <p className="text-xs text-blue-800 font-bold">Use the same email and phone number from your account registration?</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setFormData({
                                                                    ...formData,
                                                                    officialEmail: formData.email,
                                                                    whatsappNumber: formData.phone
                                                                });
                                                            }}
                                                            className="px-4 py-2 bg-white text-blue-700 font-bold text-xs rounded-lg border border-blue-200 hover:bg-blue-100 shadow-sm"
                                                        >
                                                            Yes, use same details
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setFormData({
                                                                    ...formData,
                                                                    officialEmail: '',
                                                                    whatsappNumber: ''
                                                                });
                                                            }}
                                                            className="px-4 py-2 bg-transparent text-blue-600 font-bold text-xs hover:bg-blue-100 rounded-lg"
                                                        >
                                                            No, enter new details
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <SanitizedInput
                                                        label="Business WhatsApp Number"
                                                        type="tel"
                                                        value={formData.whatsappNumber}
                                                        onChange={(v) => setFormData({ ...formData, whatsappNumber: v })}
                                                        icon="message"
                                                        placeholder="+234 801 234 5678"
                                                        required
                                                        tooltip="Used for WhatsApp campaign delivery and customer support"
                                                    />
                                                    <SanitizedInput
                                                        label="Business Official Email"
                                                        type="email"
                                                        value={formData.officialEmail}
                                                        onChange={(v) => setFormData({ ...formData, officialEmail: v })}
                                                        icon="alternate_email"
                                                        placeholder="hello@business.com"
                                                        required
                                                        tooltip="Public-facing email for customer communications and campaigns"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}


                                        {subStep === 6 && !isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Monthly Visitors</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {['Less than 500', '501-2000', '2001-5000', '5000+'].map(range => (
                                                        <button
                                                            key={range}
                                                            onClick={() => setFormData({ ...formData, visitors: range })}
                                                            className={`w-full h-14 rounded-xl px-6 text-sm font-bold transition-all border flex items-center justify-between ${formData.visitors === range ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-gray-50 border-gray-100 text-text-secondary hover:bg-gray-100'}`}
                                                        >
                                                            <span>{range === 'Less than 500' ? range : range.includes('+') ? range : `${range} visitors`}</span>
                                                            {formData.visitors === range && <span className="material-icons-round text-primary text-sm">check_circle</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {subStep === 7 && !isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Select Goals</label>
                                                    <p className="text-[11px] text-gray-400 ml-1 mt-1">You can select multiple options</p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {goals.map(goal => (
                                                        <button
                                                            key={goal}
                                                            type="button"
                                                            onClick={() => {
                                                                const newGoals = formData.goals.includes(goal)
                                                                    ? formData.goals.filter(g => g !== goal)
                                                                    : [...formData.goals, goal];
                                                                setFormData({ ...formData, goals: newGoals });
                                                            }}
                                                            className={`w-full h-14 rounded-xl px-6 text-sm font-bold transition-all border flex items-center justify-between ${formData.goals.includes(goal) ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-gray-50 border-gray-100 text-text-secondary hover:bg-gray-100'}`}
                                                        >
                                                            <span>{goal}</span>
                                                            {formData.goals.includes(goal) && <span className="material-icons-round text-primary text-sm">check_circle</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {subStep === 8 && !isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                                                <SanitizedInput
                                                    label="Business Address"
                                                    type="businessName"
                                                    value={formData.businessAddress}
                                                    onChange={(v) => setFormData({ ...formData, businessAddress: v })}
                                                    icon="location_on"
                                                    placeholder="123 Business Ave, Lagos, Nigeria"
                                                    required
                                                    tooltip="Physical location of your business — helps localize your customer profile"
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">State</label>
                                                        <div className="relative">
                                                            <select
                                                                value={formData.state}
                                                                onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                                                                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-xs font-bold text-text-main focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                                                            >
                                                                <option value="">Select State</option>
                                                                {Object.keys(statesData).sort().map(s => (
                                                                    <option key={s} value={s}>{s}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={14} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">City</label>
                                                        <div className="relative">
                                                            <select
                                                                value={formData.city}
                                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                                disabled={!formData.state}
                                                                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-xs font-bold text-text-main focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none disabled:opacity-50 cursor-pointer"
                                                            >
                                                                <option value="">Select City</option>
                                                                {formData.state && statesData[formData.state]?.sort().map(c => (
                                                                    <option key={c} value={c}>{c}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" size={14} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <SanitizedInput
                                                    label="Business Website"
                                                    type="url"
                                                    value={formData.businessWebsite}
                                                    onChange={(v) => setFormData({ ...formData, businessWebsite: v })}
                                                    icon="language"
                                                    placeholder="https://www.yourbusiness.com"
                                                    optional
                                                    tooltip="Your website URL — included in customer-facing messages and NFC tags"
                                                />
                                            </motion.div>
                                        )}

                                        {subStep === 9 && !isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div>
                                                    <h3 className="text-lg font-bold text-text-main mb-1">Social Media & Reviews</h3>
                                                    <p className="text-[11px] text-text-secondary">Provide your social links to help customers engage with your brand after filling the form.</p>
                                                </div>

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

                                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                                                    <div className="shrink-0">
                                                        <span className="material-icons-round text-amber-500 text-lg">info</span>
                                                    </div>
                                                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                                                        Don't have these yet? No worries! You can always add them later in your Profile settings.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="flex gap-4 pt-4">
                                            <button onClick={prevStep} className="h-12 px-8 border border-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">Back</button>
                                            <button
                                                onClick={nextStep}
                                                disabled={
                                                    (subStep === 1 && !formData.businessName) ||
                                                    (subStep === 3 && isManager && !formData.businessId) ||
                                                    (!isManager && subStep === 3 && !formData.categoryId) ||
                                                    (!isManager && subStep === 4 && !formData.branchCount) ||
                                                    (!isManager && subStep === 5 && (!formData.whatsappNumber?.trim() || !formData.officialEmail?.trim())) ||
                                                    (!isManager && subStep === 6 && !formData.visitors) ||
                                                    (!isManager && subStep === 7 && formData.goals.length === 0) ||
                                                    (!isManager && subStep === 8 && (!formData.businessAddress || !formData.state || !formData.city))
                                                }
                                                className="flex-1 h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all text-sm disabled:opacity-50"
                                            >
                                                {subStep === maxSubStep ? "Review Your Application" : "Next Question"}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 5 && (
                                <motion.div
                                    key="step5"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h1 className="text-2xl font-display font-bold text-text-main mb-2 leading-tight tracking-tight">Review your details</h1>
                                        <p className="text-[13px] text-text-secondary font-medium leading-relaxed">Check everything over before we create your account.</p>
                                    </div>

                                    <div className="space-y-4 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-4">
                                            <div className="size-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                                                {formData.businessLogo ? (
                                                    <img src={formData.businessLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                                                ) : (
                                                    <span className="material-icons-round text-gray-200 text-2xl">storefront</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-main">{formData.businessName}</h3>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-wider">
                                                    {categories.find((c: any) => c.id === formData.categoryId)?.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Account Owner</p>
                                                    <p className="text-xs font-bold text-text-main">{formData.firstName} {formData.lastName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Email</p>
                                                    <p className="text-xs font-bold text-text-main">{formData.email}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Target Objectives</p>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {formData.goals.map(g => (
                                                        <span key={g} className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-text-main">
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div>
                                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Visitors Scale</p>
                                                    <p className="text-xs font-bold text-text-main">{formData.visitors}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Role</p>
                                                    <p className="text-xs font-bold text-text-main">{formData.selectedRole}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Business Locations</p>
                                                    <p className="text-xs font-bold text-text-main">{formData.branchCount}</p>
                                                </div>
                                                <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 mt-1">
                                                    <div>
                                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">WhatsApp</p>
                                                        <p className="text-xs font-bold text-text-main">{formData.whatsappNumber || 'Not set'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Official Email</p>
                                                        <p className="text-xs font-bold text-text-main break-all">{formData.officialEmail || 'Not set'}</p>
                                                    </div>
                                                    
                                                    <div>
                                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Registered</p>
                                                        <p className="text-xs font-bold text-text-main">{formData.isRegistered}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Social Links</p>
                                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                            {formData.instagramUrl && <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-text-main">Instagram</span>}
                                                            {formData.facebookUrl && <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-text-main">Facebook</span>}
                                                            {formData.linkedinUrl && <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-text-main">LinkedIn</span>}
                                                            {formData.reviewUrl && <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-text-main">Google</span>}
                                                            {formData.trustpilotUrl && <span className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-text-main">Trustpilot</span>}
                                                            {!formData.instagramUrl && !formData.facebookUrl && !formData.linkedinUrl && !formData.reviewUrl && !formData.trustpilotUrl && <span className="text-[10px] text-gray-400 font-medium italic">None provided</span>}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Location</p>
                                                        <p className="text-xs font-bold text-text-main">{formData.city}, {formData.state}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button onClick={prevStep} className="h-12 px-8 border border-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">Back</button>
                                        <button
                                            onClick={handleFinalize}
                                            disabled={isLoading || isRegistering || isRegisteringGeneric}
                                            className="flex-1 h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            {isLoading || isRegistering || isRegisteringGeneric ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    Confirm & Create Account
                                                    <span className="material-icons-round text-lg">verified</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 6 && (
                                <motion.div
                                    key="final"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8 min-w-[320px] md:min-w-[600px] lg:min-w-[800px] ml-0 md:-ml-20 lg:-ml-40"
                                >
                                    <div className="text-center mb-12">
                                        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                                            <span className="material-icons-round text-3xl">celebration</span>
                                        </div>
                                        <h1 className="text-3xl font-display font-bold text-text-main mb-3">Account Created!</h1>
                                        <p className="text-sm text-text-secondary font-medium">Select a plan to enter your dashboard and start tapping.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {plans.filter(p => ['free', 'personal', 'basic', 'premium'].includes(p.id)).map((plan) => {
                                            const isPersonal = plan.id === 'personal';
                                            const priceVal = isPersonal ? calculatePersonalPrice() : plan.monthlyPrice;
                                            const displayPrice = `₦${priceVal.toLocaleString()}`;
                                            const features = plan.teamMembersLimit ? [
                                                `${plan.teamMembersLimit} Team Members`,
                                                `${plan.loyaltyLimit} Loyalty Points`,
                                                `${plan.branchLimit} Business Locations`,
                                            ] : [];

                                            return (
                                                <div key={plan.id} className="p-6 rounded-3xl border border-gray-100 bg-white hover:border-primary/20 transition-all flex flex-col shadow-sm hover:shadow-xl">
                                                    <div className="mb-6">
                                                        <h4 className="font-black text-slate-900 text-sm mb-1">{plan.name}</h4>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-2xl font-black text-slate-900">{displayPrice}</span>
                                                            {plan.id !== 'free' && <span className="text-[10px] font-bold text-slate-400">/mo</span>}
                                                        </div>
                                                    </div>

                                                    <ul className="space-y-3 mb-8 flex-1">
                                                        {features.slice(0, 4).map((f: string, i: number) => (
                                                            <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                                                <CheckCircle2 className="size-3.5 text-primary" />
                                                                {f}
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    <button
                                                        onClick={async () => {
                                                            if (plan.id === 'free') {
                                                                toast.success('Joined Free Plan!');
                                                            } else {
                                                                toast.success(`Selected ${plan.name}`);
                                                            }
                                                            router.push('/dashboard');
                                                        }}
                                                        className="w-full h-11 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                                                    >
                                                        {plan.id === 'free' ? 'Get Started' : 'Select Plan'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="text-center pt-8">
                                        <Link href="/dashboard" className="text-xs font-black text-text-secondary uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2">
                                            Skip for now and enter dashboard
                                            <span className="material-icons-round text-sm">arrow_forward</span>
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className="text-[10px] text-center lg:text-left text-text-secondary font-bold uppercase tracking-widest mt-12">
                            Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden h-screen">
                <AuthSidePanel
                    features={
                        step === 1 ? [
                            {
                                title: "Join 2,000+ businesses.",
                                description: "Start capturing customer data automatically with every tap. No apps, no friction.",
                                icon: "storefront"
                            },
                            {
                                title: "Secure & compliant.",
                                description: "Your customer data is encrypted and GDPR-compliant from day one.",
                                icon: "verified_user"
                            }
                        ] : step === 2 ? [
                            {
                                title: "Verify your identity.",
                                description: "We've sent a secure code to your email to ensure your account is protected.",
                                icon: "mark_email_read"
                            }
                        ] : step === 3 ? [
                            {
                                title: "Tell us about your space.",
                                description: "We'll customize your dashboard to match your business type and visitor volume.",
                                icon: "tune"
                            },
                            {
                                title: "Smart recommendations.",
                                description: "Get AI-powered insights based on your business category and goals.",
                                icon: "psychology"
                            }
                        ] : step === 4 ? [
                            {
                                title: "Set your primary goal.",
                                description: "Whether it's lead capture, loyalty, or feedback—we'll optimize your experience.",
                                icon: "flag"
                            }
                        ] : [
                            {
                                title: "You're all set!",
                                description: "Your dashboard is ready. Start creating your first NFC message and watch the data flow in.",
                                icon: "celebration"
                            },
                            {
                                title: "Need help?",
                                description: "Our support team and knowledge base are here 24/7 to guide you.",
                                icon: "support_agent"
                            }
                        ]
                    }
                />
            </div>
        </div >
    );
}
