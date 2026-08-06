'use client';

import React, { useState } from 'react';
import DiscoveryNav from '@/components/admin/discovery/DiscoveryNav';
import { 
    FileText, Download, Calendar, Filter, 
    BarChart3, PieChart, TrendingUp, Users,
    CheckCircle2, Clock, Plus, Share2, MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminReports, useGenerateAdminReport } from '@/services/discovery/hooks';

export default function DiscoveryReportsPage() {
    const { data: reportsData, isLoading } = useAdminReports({ page: 1, limit: 10 });
    const generateReport = useGenerateAdminReport();

    const [reportType, setReportType] = useState('Network Performance Summary');
    const [dateRange, setDateRange] = useState('Last 7 Days');

    const reports = reportsData?.data ?? [];

    const handleGenerate = () => {
        generateReport.mutate({
            name: reportType,
            type: reportType,
            dateRange,
        });
    };

    return (
        <div className="p-8">
            <DiscoveryNav current="/admin/discovery/reports" />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* Report Generator Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-display font-bold text-text-main flex items-center gap-2">
                                <Plus className="text-primary" size={24} />
                                Generate New Report
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Report Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                >
                                    <option>Network Performance Summary</option>
                                    <option>Location & District ROI</option>
                                    <option>Industry Category Breakdown</option>
                                    <option>Sponsored Ads & Billing</option>
                                    <option>Fraud & Audit Logs</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Date Range</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
                                    <select
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 text-sm font-bold text-text-main outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                    >
                                        <option>Last 7 Days</option>
                                        <option>Last 30 Days</option>
                                        <option>Current Quarter (Q2)</option>
                                        <option>Custom Range...</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={generateReport.isPending}
                            className="mt-8 w-full py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generateReport.isPending ? (
                                <Clock size={18} className="animate-spin" />
                            ) : (
                                <BarChart3 size={18} />
                            )}
                            {generateReport.isPending ? 'Generating...' : 'Compile & Generate Report'}
                        </button>
                    </div>

                    {/* Recent Reports Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="text-lg font-display font-bold text-text-main">Generated Reports Archive</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Report Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Type</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={`skeleton-${i}`} className="animate-pulse">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-lg bg-gray-100" />
                                                        <div className="space-y-1.5">
                                                            <div className="h-3.5 w-48 bg-gray-100 rounded" />
                                                            <div className="h-2.5 w-16 bg-gray-100 rounded" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><div className="h-3.5 w-28 bg-gray-100 rounded" /></td>
                                                <td className="px-6 py-4"><div className="h-3.5 w-24 bg-gray-100 rounded" /></td>
                                                <td className="px-6 py-4 text-center"><div className="h-5 w-20 bg-gray-100 rounded-full mx-auto" /></td>
                                                <td className="px-6 py-4 text-right"><div className="h-7 w-20 bg-gray-100 rounded-lg ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-main group-hover:text-primary transition-colors">{report.name}</p>
                                                        <p className="text-[10px] font-medium text-text-secondary mt-0.5">{report.size}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-text-secondary">{report.type}</td>
                                            <td className="px-6 py-4 text-text-secondary">{report.date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    report.status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {report.status === 'Ready' ? <CheckCircle2 size={12} /> : <Clock size={12} className="animate-spin" />}
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button disabled={report.status !== 'Ready'} className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary hover:text-white transition-all disabled:opacity-30">
                                                        <Download size={16} />
                                                    </button>
                                                    <button className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-gray-100 transition-all">
                                                        <Share2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Automation & Insights */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-text-main mb-6 flex items-center gap-2">
                            <Clock className="text-primary" size={18} />
                            Automated Reports
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Weekly Performance', time: 'Monday, 8:00 AM', status: 'Active' },
                                { label: 'Monthly Billing', time: '1st of Month', status: 'Active' },
                            ].map((job) => (
                                <div key={job.label} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-bold text-text-main">{job.label}</p>
                                        <div className="size-2 rounded-full bg-emerald-500" />
                                    </div>
                                    <p className="text-[10px] font-medium text-text-secondary">{job.time}</p>
                                </div>
                            ))}
                        </div>
                        <button className="mt-6 w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:border-primary hover:text-primary transition-all">
                            Schedule New Automation
                        </button>
                    </div>

                    <div className="bg-text-main rounded-3xl p-8 text-white relative overflow-hidden group">
                        <h3 className="text-lg font-display font-bold mb-2">Data Privacy</h3>
                        <p className="text-white/60 text-xs font-medium leading-relaxed">
                            All generated reports are <span className="text-white font-bold">automatically encrypted</span> and expire after 30 days of inactivity to remain DPA compliant.
                        </p>
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                            <FileText size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
