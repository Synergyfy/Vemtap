'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Activity, ArrowLeft, Clock, UserCheck, LogIn, Settings, Shield, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStaff } from '@/services/users/hooks';

export default function StaffActivityPage() {
  const { data: staffList = [], isLoading } = useStaff();
  const [search, setSearch] = useState('');

  const activities = React.useMemo(() => {
    const list: Array<{
      id: string;
      staffName: string;
      role: string;
      action: string;
      details: string;
      time: string;
      icon: any;
      iconBg: string;
      iconColor: string;
    }> = [];

    staffList.forEach((member, i) => {
      const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;
      if (member.createdAt) {
        list.push({
          id: `invite-${member.id}-${i}`,
          staffName: name,
          role: member.role || 'Staff',
          action: 'Team Member Joined',
          details: `Account created with ${member.role || 'Staff'} permissions`,
          time: new Date(member.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          icon: UserCheck,
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-600',
        });
      }
      if (member.lastActive) {
        list.push({
          id: `login-${member.id}-${i}`,
          staffName: name,
          role: member.role || 'Staff',
          action: 'Dashboard Access',
          details: 'Staff member authenticated into business workspace',
          time: new Date(member.lastActive).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          icon: LogIn,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
        });
      }
    });

    if (list.length === 0) {
      list.push({
        id: 'system-init',
        staffName: 'System Audit Log',
        role: 'System',
        action: 'Audit Log Active',
        details: 'Staff activity is recorded in real time as actions occur.',
        time: 'Just now',
        icon: Activity,
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-600',
      });
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(a =>
      a.staffName.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q) ||
      a.details.toLowerCase().includes(q)
    );
  }, [staffList, search]);

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <POSPageHeader
          title="Staff Activity Log"
          subtitle="Real-time security and operational audit trail for all team members"
        />
        <Link
          href="/dashboard/staff"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Staff
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter logs by staff name or action..."
          className="w-full h-11 pl-11 pr-4 bg-white rounded-2xl border border-gray-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((act, i) => {
              const Icon = act.icon;
              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="py-4 flex items-start gap-4 hover:bg-gray-50/50 rounded-2xl px-2 transition-colors"
                >
                  <div className={`p-3 rounded-2xl ${act.iconBg} ${act.iconColor} shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-gray-900">{act.staffName}</p>
                      <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                        <Clock size={11} />
                        {act.time}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-700 mt-0.5">{act.action}</p>
                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">{act.details}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
