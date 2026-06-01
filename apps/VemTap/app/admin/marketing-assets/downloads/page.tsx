"use client";

import React, { useState, useMemo } from 'react';
import { useDownloadsLog } from '@/services/marketing-assets/hooks';
import { Download, FileText, Calendar, Layers, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const FORMAT_OPTIONS = ['All', 'png', 'pdf', 'transparent_png', 'print_pdf'];
const DATE_PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'This Year', value: 'year' },
];
const PAGE_SIZE = 15;

export default function AdminDownloadsPage() {
  const { data: logs, isLoading } = useDownloadsLog();

  const [formatFilter, setFormatFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      const matchFormat = formatFilter === 'All' || log.format === formatFilter;
      const matchSearch = !search || log.asset?.name?.toLowerCase().includes(search.toLowerCase());
      let matchDate = true;
      if (dateFilter !== 'all') {
        const d = new Date(log.downloadedAt);
        const now = new Date();
        if (dateFilter === 'today') matchDate = d.toDateString() === now.toDateString();
        else if (dateFilter === '7d') matchDate = d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (dateFilter === '30d') matchDate = d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        else if (dateFilter === 'year') matchDate = d.getFullYear() === now.getFullYear();
      }
      return matchFormat && matchSearch && matchDate;
    });
  }, [logs, formatFilter, dateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedLogs = filteredLogs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (logs || []).forEach((l) => { counts[l.format] = (counts[l.format] || 0) + 1; });
    return counts;
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="text-primary size-5" />
          Platform Download History
        </h3>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
            <Filter size={14} className="text-gray-400 ml-1.5" />
            {DATE_PRESETS.map((p) => (
              <button key={p.value} onClick={() => { setDateFilter(p.value); setPage(0); }}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  dateFilter === p.value ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}>{p.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {FORMAT_OPTIONS.map((fmt) => (
              <button key={fmt} onClick={() => { setFormatFilter(fmt); setPage(0); }}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  formatFilter === fmt ? 'bg-primary text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:text-gray-800'
                }`}>{fmt === 'transparent_png' ? 'PNG (T)' : fmt === 'print_pdf' ? 'PDF (P)' : fmt}</button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search assets..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white font-medium text-gray-800" />
          </div>
        </div>

        {/* Format summary */}
        {Object.keys(formatCounts).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 text-[10px] font-bold text-gray-500">
            {Object.entries(formatCounts).map(([fmt, count]) => (
              <span key={fmt} className="bg-gray-50 px-2 py-1 rounded-lg">{fmt.replace(/_/g, ' ')}: {count}</span>
            ))}
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg">Total: {logs?.length || 0}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center"><Layers size={24} /></div>
            <h4 className="font-bold text-gray-900">No downloads available yet.</h4>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400">
                    <th className="pb-3 pl-2">Asset Name</th>
                    <th className="pb-3">Output Format</th>
                    <th className="pb-3">Downloaded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pl-2 font-bold text-gray-900 text-sm">{log.asset?.name || 'Deleted Asset'}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 uppercase">
                          <FileText size={11} />{log.format.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">
                        <div className="flex items-center gap-1.5"><Calendar size={12} />{new Date(log.downloadedAt).toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 font-medium">Showing {safePage * PAGE_SIZE + 1}-{Math.min((safePage + 1) * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(safePage - 1)} disabled={safePage === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={16} className="text-gray-500" /></button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className={`size-7 rounded-lg text-[11px] font-bold transition-all ${
                      safePage === i ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'
                    }`}>{i + 1}</button>
                ))}
                <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} className="text-gray-500" /></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}