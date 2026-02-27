'use client';

import { useAuthStore } from '@/store/useAuthStore';

export default function AgentProfilePage() {
    const { user } = useAuthStore();

    return (
        <div className="p-6 md:p-10 space-y-6">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Agent Settings</p>
                <h1 className="text-3xl font-display font-bold text-text-main">Profile</h1>
                <p className="text-text-secondary text-sm font-medium">Update your agent profile details.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Full Name</label>
                        <input
                            defaultValue={user?.name || 'Support Agent'}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Email</label>
                        <input
                            defaultValue={user?.email || 'agent@vemtap.com'}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block mb-2">Phone</label>
                        <input
                            defaultValue={user?.phone || '+234 800 000 0000'}
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                        />
                    </div>
                    <button className="w-full h-12 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
