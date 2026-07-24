'use client';

import React from 'react';
import Link from 'next/link';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Shield, Check, Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const PERMISSION_MODULES = [
  { id: 'dashboard', name: 'Dashboard', desc: 'View revenue & business analytics' },
  { id: 'pos', name: 'Sales & POS', desc: 'Process transactions & register open/close' },
  { id: 'inventory', name: 'Products & Stock', desc: 'Manage catalogue, stock counts & pricing' },
  { id: 'visitors', name: 'Customers & CRM', desc: 'Access visitor history & loyalty profiles' },
  { id: 'messages', name: 'Messaging & Broadcasts', desc: 'Send SMS/WhatsApp campaigns & live chat' },
  { id: 'analytics', name: 'Advanced Analytics', desc: 'Footfall, peak times & sales reports' },
  { id: 'staff', name: 'Staff Management', desc: 'Invite staff, manage roles & view logs' },
  { id: 'settings', name: 'Business Settings', desc: 'Edit location details & subscription' },
];

const ROLES_MATRIX = [
  {
    role: 'Owner',
    desc: 'Full administrative control over all business settings, staff, and billing.',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    permissions: ['dashboard', 'pos', 'inventory', 'visitors', 'messages', 'analytics', 'staff', 'settings'],
  },
  {
    role: 'Manager',
    desc: 'Operational management across POS, stock, customers, and staff performance.',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    permissions: ['dashboard', 'pos', 'inventory', 'visitors', 'messages', 'analytics', 'staff'],
  },
  {
    role: 'Staff / Cashier',
    desc: 'Day-to-day point of sale processing, order taking, and customer check-ins.',
    badge: 'bg-green-100 text-green-800 border-green-200',
    permissions: ['pos', 'inventory', 'visitors'],
  },
];

export default function StaffRolesPage() {
  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <POSPageHeader
          title="Staff Roles & Permissions"
          subtitle="Configure default access control levels across your business modules"
        />
        <Link
          href="/dashboard/staff"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Staff
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ROLES_MATRIX.map((r, i) => (
          <motion.div
            key={r.role}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Shield size={18} className="text-primary" />
                  {r.role}
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${r.badge}`}>
                  {r.permissions.length} modules
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{r.desc}</p>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Included Access</p>
              <div className="space-y-1.5">
                {PERMISSION_MODULES.map((mod) => {
                  const hasAccess = r.permissions.includes(mod.id);
                  return (
                    <div key={mod.id} className="flex items-center justify-between text-xs py-1">
                      <span className={hasAccess ? 'font-bold text-gray-800' : 'text-gray-400'}>
                        {mod.name}
                      </span>
                      {hasAccess ? (
                        <Check size={14} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Lock size={12} className="text-gray-300 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
