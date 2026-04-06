'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Building2, 
    MapPin, 
    Store, 
    Users2, 
    ArrowRight, 
    CheckCircle2, 
    Mail, 
    Phone,
    User,
    Package,
    Sparkles
} from 'lucide-react';
import { businessProfilingApi } from '@/lib/api/business-profiling';
import { notify } from '@/lib/notify';

const steps = [
    { 
        id: 'basic', 
        title: 'Identity', 
        label: 'What is your Business called?', 
        desc: 'Tell us the name and type of your establishment.',
        icon: Building2 
    },
    { 
        id: 'contact', 
        title: 'Communication', 
        label: 'How can we reach you?', 
        desc: 'Provide your contact details so our AI can send your custom analysis.',
        icon: User 
    },
    { 
        id: 'location', 
        title: 'Geography', 
        label: 'Where are you located?', 
        desc: 'We use location data to analyze regional market trends.',
        icon: MapPin 
    },
    { 
        id: 'scale', 
        title: 'Traffic', 
        label: 'How busy does it get?', 
        desc: 'Higher foot traffic often yields 4x faster ROI.',
        icon: Users2 
    },
    { 
        id: 'setup', 
        title: 'Physical', 
        label: 'Your Storefront Setup', 
        desc: 'NFC engagement works best with specific physical placements.',
        icon: Store 
    },
];

const FormGroup = ({ label, children, error }: { label: string, children: React.ReactNode, error?: string }) => (
  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-1">{error}</p>}
  </div>
);

const FormInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
      {...props}
      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all hover:bg-white/10"
  />
);

const ChoiceButton = ({ label, selected, onClick }: { label: string, selected: boolean, onClick: () => void }) => (
  <button
      onClick={onClick}
      className={`px-6 py-4 rounded-2xl text-[13px] font-bold border-2 transition-all active:scale-95 ${
          selected 
          ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20' 
          : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
      }`}
  >
      {label}
  </button>
);

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => !phone || /^\+?[\d\s-]{7,20}$/.test(phone);

