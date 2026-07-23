'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Clock, Coins, FileText, Download, Printer, ChevronRight, X, ExternalLink, Sparkles, Zap } from 'lucide-react';
import { useAIStore } from '@/store/useAIStore';
import { useAICredits } from '@/services/ai/hooks';
import { useSystemSettingsStore } from '@/store/useSystemSettingsStore';
import type { AIAnalysisResponse } from '@/services/ai/types';

const naira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

function downloadReport(analysis: AIAnalysisResponse, page: string) {
    const lines: string[] = [];
    lines.push('='.repeat(50));
    lines.push(`Report - ${page}`);
    lines.push(`Generated: ${new Date(analysis.generatedAt).toLocaleString()}`);
    lines.push(`Credits Used: ${analysis.creditsUsed}`);
    lines.push('='.repeat(50));
    lines.push('');
    lines.push('SUMMARY');
    lines.push('-'.repeat(30));
    lines.push(analysis.summary);
    lines.push('');
    lines.push('INSIGHTS');
    lines.push('-'.repeat(30));
    analysis.insights.forEach((insight, i) => {
        lines.push(`${i + 1}. [${insight.severity.toUpperCase()}] ${insight.title}`);
        lines.push(`   ${insight.description}`);
        if (insight.metric) {
            lines.push(`   Metric: ${insight.metric.label} = ${insight.metric.value}`);
        }
        lines.push('');
    });
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(30));
    analysis.recommendations.forEach((rec, i) => {
        lines.push(`${i + 1}. [${rec.impact.toUpperCase()} IMPACT] ${rec.title}`);
        lines.push(`   ${rec.description}`);
        lines.push(`   Action: ${rec.actionLabel}`);
        lines.push('');
    });
    lines.push('='.repeat(50));

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.replace(/\s+/g, '-').toLowerCase()}-report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handlePrint(analysis: AIAnalysisResponse, page: string) {
    const win = window.open('', '_blank');
    if (!win) return;
    const html = `<!DOCTYPE html>
<html><head><title>${page} - AI Report</title>
<style>
  body { font-family: Inter, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #111; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #eee; padding-bottom: 4px; }
  .insight { margin: 8px 0; padding: 8px 12px; background: #f9fafb; border-radius: 8px; border-left: 3px solid #3b82f6; }
  .rec { margin: 8px 0; padding: 8px 12px; background: #f9fafb; border-radius: 8px; }
  hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: #e5e7eb; }
  @media print { body { margin: 0; padding: 20px; } }
</style></head><body>
<h1>${page} - AI Report</h1>
<p class="meta">Generated: ${new Date(analysis.generatedAt).toLocaleString()} | Credits: ${analysis.creditsUsed}</p>
<hr>
<h2>Summary</h2>
<p>${analysis.summary}</p>
<h2>Insights (${analysis.insights.length})</h2>
${analysis.insights.map(i => `<div class="insight"><strong>${i.title}</strong><br>${i.description}</div>`).join('')}
<h2>Recommendations (${analysis.recommendations.length})</h2>
${analysis.recommendations.map(r => `<div class="rec"><span class="badge">${r.impact.toUpperCase()}</span> <strong>${r.title}</strong><br>${r.description}<br><em>${r.actionLabel}</em></div>`).join('')}
</body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
}

export default function AIReportsPage() {
    const router = useRouter();
    useAICredits();
    const credits = useAIStore((state) => state.credits);
    const lastUpdated = useAIStore((state) => state.lastUpdated);
    const activeAnalysis = useAIStore((state) => state.activeAnalysis);
    const settings = useSystemSettingsStore();
    const [selectedReport, setSelectedReport] = useState<{ page: string; analysis: AIAnalysisResponse } | null>(null);

    const isUnlimited = credits.limit === -1;
    const activePackages = settings.aiCreditPackages.filter(p => p.isActive);

    const reports = Object.entries(activeAnalysis)
        .filter(([_, analysis]) => analysis && lastUpdated[Object.keys(activeAnalysis).find(k => activeAnalysis[k] === analysis) || ''])
        .map(([page, analysis]) => ({
            page,
            analysis,
            generatedAt: lastUpdated[page] || analysis.generatedAt,
        }))
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <main className="p-6 max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Database size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">AI Report Bank</h1>
                        <p className="text-sm text-gray-500">All your saved AI-generated reports in one place</p>
                    </div>
                </div>

                {/* AI Credits Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Coins size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Credits</p>
                            <p className="text-xl font-black text-gray-900">
                                {isUnlimited ? 'Unlimited' : credits.available}
                            </p>
                            <p className="text-xs text-gray-400">
                                {isUnlimited ? 'Unlimited on your plan' : `${credits.used} of ${credits.limit} used`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/settings/subscription')}
                        className="h-11 px-5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Zap size={15} />
                        Buy Credits
                    </button>
                </div>

                {reports.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <div className="size-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                            <Database size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No reports yet</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                            Run an AI analysis on any dashboard page to see your reports here.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="h-12 px-6 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-all active:scale-95"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map(({ page, analysis, generatedAt }) => (
                            <div
                                key={page + generatedAt}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => setSelectedReport({ page, analysis })}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                                            <Sparkles size={18} className="text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 capitalize truncate">{page.replace(/-/g, ' ')}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock size={11} />
                                                    {new Date(generatedAt).toLocaleString()}
                                                </span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Coins size={11} />
                                                    {analysis.creditsUsed} credit{analysis.creditsUsed !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Report Detail Modal */}
                {selectedReport && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <Sparkles size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 capitalize">{selectedReport.page.replace(/-/g, ' ')}</h3>
                                        <p className="text-xs text-gray-400">{new Date(selectedReport.analysis.generatedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => downloadReport(selectedReport.analysis, selectedReport.page)}
                                        className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        onClick={() => handlePrint(selectedReport.analysis, selectedReport.page)}
                                        className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Print"
                                    >
                                        <Printer size={16} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(selectedReport.analysis.generatedAt).toLocaleString()}</span>
                                    <span className="flex items-center gap-1"><Coins size={12} /> {selectedReport.analysis.creditsUsed} credit{selectedReport.analysis.creditsUsed !== 1 ? 's' : ''}</span>
                                </div>

                                {selectedReport.analysis.summary && (
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100/50">
                                        <p className="text-sm text-gray-700 leading-relaxed font-medium">{selectedReport.analysis.summary}</p>
                                    </div>
                                )}

                                {selectedReport.analysis.insights.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Insights ({selectedReport.analysis.insights.length})</h4>
                                        <div className="space-y-2">
                                            {selectedReport.analysis.insights.map((insight) => (
                                                <div key={insight.id} className="bg-white rounded-xl p-4 border border-gray-100 border-l-4 border-l-blue-500">
                                                    <h5 className="text-sm font-bold text-gray-900">{insight.title}</h5>
                                                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedReport.analysis.recommendations.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Recommendations ({selectedReport.analysis.recommendations.length})</h4>
                                        <div className="space-y-2">
                                            {selectedReport.analysis.recommendations.map((rec) => (
                                                <div key={rec.id} className="bg-white rounded-xl p-4 border border-gray-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                            rec.impact === 'high' ? 'bg-emerald-50 text-emerald-700' :
                                                            rec.impact === 'medium' ? 'bg-amber-50 text-amber-700' :
                                                            'bg-gray-50 text-gray-600'
                                                        }`}>{rec.impact} impact</span>
                                                    </div>
                                                    <h5 className="text-sm font-bold text-gray-900">{rec.title}</h5>
                                                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                                                    <p className="text-xs font-semibold text-blue-600 mt-2">{rec.actionLabel}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedReport.analysis.quickActions.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Quick Actions ({selectedReport.analysis.quickActions.length})</h4>
                                        <div className="space-y-2">
                                            {selectedReport.analysis.quickActions.map((qa) => (
                                                <div key={qa.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <FileText size={16} className="text-gray-400" />
                                                    <span className="text-sm font-semibold text-gray-700">{qa.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={() => downloadReport(selectedReport.analysis, selectedReport.page)}
                                        className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={15} /> Download Report
                                    </button>
                                    <button
                                        onClick={() => handlePrint(selectedReport.analysis, selectedReport.page)}
                                        className="flex-1 h-11 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Printer size={15} /> Print
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
