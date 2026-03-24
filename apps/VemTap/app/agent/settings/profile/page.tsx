'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMutation } from '@tanstack/react-query';
import { agentApi } from '@/lib/api/agent';
import { notify } from '@/lib/notify';
import { Loader2 } from 'lucide-react';

export default function AgentProfilePage() {
    const { user, updateUser } = useAuthStore();
    
    // Split name provided as "First Last"
    const fullName = user?.name || '';
    const [firstName, setFirstName] = useState(fullName.split(' ')[0] || '');
    const [lastName, setLastName] = useState(fullName.split(' ').slice(1).join(' ') || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => agentApi.updateProfile(data),
        onSuccess: () => {
            updateUser({
                name: `${firstName} ${lastName}`,
                email,
                phone,
            });
            notify.success('Profile updated successfully');
        },
        onError: () => notify.error('Failed to update profile'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({
            firstName,
            lastName,
            email,
            phone,
        });
    };

    return (
        <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Agent Settings</p>
                <h1 className="text-3xl font-display font-bold text-text-main">Your Profile</h1>
                <p className="text-text-secondary text-sm font-medium">Manage your professional information and contact details.</p>
            </div>

            <div className="max-w-2xl bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block">First Name</label>
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Your first name"
                                className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-gray-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block">Last Name</label>
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Your last name"
                                className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="agent@vemtap.com"
                            className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-gray-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 block">Phone Number</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+234 800 000 0000"
                            className="w-full h-12 px-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all placeholder:text-gray-300"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:bg-primary-hover hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {updateProfileMutation.isPending ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            'Apply Changes'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
