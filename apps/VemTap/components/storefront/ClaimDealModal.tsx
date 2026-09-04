'use client';

import { X, Check } from 'lucide-react';

export type ClaimStep = 'details' | 'otp' | 'success';

export interface ClaimForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ClaimDealModalProps {
  offer: any;
  step: ClaimStep;
  form: ClaimForm;
  otpCode: string;
  error: string | null;
  isSubmitting: boolean;
  successPayload: any | null;
  onClose: () => void;
  onFormChange: (field: keyof ClaimForm, value: string) => void;
  onOtpChange: (value: string) => void;
  onRequestOtp: (e: React.FormEvent) => void;
  onVerifyOtp: (e: React.FormEvent) => void;
  onBackToDetails: () => void;
}

export default function ClaimDealModal({
  offer,
  step,
  form,
  otpCode,
  error,
  isSubmitting,
  successPayload,
  onClose,
  onFormChange,
  onOtpChange,
  onRequestOtp,
  onVerifyOtp,
  onBackToDetails,
}: ClaimDealModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-100 cursor-pointer"
        >
          <X size={15} />
        </button>

        <div className="p-6">
          {/* Modal Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold shrink-0">
              🎁
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-sm truncate">
                Claim: {offer.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                OTP Verification Promotion Claim
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs px-3.5 py-2.5 rounded-xl border border-red-100 mb-4 font-semibold">
              {error}
            </div>
          )}

          {/* STEP 1: Enter details */}
          {step === 'details' && (
            <form onSubmit={onRequestOtp} className="space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                <input
                  type="text"
                  required
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  value={form.firstName}
                  onChange={(e) => onFormChange('firstName', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                <input
                  type="text"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  value={form.lastName}
                  onChange={(e) => onFormChange('lastName', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  value={form.email}
                  onChange={(e) => onFormChange('email', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="tel"
                  required
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  value={form.phone}
                  onChange={(e) => onFormChange('phone', e.target.value)}
                  placeholder="+234..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-600/10 mt-2 cursor-pointer"
              >
                {isSubmitting ? 'Sending code...' : 'Send Verification OTP'}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 'otp' && (
            <form onSubmit={onVerifyOtp} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                We sent a verification code to <span className="font-semibold text-slate-700">{form.email}</span>.
                Please enter the code below to complete the claim.
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase text-center">OTP Code</label>
                <input
                  type="text"
                  required
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-center text-sm font-bold tracking-widest focus:outline-none focus:border-blue-600 max-w-[160px] mx-auto w-full"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => onOtpChange(e.target.value)}
                  placeholder="------"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer"
              >
                {isSubmitting ? 'Verifying OTP...' : 'Verify & Claim Offer'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={onBackToDetails}
                  className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold cursor-pointer"
                >
                  Go Back / Edit Details
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                <Check size={28} strokeWidth={3} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Claim Successful!</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed px-4">
                  Your promotional offer has been secured. Save your unique verification details below to redeem this at the counter.
                </p>
              </div>

              {successPayload && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 max-w-xs mx-auto text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Claim Code
                  </span>
                  <div className="text-lg font-black text-slate-800 tracking-wider">
                    {successPayload.code || successPayload.data?.code || 'CLAIMED'}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
