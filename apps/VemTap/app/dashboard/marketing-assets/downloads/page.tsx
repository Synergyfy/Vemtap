"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDownloadsLog } from '@/services/marketing-assets/hooks';
import { Download, FileText, Calendar, Layers, ExternalLink, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const FORMAT_OPTIONS = ['All', 'png', 'pdf', 'transparent_png', 'print_pdf'];

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-green-50 text-green-700' },
  processing: { label: 'Processing', className: 'bg-amber-50 text-amber-700' },
  failed: { label: 'Failed', className: 'bg-rose-50 text-rose-700' },
};

function getSyntheticStatus(log: any): 'ready' | 'processing' | 'failed' {
  if (log.asset) return 'ready';
  if (!log.asset) return 'failed';
  return 'ready';
}

export default function DownloadsLogPage() {
  const { data: logs, isLoading } = useDownloadsLog();

  const [formatFilter, setFormatFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');

  const datePresets = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'This Year', value: 'year' },
  ];

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      const matchFormat = formatFilter === 'All' || log.format === formatFilter;
      const matchSearch = !search || log.asset?.name?.toLowerCase().includes(search.toLowerCase());
      let matchDate = true;
      if (dateFilter !== 'all') {
        const d = new Date(log.downloadedAt);
        const now = new Date();
        if (dateFilter === 'today') {
          matchDate = d.toDateString() === now.toDateString();
        } else if (dateFilter === '7d') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchDate = d >= weekAgo;
        } else if (dateFilter === '30d') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchDate = d >= monthAgo;
        } else if (dateFilter === 'year') {
          matchDate = d.getFullYear() === now.getFullYear();
        }
      }
      return matchFormat && matchSearch && matchDate;
    });
  }, [logs, formatFilter, dateFilter, search]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="text-primary size-5" />
          Print Output Logs
        </h3>

        {/* §130: Filters — Date, Format, Search */}
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl">
            <Filter size={14} className="text-gray-400 ml-2" />
            {datePresets.map((p) => (
              <button
                key={p.value}
                onClick={() => setDateFilter(p.value)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  dateFilter === p.value ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {FORMAT_OPTIONS.map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormatFilter(fmt)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  formatFilter === fmt ? 'bg-primary text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:text-gray-800'
                }`}
              >
                {fmt === 'transparent_png' ? 'PNG (Transparent)' : fmt === 'print_pdf' ? 'PDF (Print)' : fmt}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white font-medium text-gray-800"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
              <Layers size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900">No downloads available yet.</h4>
              <p className="text-xs text-gray-400">Generate and download assets to see them here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">Asset Name</th>
                  <th className="pb-3">Output Format</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Downloaded At</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {filteredLogs.map((log) => {
                  const status = getSyntheticStatus(log);
                  const badge = STATUS_BADGES[status];
                  return (
                    <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-gray-900 text-sm">
                        {log.asset?.name || 'Deleted Asset'}
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 uppercase">
                          <FileText size={11} />
                          {log.format.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-gray-400" />
                          {new Date(log.downloadedAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        {log.asset && (
                          <Link href={`/dashboard/marketing-assets/create?templateId=${log.asset.templateId}&id=${log.assetId}`}>
                            <Button variant="ghost" className="text-primary hover:text-primary/90 font-bold text-[10px] gap-1 hover:bg-primary/5 rounded-xl h-8">
                              Re-download
                              <ExternalLink size={11} />
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[10px] text-gray-400 font-medium mt-4 text-center">
              Showing {filteredLogs.length} of {logs?.length || 0} downloads
            </p>
          </div>
        )}
      </div>
    </div>
  );
}