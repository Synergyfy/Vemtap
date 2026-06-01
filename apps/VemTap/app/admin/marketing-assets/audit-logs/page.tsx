"use client";

import React, { useState } from 'react';
import { useAuditLogs } from '@/services/marketing-assets/hooks';
import { ClipboardList, Search } from 'lucide-react';


const ACTION_COLORS: Record<string, string> = {
  ASSET_CREATED: 'text-green-600 bg-green-50 border-green-200',
  ASSET_UPDATED: 'text-blue-600 bg-blue-50 border-blue-200',
  ASSET_DELETED: 'text-rose-600 bg-rose-50 border-rose-200',
  ASSET_DOWNLOADED: 'text-purple-600 bg-purple-50 border-purple-200',
  TEMPLATE_CREATED: 'text-green-600 bg-green-50 border-green-200',
  TEMPLATE_UPDATED: 'text-blue-600 bg-blue-50 border-blue-200',
  TEMPLATE_DELETED: 'text-rose-600 bg-rose-50 border-rose-200',
  BRAND_OVERRIDE_SAVED: 'text-amber-600 bg-amber-50 border-amber-200',
};

export default function AdminAuditLogsPage() {
  const [filters, setFilters] = useState<{ entityType?: string; action?: string }>({});
  const { data, isLoading } = useAuditLogs({ ...filters, limit: 100 });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="text-primary size-5" />
            Audit Logs
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={filters.entityType || ''}
              onChange={(e) => setFilters(f => ({ ...f, entityType: e.target.value || undefined }))}
              className="px-3 py-1.5 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-500"
            >
              <option value="">All Types</option>
              <option value="MarketingAsset">Asset</option>
              <option value="MarketingTemplate">Template</option>
              <option value="MarketingBrandOverride">Brand Override</option>
              <option value="MarketingDownload">Download</option>
            </select>
            <select
              value={filters.action || ''}
              onChange={(e) => setFilters(f => ({ ...f, action: e.target.value || undefined }))}
              className="px-3 py-1.5 text-xs border border-gray-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-gray-500"
            >
              <option value="">All Actions</option>
              <option value="ASSET_CREATED">Created</option>
              <option value="ASSET_UPDATED">Updated</option>
              <option value="ASSET_DELETED">Deleted</option>
              <option value="ASSET_DOWNLOADED">Downloaded</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex size-14 bg-gray-50 text-gray-400 rounded-full items-center justify-center">
              <ClipboardList size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900">No audit logs yet</h4>
              <p className="text-xs text-gray-500">Actions will appear here as users interact with marketing assets.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-extrabold uppercase text-gray-400">
                  <th className="pb-3 pl-2">Time</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Entity</th>
                  <th className="pb-3">Entity ID</th>
                  <th className="pb-3">Business ID</th>
                  <th className="pb-3">User ID</th>
                  <th className="pb-3 pr-2">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-semibold text-gray-700">
                {data.logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pl-2 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${ACTION_COLORS[log.action] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-gray-500">{log.entityType.replace('Marketing', '')}</td>
                    <td className="py-3 font-mono text-[10px] text-gray-400">{log.entityId.substring(0, 8)}...</td>
                    <td className="py-3 font-mono text-[10px] text-gray-400">{log.businessId.substring(0, 8)}...</td>
                    <td className="py-3 font-mono text-[10px] text-gray-400">{log.userId.substring(0, 8)}...</td>
                    <td className="py-3 pr-2 font-mono text-[10px] text-gray-400">{log.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-xs text-gray-400 font-bold text-right">
              Showing {data.logs.length} of {data.total} total entries
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
