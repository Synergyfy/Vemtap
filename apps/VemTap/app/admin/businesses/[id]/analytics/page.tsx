import Link from 'next/link';
import { ArrowLeft, Users, Activity, Building2, Smartphone } from 'lucide-react';
import type { ComponentType } from 'react';

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ name?: string }>;
};

const hash = (value: string) => {
    let out = 0;
    for (let i = 0; i < value.length; i += 1) {
        out = (out << 5) - out + value.charCodeAt(i);
        out |= 0;
    }
    return Math.abs(out);
};

export default async function BusinessAnalyticsPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const query = await searchParams;
    const businessName = query.name || `Business ${id}`;
    const seed = hash(id);

    const totalUsers = 120 + (seed % 900);
    const activeUsers = 35 + (seed % 120);
    const totalTaps = 900 + (seed % 9000);
    const devices = 4 + (seed % 18);
    const branches = 1 + (seed % 9);

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <Link href="/admin/businesses" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                        <ArrowLeft size={16} />
                        Back to businesses
                    </Link>
                    <h1 className="text-3xl font-display font-bold text-text-main mt-2">{businessName}</h1>
                    <p className="text-sm text-text-secondary font-medium mt-1">Mock analytics snapshot for admin complaint handling.</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">Mock Data</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard title="Total Users" value={totalUsers.toLocaleString()} icon={Users} />
                <MetricCard title="Active Users (30d)" value={activeUsers.toLocaleString()} icon={Activity} />
                <MetricCard title="Total Tap Events" value={totalTaps.toLocaleString()} icon={Smartphone} />
                <MetricCard title="Branches" value={branches.toString()} icon={Building2} />
                <MetricCard title="Devices" value={devices.toString()} icon={Smartphone} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-4">Recent Activity (Mock)</h2>
                <div className="space-y-3">
                    {[
                        `+${8 + (seed % 22)} new users joined in the last 7 days`,
                        `${3 + (seed % 7)} complaint cases were resolved by support`,
                        `Peak tap hour is ${(8 + (seed % 10)).toString().padStart(2, '0')}:00`,
                    ].map((line) => (
                        <div key={line} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-text-main font-medium">
                            {line}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string; icon: ComponentType<{ size?: number; className?: string }> }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{title}</p>
                <Icon size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-display font-bold text-text-main">{value}</p>
        </div>
    );
}
