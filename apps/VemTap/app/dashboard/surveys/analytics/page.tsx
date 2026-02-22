'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import {
    MessageSquare, Users, Star, BarChart3,
    ArrowUpRight, ArrowDownRight, TrendingUp,
    CheckCircle2, Clock, Filter, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToCSV } from '@/lib/utils/export';
import toast from 'react-hot-toast';

const SURVEY_STATS = [
    { label: 'Total Responses', value: '842', trend: '+12%', isUp: true, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Completion Rate', value: '76%', trend: '+5%', isUp: true, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Avg. Rating', value: '4.8', trend: '+0.2', isUp: true, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Avg. Response Time', value: '45s', trend: '-10s', isUp: true, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const QUESTION_RESULTS = [
    {
        question: "How would you rate your overall experience today?",
        type: "rating",
        average: 4.8,
        distribution: [
            { label: '5 Stars', count: 620, percentage: 74 },
            { label: '4 Stars', count: 180, percentage: 21 },
            { label: '3 Stars', count: 32, percentage: 4 },
            { label: '2 Stars', count: 8, percentage: 1 },
            { label: '1 Star', count: 2, percentage: 0 },
        ]
    },
    {
        question: "What did you enjoy most about your visit?",
        type: "choice",
        distribution: [
            { label: 'Service Quality', count: 412, percentage: 49 },
            { label: 'Wait Time', count: 210, percentage: 25 },
            { label: 'Product Selection', count: 185, percentage: 22 },
            { label: 'Atmosphere', count: 35, percentage: 4 },
        ]
    }
];

const RECENT_FEEDBACK = [
    { id: 1, user: 'Daniel P.', rating: 5, comment: 'Amazing service and very fast turnaround!', date: '2h ago' },
    { id: 2, user: 'Sarah K.', rating: 4, comment: 'Great experience, but the wait time was a bit long.', date: '5h ago' },
    { id: 3, user: 'James L.', rating: 5, comment: 'The new loyalty system is so easy to use.', date: 'Yesterday' },
    { id: 4, user: 'Michelle R.', rating: 5, comment: 'Love the atmosphere here.', date: 'Yesterday' },
];

export default function SurveyAnalyticsPage() {
    const handleExportResults = () => {
        const exportData = RECENT_FEEDBACK.map(f => ({
            User: f.user,
            Rating: f.rating,
            Comment: f.comment,
            Date: f.date
        }));
        exportToCSV(exportData, `survey_feedback_${new Date().toISOString().split('T')[0]}`);
        toast.success('Survey feedback exported');
    };

    return (
        <div className="p-4 md:p-8">
            <PageHeader
                title="Survey Analytics"
                description="Understand your customers better with real-time feedback insights"
                actions={
                    <button
                        onClick={handleExportResults}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm"
                    >
                        <Download size={18} />
                        Export Data
                    </button>
                }
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 mt-8">
                {SURVEY_STATS.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`size-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <stat.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.trend}
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black tracking-tight text-text-main">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Question Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    {QUESTION_RESULTS.map((result, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="text-lg font-black text-text-main mb-6 tracking-tight">{result.question}</h4>

                            <div className="space-y-4">
                                {result.distribution.map((item, j) => (
                                    <div key={j}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{item.label}</span>
                                            <span className="text-xs font-black text-text-main">{item.count} responses ({item.percentage}%)</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.percentage}%` }}
                                                transition={{ duration: 1, delay: 0.5 + (j * 0.1) }}
                                                className={`h-full rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-primary'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Feedback List */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-lg font-black text-text-main tracking-tight">Recent Comments</h4>
                            <Filter size={18} className="text-gray-400 cursor-pointer hover:text-primary transition-colors" />
                        </div>

                        <div className="space-y-6">
                            {RECENT_FEEDBACK.map((feedback) => (
                                <div key={feedback.id} className="group cursor-pointer">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-text-main uppercase tracking-widest">{feedback.user}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{feedback.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} className={i < feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                                        ))}
                                    </div>
                                    <p className="text-sm text-text-secondary font-medium leading-relaxed group-hover:text-text-main transition-colors">"{feedback.comment}"</p>
                                    <div className="h-px bg-gray-50 mt-6 group-last:hidden" />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => toast.error('Advanced pagination coming soon!')}
                            className="w-full mt-8 py-3 rounded-xl border border-dashed border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-50 transition-all"
                        >
                            View Full History
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
