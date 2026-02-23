'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/notify';
import { adminUsersApi, adminBusinessesApi, adminDevicesApi, adminSubscriptionsApi } from '@/lib/api/admin';
import { Users, Store, Cpu, TrendingUp, ArrowRight, RefreshCw, Loader2, CheckCircle, Clock, Ban } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    totalBusinesses: number;
    activeBusinesses: number;
    pendingBusinesses: number;
    suspendedBusinesses: number;
    totalUsers: number;
    recentBusinesses: any[];
    activeSubscriptions: number;
    totalDevices: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalBusinesses: 0,
        activeBusinesses: 0,
        pendingBusinesses: 0,
        suspendedBusinesses: 0,
        totalUsers: 0,
        recentBusinesses: [],
        activeSubscriptions: 0,
        totalDevices: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const [bizData, usersData, subsData, devicesData] = await Promise.all([
                adminBusinessesApi.getAll({ limit: 50 }),
                adminUsersApi.getAll({ limit: 200 }),
                adminSubscriptionsApi.getStats().catch(() => ({ data: { activeSubscriptions: 0 } })),
                adminDevicesApi.getStats().catch(() => ({ data: { total: 0 } }))
            ]);
            const businesses = Array.isArray(bizData) ? bizData : (bizData.businesses || []);
            const users = Array.isArray(usersData) ? usersData : (usersData.users || []);
            const subStats = subsData?.data || subsData;
            const devStats = devicesData?.data || devicesData;

            // Sort by most recent
            const sorted = [...businesses].sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setStats({
                totalBusinesses: businesses.length,
                activeBusinesses: businesses.filter((b: any) => b.status === 'Active').length,
                pendingBusinesses: businesses.filter((b: any) => b.status === 'Pending').length,
                suspendedBusinesses: businesses.filter((b: any) => b.status === 'Suspended').length,
                totalUsers: users.length,
                recentBusinesses: sorted.slice(0, 5),
                activeSubscriptions: subStats?.activeSubscriptions || 0,
                totalDevices: devStats?.total || devStats?.active || 0,
            });
        } catch (err: any) {
            notify.error('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    const platformStats = [
        { label: 'Total Businesses', value: stats.totalBusinesses, icon: Store, color: 'blue', link: '/admin/businesses' },
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'green', link: '/admin/users' },
        { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: TrendingUp, color: 'yellow', link: '/admin/subscriptions' },
        { label: 'Total Devices', value: stats.totalDevices, icon: Cpu, color: 'red', link: '/admin/devices' },
    ];

    const quickActions = [
        { label: 'Add Business', icon: 'add_business', href: '/admin/businesses', primary: true },
        { label: 'Create User', icon: 'person_add', href: '/admin/users', primary: false },
        { label: 'Register Device', icon: 'nfc', href: '/admin/devices', primary: false },
        { label: 'System Settings', icon: 'settings', href: '/admin/settings', primary: false },
    ];

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'Active': return { cls: 'bg-green-50 text-green-600', icon: <CheckCircle size={12} /> };
            case 'Pending': return { cls: 'bg-yellow-50 text-yellow-700', icon: <Clock size={12} /> };
            case 'Suspended': return { cls: 'bg-red-50 text-red-600', icon: <Ban size={12} /> };
            default: return { cls: 'bg-gray-100 text-gray-500', icon: null };
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-1">Platform Overview</h1>
                    <p className="text-text-secondary font-medium text-sm">Real-time system stats and management</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm text-text-secondary"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {platformStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={index}
                            href={stat.link}
                            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${stat.color === 'green' ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' :
                                    stat.color === 'yellow' ? 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white' :
                                        stat.color === 'red' ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' :
                                            'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                                    }`}>
                                    <Icon size={22} />
                                </div>
                                <ArrowRight size={14} className="text-gray-300 group-hover:text-primary transition-colors mt-1" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">{stat.label}</p>
                            {isLoading ? (
                                <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
                            ) : (
                                <p className="text-3xl font-display font-bold text-text-main">{stat.value.toLocaleString()}</p>
                            )}
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Businesses */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg font-display font-bold text-text-main">Recent Businesses</h2>
                            <p className="text-xs text-text-secondary font-medium mt-0.5">Latest registrations on the platform</p>
                        </div>
                        <Link href="/admin/businesses" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                            View All <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <Loader2 className="animate-spin mx-auto text-primary" size={28} />
                                <p className="text-text-secondary text-sm mt-3 font-medium">Loading...</p>
                            </div>
                        ) : stats.recentBusinesses.length === 0 ? (
                            <div className="p-12 text-center text-text-secondary">
                                <p className="text-sm font-medium">No businesses registered yet.</p>
                            </div>
                        ) : (
                            stats.recentBusinesses.map((biz: any) => {
                                const sc = getStatusConfig(biz.status);
                                return (
                                    <div key={biz.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="material-icons-round text-primary text-sm">store</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-text-main">{biz.name}</p>
                                                <p className="text-xs text-text-secondary font-medium">
                                                    {biz.owner ? `${biz.owner.firstName} ${biz.owner.lastName}` : biz.email} •{' '}
                                                    {new Date(biz.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${sc.cls}`}>
                                            {sc.icon}
                                            {biz.status}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-display font-bold text-text-main">Quick Actions</h2>
                    </div>
                    <div className="p-4 space-y-2">
                        {quickActions.map((action, i) => (
                            <Link
                                key={i}
                                href={action.href}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all active:scale-95 ${action.primary
                                    ? 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20'
                                    : 'bg-gray-50 text-text-main hover:bg-gray-100'
                                    }`}
                            >
                                <span className="material-icons-round">{action.icon}</span>
                                {action.label}
                            </Link>
                        ))}
                    </div>

                    {/* Live Summary */}
                    <div className="p-4 m-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">System Health</p>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Active Businesses', value: stats.activeBusinesses, color: 'text-green-600' },
                                { label: 'Awaiting Approval', value: stats.pendingBusinesses, color: 'text-yellow-600' },
                                { label: 'Suspended Businesses', value: stats.suspendedBusinesses, color: 'text-red-500' },
                                { label: 'Total Platform Users', value: stats.totalUsers, color: 'text-primary' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <p className="text-xs text-text-secondary font-medium">{item.label}</p>
                                    <p className={`text-sm font-black ${item.color}`}>{isLoading ? '—' : item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
