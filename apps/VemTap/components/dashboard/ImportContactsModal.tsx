'use client';

import React, { useState, useCallback } from 'react';
import {
    X, Upload, Download, FileSpreadsheet, CheckCircle2,
    AlertCircle, Search, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMockDashboardStore, Visitor } from '@/lib/store/mockDashboardStore';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ImportContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CustomerRow {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export default function ImportContactsModal({ isOpen, onClose }: ImportContactsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview] = useState<CustomerRow[]>([]);
    const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
    const importVisitors = useMockDashboardStore(state => state.importVisitors);
    const activeBranchId = useBusinessStore(state => state.activeBranchId);
    const activeBranch = useBusinessStore(state => state.getActiveBranch)();
    const queryClient = useQueryClient();

    const parseCSV = (content: string): CustomerRow[] => {
        const lines = content.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        const nameIndex = headers.findIndex(h => h === 'name' || h === 'fullname' || h === 'customer name');
        const firstNameIndex = headers.findIndex(h => h === 'firstname' || h === 'first_name' || h === 'first name');
        const lastNameIndex = headers.findIndex(h => h === 'lastname' || h === 'last_name' || h === 'last name');
        const phoneIndex = headers.findIndex(h => h === 'phone' || h === 'phone number' || h === 'phonenumber' || h === 'tel' || h === 'telephone');
        const emailIndex = headers.findIndex(h => h === 'email' || h === 'email address' || h === 'emailaddress');

        const customers: CustomerRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            let firstName = '';
            let lastName = '';

            if (nameIndex >= 0 && values[nameIndex]) {
                const fullName = values[nameIndex].split(' ');
                firstName = fullName[0] || '';
                lastName = fullName.slice(1).join(' ') || '';
            } else {
                if (firstNameIndex >= 0) firstName = values[firstNameIndex] || '';
                if (lastNameIndex >= 0) lastName = values[lastNameIndex] || '';
            }

            customers.push({
                firstName,
                lastName,
                email: emailIndex >= 0 ? values[emailIndex] || '' : '',
                phone: phoneIndex >= 0 ? values[phoneIndex] || '' : ''
            });
        }

        return customers;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                toast.error('Please upload a CSV file');
                return;
            }
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = async (file: File) => {
        setIsProcessing(true);
        try {
            const content = await file.text();
            const parsed = parseCSV(content);
            
            if (parsed.length === 0) {
                toast.error('No valid contacts found in the file');
                setIsProcessing(false);
                return;
            }

            setPreview(parsed);
            setStep('preview');
        } catch (error) {
            console.error('Error parsing CSV:', error);
            toast.error('Failed to parse CSV file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        setIsProcessing(true);
        try {
            const customers = preview.map(p => ({
                firstName: p.firstName,
                lastName: p.lastName,
                email: p.email,
                phone: p.phone
            }));

            await api.post('/businesses/import-customers', { customers });

            const newVisitors: Visitor[] = preview.map((p, idx) => ({
                id: `IMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                name: `${p.firstName} ${p.lastName}`.trim(),
                phone: p.phone,
                email: p.email,
                time: 'Imported',
                timestamp: Date.now(),
                status: 'new',
                branchId: activeBranchId,
                location: activeBranch?.address || 'Imported'
            }));

            importVisitors(newVisitors);
            queryClient.invalidateQueries({ queryKey: ['visitors'] });
            
            setStep('success');
            toast.success(`${customers.length} contacts imported successfully`);
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(error.response?.data?.message || 'Failed to import contacts');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent = "firstName,lastName,phone,email\nJohn,Doe,+2348012345678,john@example.com\nJane,Smith,+2348023456789,jane@example.com";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "vemtap_contacts_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const resetModal = () => {
        setFile(null);
        setPreview([]);
        setStep('upload');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-4xl shadow-2xl w-full max-w-xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-text-main tracking-tight">Import Contacts</h3>
                                <p className="text-xs text-text-secondary font-bold uppercase tracking-widest mt-1">
                                    Assigning to: <span className="text-primary">{activeBranch?.name}</span>
                                </p>
                            </div>
                            <button onClick={resetModal} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm active:scale-95">
                                <X size={20} className="text-text-secondary" />
                            </button>
                        </div>

                        <div className="p-8">
                            {step === 'upload' && (
                                <div className="space-y-6">
                                    <div
                                        onClick={() => document.getElementById('fileInput')?.click()}
                                        className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
                                    >
                                        <input
                                            type="file"
                                            id="fileInput"
                                            className="hidden"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                        />
                                        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            {isProcessing ? (
                                                <Loader2 size={32} className="text-primary animate-spin" />
                                            ) : (
                                                <Upload size={32} className="text-primary" />
                                            )}
                                        </div>
                                        <h4 className="font-bold text-text-main text-lg">Click to upload CSV</h4>
                                        <p className="text-sm text-text-secondary mt-1">or drag and drop your file here</p>
                                    </div>

                                    <div className="bg-blue-50/50 rounded-2xl p-4 flex gap-3 border border-blue-100">
                                        <AlertCircle className="text-blue-500 shrink-0" size={20} />
                                        <div className="text-xs text-blue-700 font-medium leading-relaxed">
                                            Please use our standard template to ensure all data is correctly mapped.
                                            Max file size is 5MB.
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="w-full h-12 flex items-center justify-center gap-2 border border-gray-200 rounded-xl text-sm font-black uppercase tracking-widest text-text-main hover:bg-gray-50 transition-all"
                                    >
                                        <Download size={18} />
                                        Download CSV Template
                                    </button>
                                </div>
                            )}

                            {step === 'preview' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-text-main">Preview Contacts ({preview.length})</h4>
                                        <button onClick={() => setStep('upload')} className="text-xs font-black text-primary uppercase tracking-widest">
                                            Change File
                                        </button>
                                    </div>

                                    <div className="border border-gray-100 rounded-2xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-text-secondary uppercase text-[10px] tracking-widest">First Name</th>
                                                    <th className="px-4 py-3 font-bold text-text-secondary uppercase text-[10px] tracking-widest">Last Name</th>
                                                    <th className="px-4 py-3 font-bold text-text-secondary uppercase text-[10px] tracking-widest">Phone</th>
                                                    <th className="px-4 py-3 font-bold text-text-secondary uppercase text-[10px] tracking-widest">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {preview.map((p, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 font-medium text-text-main">{p.firstName}</td>
                                                        <td className="px-4 py-3 font-medium text-text-main">{p.lastName}</td>
                                                        <td className="px-4 py-3 text-text-secondary font-medium">{p.phone}</td>
                                                        <td className="px-4 py-3 text-text-secondary font-medium">{p.email}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button
                                        onClick={handleImport}
                                        disabled={isProcessing}
                                        className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                        Start Import
                                    </button>
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="text-center py-8">
                                    <div className="size-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <h4 className="text-2xl font-black text-text-main tracking-tight mb-2">Import Successful!</h4>
                                    <p className="text-text-secondary font-medium text-sm max-w-xs mx-auto mb-8 leading-relaxed">
                                        Your contacts have been successfully added to <strong>{activeBranch?.name}</strong>.
                                    </p>
                                    <button
                                        onClick={resetModal}
                                        className="w-full h-14 bg-text-main text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-800 transition-all"
                                    >
                                        Back to Dashboard
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
