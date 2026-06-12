"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, Building2, Smartphone, Mail, 
    Lock, ArrowRight, ArrowLeft, Eye, EyeOff, 
    Check, Sparkles, User, ShieldCheck, Rocket,
    ChevronRight, Globe
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { useCategories } from '@/services/categories/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Confetti Component
const Confetti = () => {
    const colors = ['#066CF4', '#4293FF', '#000000', '#F8FAFC', '#E2E8F0'];
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 400 - 200, opacity: 1 }}
                    animate={{ y: 800, rotate: 360, x: Math.random() * 400 - 200 }}
                    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                    className="absolute size-2 rounded-full"
                    style={{ 
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        left: `${Math.random() * 100}%`
                    }}
                />
            ))}
        </div>
    );
};

export default function GetStartedPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        businessCategory: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const { data: categoriesData } = useCategories();

    const handleNext = () => {
        setError('');
        setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        // Simulate registration
        setTimeout(() => {
            setIsLoading(false);
            setStep(4); // Step 4 is success
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
            {/* LEFT COLUMN: Visual Info */}
            <div className="hidden lg:flex lg:w-[40%] bg-gray-900 items-center justify-center p-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#066CF4]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-[100px]" />
                
                <div className="relative z-10 text-white max-w-sm">
                    <Link href="/">
                        <Logo className="h-10 brightness-0 invert mb-16" />
                    </Link>
                    <Badge className="bg-[#066CF4] text-white border-none px-4 py-1.5 font-black uppercase tracking-widest mb-8">
                        Join 2,000+ Businesses
                    </Badge>
                    <h2 className="text-5xl font-black tracking-tight leading-[1.1] mb-10">
                        The Future Of <br /> Customer <br /> Engagement.
                    </h2>
                    
                    <div className="space-y-8">
                        {[
                            { t: 'Capture', d: 'QR and NFC registration in 2 seconds.' },
                            { t: 'Database', d: 'Auto-build your customer list.' },
                            { t: 'Growth', d: 'Send smart automated messages.' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="size-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={16} className="text-[#066CF4]" />
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase tracking-widest mb-1">{item.t}</p>
                                    <p className="text-white/40 text-xs font-medium">{item.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 pt-10 border-t border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="flex -space-x-3">
                              {[1, 2, 3, 4].map(i => <div key={i} className="size-8 rounded-full bg-gray-800 border-2 border-gray-900" />)}
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Loved by owners worldwide</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Multi-step Form */}
            <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-24 bg-white relative">
                <div className="max-w-md w-full mx-auto">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-12">
                        <Link href="/">
                            <Logo className="h-8" />
                        </Link>
                    </div>

                    {/* Progress Indicator */}
                    {step < 4 && (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-4">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#066CF4]">Step {step} of 3</span>
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
                                  {step === 1 ? 'Business' : step === 2 ? 'Contact' : 'Security'}
                               </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-[#066CF4]' : 'bg-gray-100'}`}></div>
                                ))}
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* STEP 1: Business Info */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Tell Us About Your Business</h1>
                                    <p className="text-sm font-medium text-gray-400">Let's start with the basics of your establishment.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Business Name</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input 
                                                type="text" 
                                                value={formData.businessName} 
                                                onChange={(e) => setFormData({...formData, businessName: e.target.value})} 
                                                placeholder="e.g. Blue Bottle Coffee" 
                                                className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Owner / Manager Name</label>
                                        <div className="relative">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input 
                                                type="text" 
                                                value={formData.ownerName} 
                                                onChange={(e) => setFormData({...formData, ownerName: e.target.value})} 
                                                placeholder="Your Full Name" 
                                                className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Business Category</label>
                                        <select 
                                            value={formData.businessCategory} 
                                            onChange={(e) => setFormData({...formData, businessCategory: e.target.value})} 
                                            className="w-full px-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm appearance-none"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="restaurant">Restaurant / Cafe</option>
                                            <option value="retail">Retail / Fashion</option>
                                            <option value="salon">Salon / Spa</option>
                                            <option value="gym">Gym / Fitness</option>
                                            <option value="other">Other Business</option>
                                        </select>
                                    </div>
                                    <Button 
                                        onClick={handleNext} 
                                        disabled={!formData.businessName || !formData.ownerName || !formData.businessCategory} 
                                        className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        Continue <ArrowRight size={16} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Contact Info */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-4">
                                    <ArrowLeft size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                                </button>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">How Can We Reach You?</h1>
                                    <p className="text-sm font-medium text-gray-400">Your contact info will be used for account verification.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Phone Number</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input 
                                                type="tel" 
                                                value={formData.phone} 
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                                placeholder="+234 ..." 
                                                className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input 
                                                type="email" 
                                                value={formData.email} 
                                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                                placeholder="name@business.com" 
                                                className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleNext} 
                                        disabled={!formData.phone || !formData.email} 
                                        className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        Continue <ArrowRight size={16} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Password */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-4">
                                    <ArrowLeft size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                                </button>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">Secure Your Account</h1>
                                    <p className="text-sm font-medium text-gray-400">Choose a strong password for your business dashboard.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Create Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input 
                                                type={showPassword ? 'text' : 'password'} 
                                                value={formData.password} 
                                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                                placeholder="••••••••" 
                                                className="w-full pl-14 pr-14 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)} 
                                                className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#066CF4]"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input 
                                                type="password" 
                                                value={formData.confirmPassword} 
                                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                                                placeholder="••••••••" 
                                                className="w-full pl-14 pr-6 h-16 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm transition-all" 
                                            />
                                        </div>
                                    </div>

                                    {/* Password strength mockup */}
                                    <div className="flex gap-2 h-1 px-1">
                                       <div className={cn("h-full flex-1 rounded-full", formData.password.length > 0 ? "bg-[#066CF4]" : "bg-gray-100")} />
                                       <div className={cn("h-full flex-1 rounded-full", formData.password.length > 5 ? "bg-[#066CF4]" : "bg-gray-100")} />
                                       <div className={cn("h-full flex-1 rounded-full", formData.password.length > 8 ? "bg-[#066CF4]" : "bg-gray-100")} />
                                       <div className={cn("h-full flex-1 rounded-full", formData.password.length > 10 ? "bg-[#066CF4]" : "bg-gray-100")} />
                                    </div>

                                    <Button 
                                        onClick={handleFinalSubmit} 
                                        disabled={isLoading || !formData.password || formData.password !== formData.confirmPassword} 
                                        className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create My Account'}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: Success Screen */}
                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                                <Confetti />
                                <div className="relative z-10">
                                   <div className="size-24 rounded-[40px] bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/10">
                                      <CheckCircle2 size={48} />
                                   </div>
                                   <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">Welcome To Vemtap!</h1>
                                   <p className="text-lg font-medium text-gray-400 mb-12">Your account has been created successfully. Your growth journey starts now.</p>
                                   
                                   <div className="space-y-4">
                                      <Link href="/onboarding" className="block w-full">
                                         <Button className="w-full h-16 bg-[#066CF4] text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                            Complete Business Setup
                                         </Button>
                                      </Link>
                                      <Link href="/dashboard" className="block w-full">
                                         <Button variant="ghost" className="w-full h-16 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-[#066CF4]">
                                            Go To Dashboard
                                         </Button>
                                      </Link>
                                   </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login Link */}
                    {step < 4 && (
                        <div className="mt-12 text-center">
                           <p className="text-sm font-medium text-gray-400">
                              Already have an account? <Link href="/login" className="text-[#066CF4] font-black uppercase tracking-widest text-[10px] ml-2 hover:underline">Sign In</Link>
                           </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