export default function PublicProfilingForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Restaurant',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    location: '',
    numberOfBranches: '1',
    customerTraffic: 'Medium' as 'Low' | 'Medium' | 'High',
    hasTables: true,
    hasGlassDoor: true,
    niche: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!formData.businessName.trim()) {
        setErrors(prev => ({ ...prev, businessName: 'Business Name is required.' }));
        return;
    }
    if (!formData.contactEmail.trim() || !isValidEmail(formData.contactEmail)) {
        setErrors(prev => ({ ...prev, contactEmail: 'A valid Professional Email is required.' }));
        return;
    }
    if (formData.contactPhone && !isValidPhone(formData.contactPhone)) {
        setErrors(prev => ({ ...prev, contactPhone: 'Please enter a valid phone number format.' }));
        return;
    }

    setIsSubmitting(true);
    try {
        await businessProfilingApi.publicCreate(formData);
        notify.success('Business Profile Registered Successfully!');
        setIsFinal(true);
    } catch (error) {
        console.error(error);
        notify.error('Failed to submit profile. Please check your inputs.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setErrors({});
    if (step === 1 && !formData.businessName.trim()) {
        setErrors({ businessName: 'Business Title is required to proceed.' });
        return;
    }
    if (step === 2) {
        if (!formData.contactEmail.trim()) {
            setErrors({ contactEmail: 'Email is required to proceed.' });
            return;
        }
        if (!isValidEmail(formData.contactEmail)) {
            setErrors({ contactEmail: 'Please enter a valid Professional Email.' });
            return;
        }
    }
    setStep(step + 1);
  };

  if (isFinal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-[2rem] bg-green-500/10 flex items-center justify-center mb-10 shadow-2xl shadow-green-500/10 animate-bounce">
            <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Profile Registered!</h2>
        <p className="text-lg text-white/50 max-w-md leading-relaxed">
            Our AI is now scoring your business digitization potential. We will reach out within 24 hours at <strong>{formData.contactEmail}</strong>.
        </p>
        <button 
            onClick={() => window.location.href = '/'}
            className="mt-12 px-10 py-5 bg-white text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-gray-100 transition-all hover:scale-105"
        >
            Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Left Column: Progress & Visual Context */}
      <div className="lg:sticky lg:top-24 space-y-8">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">Step {step}/{steps.length}</span>
                <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">{steps[step-1].title}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                {steps[step-1].label}
            </h2>
            <p className="text-lg text-white/40 leading-relaxed max-w-lg">
                {steps[step-1].desc}
            </p>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2">
            {steps.map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                        i + 1 === step ? 'w-12 bg-primary' : i + 1 < step ? 'w-6 bg-white/40' : 'w-3 bg-white/10'
                    }`}
                />
            ))}
        </div>
      </div>

      {/* Right Column: Form Fields */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[2.5rem]"></div>
        <div className="relative z-10 space-y-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-8"
                >
                    {step === 1 && (
                        <>
                            <FormGroup label="Business Title" error={errors.businessName}>
                                <FormInput 
                                    placeholder="e.g. Suya Kingdom" 
                                    value={formData.businessName}
                                    onChange={(e) => updateField('businessName', e.target.value)}
                                    className={`w-full bg-white/5 border rounded-2xl p-5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all hover:bg-white/10 ${errors.businessName ? 'border-red-500' : 'border-white/10'}`}
                                />
                            </FormGroup>
                            <FormGroup label="Store Type (Optional)">
                                <div className="grid grid-cols-2 gap-3">
                                    {['Restaurant', 'Salon', 'Fashion', 'Store', 'Pharmacy', 'Other'].map(type => (
                                        <ChoiceButton 
                                            key={type}
                                            label={type}
                                            selected={formData.businessType === type}
                                            onClick={() => updateField('businessType', type)}
                                        />
                                    ))}
                                </div>
                            </FormGroup>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <FormGroup label="Your Name (Optional)">
                                <FormInput 
                                    placeholder="Enter your full name" 
                                    value={formData.contactPerson}
                                    onChange={(e) => updateField('contactPerson', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup label="Professional Email" error={errors.contactEmail}>
                                <FormInput 
                                    type="email"
                                    placeholder="email@example.com" 
                                    value={formData.contactEmail}
                                    onChange={(e) => updateField('contactEmail', e.target.value)}
                                    className={`w-full bg-white/5 border rounded-2xl p-5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all hover:bg-white/10 ${errors.contactEmail ? 'border-red-500' : 'border-white/10'}`}
                                />
                            </FormGroup>
                            <FormGroup label="Phone Number (Optional)" error={errors.contactPhone}>
                                <FormInput 
                                    placeholder="+234..." 
                                    value={formData.contactPhone}
                                    onChange={(e) => updateField('contactPhone', e.target.value)}
                                    className={`w-full bg-white/5 border rounded-2xl p-5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all hover:bg-white/10 ${errors.contactPhone ? 'border-red-500' : 'border-white/10'}`}
                                />
                            </FormGroup>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <FormGroup label="Store Location (Optional)">
                                <FormInput 
                                    placeholder="City or Neighborhood" 
                                    value={formData.location}
                                    onChange={(e) => updateField('location', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup label="Branch Count (Optional)">
                                <FormInput 
                                    type="number"
                                    placeholder="1" 
                                    value={formData.numberOfBranches}
                                    onChange={(e) => updateField('numberOfBranches', e.target.value)}
                                />
                            </FormGroup>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <FormGroup label="Daily Peak Foot Traffic (Optional)">
                                <div className="space-y-3">
                                    {['Low (Quiet)', 'Medium (Steady)', 'High (Crowded)'].map(lvl => (
                                        <ChoiceButton 
                                            key={lvl}
                                            label={lvl}
                                            selected={formData.customerTraffic === (lvl.split(' ')[0] as any)}
                                            onClick={() => updateField('customerTraffic', lvl.split(' ')[0])}
                                        />
                                    ))}
                                </div>
                            </FormGroup>
                        </>
                    )}

                    {step === 5 && (
                        <>
                            <FormGroup label="Infrastructure Details (Optional)">
                                <div className="space-y-4">
                                    <div 
                                        onClick={() => updateField('hasTables', !formData.hasTables)}
                                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                                            formData.hasTables ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40'
                                        }`}
                                    >
                                        <span className="text-sm font-black uppercase tracking-wider">Has Seating Area?</span>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${formData.hasTables ? 'bg-primary border-primary' : 'border-white/10'}`}>
                                            {formData.hasTables && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                    </div>
                                    <div 
                                        onClick={() => updateField('hasGlassDoor', !formData.hasGlassDoor)}
                                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                                            formData.hasGlassDoor ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40'
                                        }`}
                                    >
                                        <span className="text-sm font-black uppercase tracking-wider">Has Glass Surfaces?</span>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${formData.hasGlassDoor ? 'bg-primary border-primary' : 'border-white/10'}`}>
                                            {formData.hasGlassDoor && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                    </div>
                                </div>
                            </FormGroup>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-4 pt-8">
                {step > 1 && (
                    <button 
                        onClick={() => setStep(step - 1)}
                        className="px-8 py-5 rounded-[1.5rem] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                        Prev
                    </button>
                )}
                <button 
                    onClick={step === steps.length ? handleSubmit : handleNext}
                    disabled={isSubmitting}
                    className="flex-1 py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:animate-pulse"
                >
                    {isSubmitting ? 'Processing AI Data...' : step === steps.length ? 'Finalize Analysis' : 'Next Level'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
