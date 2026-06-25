'use client';

import React, { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyBusiness, useUpdateBusiness } from '@/services/businesses/hooks';
import { uploadToCloudinary } from '@/lib/cloudinary';
import toast from 'react-hot-toast';

const REQUIRED_DOCS = [
  { key: 'cacDocument', label: 'CAC Certificate', description: 'Certificate of Incorporation from CAC', hint: 'PDF or image, max 5MB' },
  { key: 'idDocument', label: 'Valid ID Document', description: 'Government-issued ID (Driver\'s License, Passport, National ID)', hint: 'PDF or image, max 5MB' },
  { key: 'utilityBill', label: 'Utility Bill', description: 'Recent utility bill (electricity, water, or rates) as proof of address', hint: 'PDF or image, max 5MB, dated within 3 months' },
];

export function DocumentsSettingsView() {
  const { data: business } = useMyBusiness();
  const updateBusiness = useUpdateBusiness();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<{ key: string; file: File } | null>(null);

  const handleFileSelect = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile({ key, file });
    handleUpload(key, file);
  };

  const handleUpload = async (key: string, file: File) => {
    setUploading(key);
    try {
      const url = await uploadToCloudinary(file);
      await updateBusiness.mutateAsync({ updates: { [key]: url } });
      toast.success(`${REQUIRED_DOCS.find(d => d.key === key)?.label} uploaded successfully`);
      setPendingFile(null);
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const getDocValue = (key: string) => {
    if (!business) return null;
    if (key === 'utilityBill') return (business as any).utilityBill || null;
    return (business as any)[key] || null;
  };

  const submittedCount = REQUIRED_DOCS.filter(d => getDocValue(d.key)).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Progress Card */}
      <div className="rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
        <div className="flex items-start gap-6 mb-8">
          <div className="size-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <FileText size={28} className="text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-gray-900 mb-1">Required Documents</h3>
            <p className="text-xs text-gray-500 font-medium">Upload the required documents to verify your business identity</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-gray-900">{submittedCount}/{REQUIRED_DOCS.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Submitted</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-[#066CF4] rounded-full transition-all duration-500"
            style={{ width: `${(submittedCount / REQUIRED_DOCS.length) * 100}%` }}
          />
        </div>

        {/* Document List */}
        <div className="space-y-4">
          {REQUIRED_DOCS.map((doc) => {
            const value = getDocValue(doc.key);
            const isUploading = uploading === doc.key;
            const isSubmitted = !!value;

            return (
              <div key={doc.key} className={cn(
                "p-6 rounded-3xl border transition-all",
                isSubmitted ? "bg-emerald-50/50 border-emerald-100" : "bg-gray-50 border-gray-100"
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-black text-gray-900">{doc.label}</h4>
                      {isSubmitted ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{doc.description}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">{doc.hint}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSubmitted ? (
                      <>
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="size-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#066CF4] hover:border-[#066CF4]/30 transition-all"
                        >
                          <Eye size={16} />
                        </a>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-lg">
                          Uploaded
                        </span>
                      </>
                    ) : (
                      <label className={cn(
                        "size-10 rounded-xl flex items-center justify-center cursor-pointer transition-all",
                        isUploading
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-[#066CF4]/10 text-[#066CF4] hover:bg-[#066CF4]/20 border border-[#066CF4]/20"
                      )}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileSelect(doc.key, e)}
                          disabled={isUploading}
                        />
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-[40px] bg-gradient-to-br from-blue-500/5 to-blue-600/5 border border-blue-100 p-8">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
            <AlertCircle size={24} className="text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 mb-1">Submission Process</h4>
            <ol className="space-y-2 text-xs text-gray-600 font-medium">
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-[#066CF4]/10 text-[#066CF4] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                Upload clear, legible copies of each required document
              </li>
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-[#066CF4]/10 text-[#066CF4] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                Our team reviews your documents within 1-2 business days
              </li>
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-[#066CF4]/10 text-[#066CF4] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                You will be notified once your documents are verified
              </li>
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-[#066CF4]/10 text-[#066CF4] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">4</span>
                Once verified, your business gains full access to all features
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
