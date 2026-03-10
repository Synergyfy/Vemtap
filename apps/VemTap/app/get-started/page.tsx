'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Logo from '@/components/brand/Logo';
import { SanitizedInput } from '@/components/ui/SanitizedInput';
import { sanitizeFormData } from '@/lib/utils/sanitize';
import { useRegisterOwner, useOtp, useRegister } from '@/services/auth/hooks';
import { useQuery } from '@tanstack/react-query';
import { fetchPricingPlans } from '@/lib/api/pricing';
import { CheckCircle2 } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { fetchCategories } from '@/services/categories';

export default function GetStarted() {
    const { registerOwner, requestOwnerOtp, isLoading: isRegistering } = useRegisterOwner();
    const { registerUser, isLoading: isRegisteringGeneric } = useRegister();
    const { sendOtp, verifyOtp, isLoading: isOtpLoading } = useOtp();
    const router = useRouter();
    const { signup } = useAuthStore();
    const [step, setStep] = useState(1);
    const [subStep, setSubStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'quarterly'>('monthly');

    const { data: plans = [] } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchPricingPlans
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories
    });
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessName: '',
        businessLogo: null as string | null,
        category: '',
        subcategory: '',
        selectedRole: 'Owner' as 'Owner' | 'Manager',
        branchCount: '',
        visitors: '',
        whatsappNumber: '',
        phone: '',
        officialEmail: '',
        businessNumber: '',
        businessAddress: '',
        businessWebsite: '',
        isRegistered: 'No' as 'Yes' | 'No',
        registrationNumber: '',
        verificationDoc: null as string | null,
        otherSubcategoryName: '',
        state: '',
        city: '',
        goals: [] as string[],
        serialNumber: '',
        businessId: '',
        otp: '',
        agreeToTerms: false
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const categoriesData = [
        {
            name: 'Retail & Shops',
            description: 'Businesses that sell physical products directly to customers either in a shop, store, market stall, or online.',
            subcategories: ['Supermarket / Grocery Store', 'Boutique / Fashion Store', 'Shoe Store', 'Phone & Accessories Store', 'Electronics Store', 'Computer Store', 'Cosmetics / Beauty Products Store', 'Perfume Store', 'Baby Store', 'Toy Store', 'Gift Shop', 'Bookshop / Stationery', 'Jewelry Store', 'Home Appliances Store', 'Furniture Store', 'Building Materials Store', 'Lighting / Electrical Shop', 'Kitchenware Store', 'Sports Equipment Store', 'Pet Store', 'Pharmacy / Drug Store', 'Agricultural Produce Shop', 'Auto Spare Parts Shop', 'Market Trader / General Merchandise', 'Others']
        },
        {
            name: 'Food & Hospitality',
            description: 'Businesses that prepare, sell, or serve food, drinks, or provide accommodation to customers.',
            subcategories: ['Restaurant', 'Fast Food / Quick Service', 'Local Food Canteen / Bukka', 'Café / Coffee Shop', 'Bakery', 'Ice Cream Shop', 'Juice / Smoothie Bar', 'Bar / Lounge', 'Nightclub', 'Catering Services', 'Event Food Vendor', 'Hotel', 'Guest House', 'Short-let Apartment', 'Resort', 'Others']
        },
        {
            name: 'Beauty & Personal Care',
            description: 'Businesses that help customers improve their appearance, grooming, hygiene, and personal care.',
            subcategories: ['Hair Salon', 'Barbing Salon', 'Nail Studio', 'Spa / Massage', 'Makeup Artist', 'Skincare / Facial Studio', 'Beauty Clinic', 'Tattoo Studio', 'Piercing Studio', 'Cosmetics Studio', 'Others']
        },
        {
            name: 'Health & Medical',
            description: 'Businesses that provide healthcare, medical services, or wellness treatments.',
            subcategories: ['Hospital', 'Clinic', 'Dental Clinic', 'Eye Clinic / Optometrist', 'Pharmacy', 'Laboratory / Diagnostic Center', 'Physiotherapy', 'Mental Health / Therapy Center', 'Maternity Center', 'Medical Supply Store', 'Others']
        },
        {
            name: 'Professional Services',
            description: 'Businesses that provide expert advice, consulting, or professional services.',
            subcategories: ['Law Firm / Legal Services', 'Accounting / Audit Firm', 'Tax Consultant', 'Business Consultant', 'Marketing Agency', 'Branding Agency', 'Advertising Agency', 'HR Consulting', 'Management Consulting', 'Public Relations (PR)', 'Others']
        },
        {
            name: 'Technology & Digital Services',
            description: 'Businesses that provide technology services, digital solutions, or IT-related services.',
            subcategories: ['Software Development', 'Website Development', 'Mobile App Development', 'IT Support Services', 'Cybersecurity Services', 'Data & Analytics Services', 'SaaS / Tech Platform', 'Digital Marketing Agency', 'Social Media Management', 'Graphic Design', 'UI/UX Design', 'Printing & Branding Services', 'Computer Repair', 'Phone Repair', 'Internet Service Provider', 'Others']
        },
        {
            name: 'Education & Training',
            description: 'Businesses that provide learning, academic training, or skill development.',
            subcategories: ['Nursery / Primary School', 'Secondary School', 'University / Polytechnic', 'Private Tutor', 'Training Institute', 'Professional Certification Training', 'Tech Bootcamp', 'Driving School', 'Music School', 'Language School', 'Online Course Provider', 'Coaching Center', 'Others']
        },
        {
            name: 'Real Estate & Property',
            description: 'Businesses involved in buying, selling, renting, managing, or developing properties.',
            subcategories: ['Real Estate Agency', 'Property Developer', 'Property Management', 'Land Sales Company', 'Facility Management', 'Surveying Services', 'Estate Valuation', 'Short-let Management', 'Others']
        },
        {
            name: 'Automotive',
            description: 'Businesses that sell vehicles or provide car-related services.',
            subcategories: ['Car Dealership', 'Used Car Dealer', 'Car Rental', 'Mechanic Workshop', 'Auto Spare Parts', 'Car Wash', 'Auto Electrical Repair', 'Tire Shop', 'Vehicle Inspection', 'Vehicle Tracking Services', 'Others']
        },
        {
            name: 'Logistics & Transportation',
            description: 'Businesses that move people, goods, or deliveries from one place to another.',
            subcategories: ['Courier Service', 'Delivery Company', 'Logistics Company', 'Trucking Services', 'Bike Delivery', 'Moving Company', 'Bus Transport Company', 'Taxi / Ride Hailing', 'Freight Forwarding', 'Shipping Company', 'Others']
        },
        {
            name: 'Construction & Home Services',
            description: 'Businesses that build, repair, install, or maintain homes, buildings, or infrastructure.',
            subcategories: ['Construction Company', 'Building Contractor', 'Architecture Firm', 'Interior Design', 'Plumbing Services', 'Electrical Installation', 'Painting Services', 'Carpentry', 'Tiling Services', 'Welding / Metal Fabrication', 'Cleaning Services', 'Pest Control', 'Security Services', 'Others']
        },
        {
            name: 'Events & Entertainment',
            description: 'Businesses that provide entertainment, event planning, and event services.',
            subcategories: ['Event Planning', 'Wedding Planner', 'Event Hall / Venue', 'DJ Services', 'Photography', 'Videography', 'MC / Host', 'Equipment Rental', 'Stage & Lighting', 'Decor Services', 'Entertainment Company', 'Others']
        },
        {
            name: 'Finance & Financial Services',
            description: 'Businesses that help people manage, invest, borrow, insure, or move money.',
            subcategories: ['Bank', 'Microfinance Bank', 'Fintech Company', 'POS Agent / POS Business', 'Bureau De Change', 'Insurance Company', 'Investment Company', 'Loan Services', 'Mortgage Services', 'Cooperative Society', 'Others']
        },
        {
            name: 'Agriculture & Farming',
            description: 'Businesses involved in farming, livestock, food production, or agricultural supply.',
            subcategories: ['Crop Farming', 'Livestock Farming', 'Poultry Farm', 'Fish Farm', 'Agro Processing', 'Farm Produce Trading', 'Fertilizer & Farm Input Supply', 'Agricultural Equipment Supply', 'Others']
        },
        {
            name: 'Manufacturing & Production',
            description: 'Businesses that produce goods or manufacture products.',
            subcategories: ['Food Processing', 'Beverage Production', 'Clothing Manufacturing', 'Furniture Manufacturing', 'Plastic Manufacturing', 'Cosmetics Manufacturing', 'Pharmaceutical Manufacturing', 'Packaging Production', 'Printing Production', 'Others']
        },
        {
            name: 'Religious & Non-Profit Organizations',
            description: 'Organizations that operate for religious, charity, or social impact purposes.',
            subcategories: ['Church', 'Mosque', 'NGO', 'Charity Organization', 'Foundation', 'Community Organization', 'Others']
        },
        {
            name: 'Government & Public Services',
            description: 'Government institutions or public service providers.',
            subcategories: ['Government Office', 'Public Agency', 'Public Utility Service', 'Public Healthcare Facility', 'Public School', 'Others']
        },
        {
            name: 'Others',
            description: 'If your business does not fit into any of the categories above, select this option and specify what your business does.',
            subcategories: ['Others']
        }
    ];
    const goals = ['Capture Leads', 'Automated Rewards', 'Customer Feedback', 'Digital Loyalty'];

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

    const isManager = formData.selectedRole === 'Manager';
    const maxSubStep = isManager ? 3 : 8;

    const nextStep = () => {
        if (step === 3 && subStep < maxSubStep) {
            setSubStep(prev => prev + 1);
        } else if (step === 3 && subStep === maxSubStep) {
            setStep(5);
            setSubStep(1);
        } else {
            setStep(prev => prev + 1);
            setSubStep(1);
        }
    };
    const prevStep = () => {
        if (step === 5) {
            setStep(3);
            setSubStep(8);
        } else if (step === 3 && subStep > 1) {
            setSubStep(prev => prev - 1);
        } else {
            setStep(prev => prev - 1);
        }
    };

    const calculatePersonalPrice = () => {
        let base = 15000;
        const branchVal = formData.branchCount === 'No branch' ? 0 :
            formData.branchCount === '1' ? 0 :
                formData.branchCount === '2-5' ? 5000 :
                    formData.branchCount === '6-10' ? 15000 :
                        formData.branchCount === '11-50' ? 40000 : 100000;

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
            let verificationDocUrl = cleanData.verificationDoc;

            if (!isManager) {
                // Upload business logo
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

                // Upload verification document
                if (cleanData.verificationDoc && (cleanData.verificationDoc.startsWith('data:image') || cleanData.verificationDoc.startsWith('data:application'))) {
                    const docToast = toast.loading('Uploading verification document...');
                    try {
                        verificationDocUrl = await uploadToCloudinary(cleanData.verificationDoc);
                        toast.success('Document uploaded!', { id: docToast });
                    } catch (docError: any) {
                        console.error('Document upload failed:', docError);
                        toast.error('Document upload failed. Proceeding...', { id: docToast });
                        verificationDocUrl = null;
                    }
                }
            }

            if (isManager) {
                // Manager flow: POST /auth/register with role=Manager and businessId
                const payload = {
                    firstName: cleanData.firstName,
                    lastName: cleanData.lastName,
                    email: cleanData.email,
                    password: formData.password,
                    role: 'Manager',
                    businessId: cleanData.businessId || undefined,
                };
                response = await registerUser(payload);
            } else {
                // Owner flow: POST /auth/register/owner (creates business)
                // Resolve Category IDs from backend data
                const selectedCategory = categories.find((c: any) => c.name === cleanData.category);
                const selectedSubcategory = selectedCategory?.subcategories?.find((s: any) => s.name === formData.subcategory);

                if (!selectedCategory || (!selectedSubcategory && formData.subcategory !== 'Others')) {
                    toast.error('Please select a valid category and subcategory.');
                    setIsLoading(false);
                    return;
                }

                const payload = {
                    email: cleanData.email,
                    password: formData.password,
                    businessName: cleanData.businessName,
                    businessLogo: businessLogoUrl || undefined,
                    categoryId: selectedCategory.id,
                    subcategoryId: selectedSubcategory?.id || selectedCategory.subcategories?.find((s: any) => s.name === 'Others')?.id || '',
                    otherSubcategoryName: formData.subcategory === 'Others' ? (cleanData as any).otherSubcategoryName : undefined,
                    visitors: cleanData.visitors || undefined,
                    goals: cleanData.goals && cleanData.goals.length > 0 ? cleanData.goals : undefined,
                    whatsappNumber: cleanData.whatsappNumber || undefined,
                    officialEmail: cleanData.officialEmail || cleanData.email,
                    businessNumber: cleanData.businessNumber || formData.phone,
                    businessAddress: cleanData.businessAddress || undefined,
                    businessWebsite: cleanData.businessWebsite || undefined,
                    isRegistered: cleanData.isRegistered === 'Yes',
                    registrationNumber: cleanData.registrationNumber || undefined,
                    verificationDoc: verificationDocUrl || undefined,
                };
                response = await registerOwner(payload as any);
            }

            const userData = {
                email: cleanData.email,
                name: `${cleanData.firstName} ${cleanData.lastName}`,
                role: cleanData.selectedRole.toLowerCase() as any,
                businessName: cleanData.businessName || response?.user?.businessName,
                businessId: response?.user?.businessId || undefined,
            };

            await signup(userData as any, response.access_token);
            setStep(6);

            setTimeout(() => {
                router.push(isManager ? '/dashboard' : '/dashboard/settings/subscription');
            }, 3000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-white flex overflow-hidden font-sans">
            {/* Left Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto">
                <div className="p-8 md:p-16 lg:p-24">
                    <Logo className="flex items-center gap-3" />

                    <div className="max-w-md w-full mx-auto lg:mx-0">
                        {/* Progress Bar */}
                        <div className="flex gap-1.5 mb-12">
                            {[1, 2, 3, 5, 6].map(s => {
                                let progress = 0;
                                if (step > s) progress = 100;
                                else if (step === s) {
                                    if (step === 3) progress = (subStep / 8) * 100;
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

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <SanitizedInput
                                                label="Password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(v) => { setFormData({ ...formData, password: v }); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                                                icon="lock"
                                                placeholder="••••••••"
                                                required
                                                tooltip="Min 8 characters, with uppercase, lowercase, number and symbol"
                                                error={fieldErrors.password}
                                                showPasswordToggle
                                                showPassword={showPassword}
                                                onTogglePassword={() => setShowPassword(!showPassword)}
                                            />
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
                                            onClick={handleCreateAccount}
                                            disabled={!formData.agreeToTerms || isOtpLoading || isRegistering || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.phone}
                                            className="w-full h-14 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-2 text-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            {isOtpLoading || isRegistering ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    Create Account
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
                                                        setFormData({ ...formData, otp: otpArr.join('').replace(/\s/g, '') });
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
                                            {subStep === 7 && "What are your goals?"}
                                            {subStep === 8 && "Vital Business Info"}
                                        </h1>
                                        <p className="text-[13px] text-text-secondary font-medium leading-relaxed">
                                            {subStep === 1 && "Start with the name customers know you by."}
                                            {subStep === 2 && "Upload your logo to personalize your dashboard and customer tags."}
                                            {subStep === 3 && "How many branches does your business have?"}
                                            {subStep === 4 && "Select the category that best fits your business."}
                                            {subStep === 5 && "Important for campaign communications and support."}
                                            {subStep === 6 && "This helps us optimize your experience for your footfall volume."}
                                            {subStep === 7 && "Tell us what you want to achieve with VemTap."}
                                            {subStep === 8 && "Adding your address, location and website helps us localize your profile."}
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {subStep === 1 && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Number of Branches</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {['No branch', '1', '2-5', '6-10', '11-50', '50+'].map(range => (
                                                        <button
                                                            key={range}
                                                            onClick={() => setFormData({ ...formData, branchCount: range })}
                                                            className={`w-full h-14 rounded-xl px-6 text-sm font-bold transition-all border flex items-center justify-between ${formData.branchCount === range ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-gray-50 border-gray-100 text-text-secondary hover:bg-gray-100'}`}
                                                        >
                                                            <span>{range} {range === '1' ? 'Branch' : range === 'No branch' ? '' : 'Branches'}</span>
                                                            {formData.branchCount === range && <span className="material-icons-round text-primary text-sm">check_circle</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {subStep === 4 && !isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Business Category</label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {categoriesData.map(c => (
                                                            <button
                                                                key={c.name}
                                                                onClick={() => setFormData({ ...formData, category: c.name, subcategory: '' })}
                                                                className={`px-4 py-4 rounded-xl text-[11px] font-bold transition-all border text-left flex flex-col gap-1 ${formData.category === c.name ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-gray-50 border-gray-100 text-text-secondary hover:bg-gray-100'}`}
                                                            >
                                                                <span className="block truncate">{c.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <AnimatePresence mode="wait">
                                                    {formData.category && (
                                                        <motion.div
                                                            key={formData.category}
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
                                                                    {categoriesData.find(c => c.name === formData.category)?.description}
                                                                </p>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Select Subcategory</label>
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                    {categoriesData.find(c => c.name === formData.category)?.subcategories.map(sub => (
                                                                        <button
                                                                            key={sub}
                                                                            onClick={() => setFormData({ ...formData, subcategory: sub })}
                                                                            className={`px-3 py-2.5 rounded-lg text-[10px] font-bold transition-all border text-center leading-tight ${formData.subcategory === sub ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-white border-gray-100 text-text-secondary hover:bg-gray-50'}`}
                                                                        >
                                                                            {sub}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {formData.subcategory === 'Others' && (
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

                                        {subStep === 5 && !isManager && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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

                                                <SanitizedInput
                                                    label="Business Phone Number"
                                                    type="tel"
                                                    value={formData.businessNumber}
                                                    onChange={(v) => setFormData({ ...formData, businessNumber: v })}
                                                    icon="phone"
                                                    placeholder="+234 801 234 5678"
                                                    required
                                                    tooltip="Primary number for your business operations."
                                                />

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Is your business registered?</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Yes', 'No'].map(opt => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => setFormData({ ...formData, isRegistered: opt as any })}
                                                                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border text-center ${formData.isRegistered === opt ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-gray-50 border-gray-100 text-text-secondary hover:bg-gray-100'}`}
                                                            >
                                                                {opt === 'Yes' ? 'Yes – Registered' : 'No – Not Registered'}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 mt-2 space-y-4">
                                                        {formData.isRegistered === 'Yes' ? (
                                                            <div className="space-y-4">
                                                                <p className="text-[11px] text-blue-600 font-medium p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                                                    Your business is officially registered. Please provide your CAC number and upload your certificate.
                                                                </p>
                                                                <SanitizedInput
                                                                    label="Registration Number (CAC)"
                                                                    value={formData.registrationNumber}
                                                                    onChange={(v) => setFormData({ ...formData, registrationNumber: v })}
                                                                    icon="description"
                                                                    placeholder="RC-1234567"
                                                                    required
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <p className="text-[11px] text-amber-600 font-medium p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                                                                    Not registered? Please upload a valid government ID (National ID, NIMC, or Passport) for verification.
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                                                                {formData.isRegistered === 'Yes' ? 'Upload CAC Document' : 'Upload ID Document'}
                                                            </label>
                                                            <div className="flex items-center gap-4 p-4 border border-dashed border-gray-200 rounded-xl bg-white">
                                                                <div className="size-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                                                    {formData.verificationDoc ? (
                                                                        formData.verificationDoc.startsWith('data:image') ? (
                                                                            <img src={formData.verificationDoc} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="material-icons-round text-primary text-xl">description</span>
                                                                        )
                                                                    ) : (
                                                                        <span className="material-icons-round text-gray-300 text-xl">file_upload</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <input
                                                                        type="file"
                                                                        id="doc-upload"
                                                                        className="hidden"
                                                                        accept="image/*,.pdf"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                const reader = new FileReader();
                                                                                reader.onloadend = () => {
                                                                                    setFormData({ ...formData, verificationDoc: reader.result as string });
                                                                                };
                                                                                reader.readAsDataURL(file);
                                                                            }
                                                                        }}
                                                                    />
                                                                    <label htmlFor="doc-upload" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-text-main cursor-pointer hover:bg-gray-50 transition-all">
                                                                        {formData.verificationDoc ? 'Change Document' : 'Select Document'}
                                                                    </label>
                                                                    <p className="text-[10px] text-text-secondary mt-1">PDF, JPG or PNG. Max 5MB</p>
                                                                </div>
                                                                {formData.verificationDoc && (
                                                                    <span className="material-icons-round text-green-500">check_circle</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
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
                                                        <select
                                                            value={formData.state}
                                                            onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-xs font-bold text-text-main focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                                        >
                                                            <option value="">Select State</option>
                                                            {Object.keys(statesData).sort().map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">City</label>
                                                        <select
                                                            value={formData.city}
                                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                            disabled={!formData.state}
                                                            className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-xs font-bold text-text-main focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none disabled:opacity-50"
                                                        >
                                                            <option value="">Select City</option>
                                                            {formData.state && statesData[formData.state]?.sort().map(c => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                        </select>
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

                                        <div className="flex gap-4 pt-4">
                                            <button onClick={prevStep} className="h-12 px-8 border border-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm">Back</button>
                                            <button
                                                onClick={nextStep}
                                                disabled={
                                                    (subStep === 1 && !formData.businessName) ||
                                                    (subStep === 3 && isManager && !formData.businessId) ||
                                                    (!isManager && subStep === 3 && !formData.branchCount) ||
                                                    (!isManager && subStep === 4 && !formData.category) ||
                                                    (!isManager && subStep === 5 && (!formData.whatsappNumber || !formData.officialEmail || !formData.businessNumber || !formData.verificationDoc || (formData.isRegistered === 'Yes' && !formData.registrationNumber))) ||
                                                    (!isManager && subStep === 6 && !formData.visitors) ||
                                                    (!isManager && subStep === 7 && formData.goals.length === 0) ||
                                                    (!isManager && subStep === 8 && (!formData.businessAddress || !formData.state || !formData.city))
                                                }
                                                className="flex-1 h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all text-sm disabled:opacity-50"
                                            >
                                                {subStep === maxSubStep ? (isManager ? "Review Your Application" : "Review Your Application") : "Next Question"}
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
                                                <p className="text-[10px] font-black text-primary uppercase tracking-wider">{formData.category}</p>
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
                                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Branches</p>
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
                                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Business Phone</p>
                                                        <p className="text-xs font-bold text-text-main">{formData.businessNumber || 'Not set'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Registered</p>
                                                        <p className="text-xs font-bold text-text-main">{formData.isRegistered} {formData.isRegistered === 'Yes' ? `(${formData.registrationNumber})` : ''}</p>
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
                                                `${plan.tagsLimit} Tags`,
                                                `${plan.branchLimit} Branches`,
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
                                                                // For other plans, we'll set it and redirect to dashboard billing
                                                                // in a real app this would go to Stripe/Paystack
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

            {/* Right Side: Mockup Image */}
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
