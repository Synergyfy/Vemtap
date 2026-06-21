'use client';

import React, { useState } from 'react';
import { 
    Home, Compass, Clock, Wallet, User, 
    MapPin, Star, Bookmark, Navigation, 
    Tag, Percent, ChevronRight, Settings, Bell, Shield,
    Store, Ticket, Map, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type TabId = 'home' | 'explore' | 'visits' | 'wallet' | 'profile';

export default function CustomerApp() {
    const [activeTab, setActiveTab] = useState<TabId>('home');

    return (
        <div className="bg-gray-50 min-h-screen flex justify-center pb-20">
            {/* Mobile App Container */}
            <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden font-sans">
                
                {/* Content Area */}
                <div className="h-full overflow-y-auto pb-24">
                    {activeTab === 'home' && <HomeTab />}
                    {activeTab === 'explore' && <ExploreTab />}
                    {activeTab === 'visits' && <VisitsTab />}
                    {activeTab === 'wallet' && <WalletTab />}
                    {activeTab === 'profile' && <ProfileTab />}
                </div>

                {/* Bottom Navigation */}
                <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 pb-8 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    {[
                        { id: 'home', icon: Home, label: 'Home' },
                        { id: 'explore', icon: Compass, label: 'Explore' },
                        { id: 'visits', icon: Clock, label: 'Visits' },
                        { id: 'wallet', icon: Wallet, label: 'Wallet' },
                        { id: 'profile', icon: User, label: 'Profile' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabId)}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all",
                                activeTab === tab.id ? "text-primary" : "text-gray-400 hover:text-gray-800"
                            )}
                        >
                            <tab.icon size={24} className={cn(activeTab === tab.id ? "fill-primary/20" : "")} />
                            <span className="text-[10px] font-bold">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// TABS
// ==========================================

function HomeTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 pt-12 pb-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-b-[2.5rem]">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="text-white/80 font-medium text-sm">Good morning,</div>
                        <h1 className="text-2xl font-semibold">Sarah Jenkins</h1>
                    </div>
                    <div className="size-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <MapPin size={20} />
                    </div>
                </div>
                
                <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/20 flex items-center gap-4">
                    <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-primary font-semibold text-xl">
                        ₦
                    </div>
                    <div>
                        <div className="text-white/80 text-xs font-bold uppercase tracking-wider">Total Savings</div>
                        <div className="text-xl font-semibold">₦45,200</div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8 mt-2">
                {/* Nearby Offers */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Nearby Offers</h2>
                        <button className="text-sm font-bold text-primary">See All</button>
                    </div>
                    
                    <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4 -mx-6 px-6">
                        {[
                            { title: '15% Lunch Discount', biz: 'Downtown Cafe', dist: '0.2 miles', exp: 'Expires Today', img: 'bg-orange-100', color: 'text-orange-600' },
                            { title: 'Free Pastry', biz: 'VemTap Bakery', dist: '0.5 miles', exp: 'Expires in 2 days', img: 'bg-emerald-100', color: 'text-emerald-600' }
                        ].map((offer, i) => (
                            <div key={i} className="min-w-[260px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                                <div className={cn("h-32 flex items-center justify-center", offer.img, offer.color)}>
                                    <Tag size={40} />
                                </div>
                                <div className="p-5">
                                    <h3 className="font-semibold text-gray-800 text-lg mb-1">{offer.title}</h3>
                                    <div className="text-sm font-bold text-gray-500 mb-4">{offer.biz}</div>
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-4">
                                        <div className="flex items-center gap-1"><MapPin size={12} /> {offer.dist}</div>
                                        <div className="flex items-center gap-1"><Clock size={12} /> {offer.exp}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button className="flex-1 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800">View</Button>
                                        <Button variant="outline" className="rounded-xl px-3 border-gray-200 text-gray-600 hover:bg-gray-50"><Bookmark size={18} /></Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommended Businesses */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended for You</h2>
                    <div className="space-y-4">
                        {[
                            { name: 'ABC Fashion Store', cat: 'Retail', rating: '4.8', dist: '1.2 miles' },
                            { name: 'FitLife Gym', cat: 'Fitness', rating: '4.9', dist: '0.8 miles' },
                            { name: 'Glow Beauty Salon', cat: 'Service', rating: '4.7', dist: '2.1 miles' }
                        ].map((biz, i) => (
                            <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="size-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                                    <Store size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{biz.name}</h3>
                                    <div className="text-xs font-bold text-gray-400 mb-1">{biz.cat}</div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                                        <span className="flex items-center gap-1 text-amber-500"><Star size={12} className="fill-amber-500" /> {biz.rating}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {biz.dist}</span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ExploreTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
            <div className="p-6 pt-12 bg-white pb-4 sticky top-0 z-10">
                <h1 className="text-2xl font-semibold text-gray-800 mb-4">Explore</h1>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search nearby businesses or offers..." 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                
                <div className="flex overflow-x-auto no-scrollbar gap-2 mt-4 pb-2">
                    {['All', 'Restaurants', 'Retail', 'Services', 'Fitness'].map((cat, i) => (
                        <button key={i} className={cn("px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap", i === 0 ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600")}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 bg-gray-100 relative min-h-[400px]">
                {/* Simulated Map Area */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] bg-blue-50 opacity-50"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="size-16 bg-white rounded-full shadow-lg flex items-center justify-center text-primary mb-4 animate-bounce">
                        <MapPin size={32} className="fill-primary/20" />
                    </div>
                    <Button className="rounded-full shadow-lg font-bold px-6 bg-white text-gray-800 hover:bg-gray-50">
                        <Map size={18} className="mr-2" /> Open Map View
                    </Button>
                </div>
            </div>
        </div>
    );
}

function VisitsTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 pt-12">
            <h1 className="text-2xl font-semibold text-gray-800 mb-8">My Visits</h1>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                        <Store size={20} />
                    </div>
                    <div className="text-2xl font-semibold text-gray-800 mb-1">24</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Places Visited</div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="size-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                        <Ticket size={20} />
                    </div>
                    <div className="text-2xl font-semibold text-gray-800 mb-1">12</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Offers Redeemed</div>
                </div>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {[
                    { biz: 'Downtown Cafe', date: 'Today, 2:30 PM', offer: 'Free Coffee with Pastry', savings: '₦1,500' },
                    { biz: 'ABC Fashion Store', date: 'Yesterday', offer: '10% Storewide Discount', savings: '₦4,200' },
                    { biz: 'FitLife Gym', date: 'Oct 15, 2023', offer: 'Free Day Pass', savings: '₦5,000' }
                ].map((visit, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-50 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <Store size={16} />
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-3xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-gray-800 text-sm">{visit.biz}</h3>
                                <time className="text-[10px] font-bold text-gray-400">{visit.date}</time>
                            </div>
                            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block mb-2">
                                {visit.offer}
                            </div>
                            <div className="text-[10px] font-semibold text-gray-500 uppercase">Saved: <span className="text-gray-800">{visit.savings}</span></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function WalletTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 pt-12">
            <h1 className="text-2xl font-semibold text-gray-800 mb-8">My Wallet</h1>

            <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl mb-8 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 size-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Total Savings Balance</div>
                <div className="text-4xl font-semibold mb-6">₦45,200</div>
                <div className="flex gap-4">
                    <Button className="bg-white text-gray-800 hover:bg-gray-100 rounded-full font-bold px-6">View History</Button>
                </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-4">Active Coupons</h2>
            <div className="space-y-4">
                {[
                    { title: '20% Off Dinner', biz: 'Urban Burger', exp: 'Expires Today' },
                    { title: 'Buy 1 Get 1 Free', biz: 'Smoothie King', exp: 'Expires in 3 days' }
                ].map((coupon, i) => (
                    <div key={i} className="flex bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="w-24 bg-primary flex flex-col items-center justify-center text-white p-4 border-r-2 border-dashed border-white/20">
                            <Percent size={24} className="mb-1" />
                            <span className="text-[10px] font-semibold uppercase text-center leading-tight">Discount<br/>Coupon</span>
                        </div>
                        <div className="p-4 flex-1">
                            <h3 className="font-semibold text-gray-800">{coupon.title}</h3>
                            <div className="text-sm font-bold text-gray-500 mb-2">{coupon.biz}</div>
                            <div className="text-xs font-bold text-orange-500 flex items-center gap-1">
                                <Clock size={12} /> {coupon.exp}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProfileTab() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 pt-12">
            <h1 className="text-2xl font-semibold text-gray-800 mb-8">Profile</h1>

            <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-8">
                <div className="size-16 bg-blue-100 text-primary rounded-full flex items-center justify-center font-semibold text-2xl">
                    SJ
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800 text-lg">Sarah Jenkins</h2>
                    <div className="text-sm font-bold text-gray-500">sarah.j@example.com</div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider ml-2">Account Settings</h3>
                
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600"><User size={18} /></div>
                            <span className="font-bold text-gray-900">Personal Information</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600"><Bell size={18} /></div>
                            <span className="font-bold text-gray-900">Notifications</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600"><Shield size={18} /></div>
                            <span className="font-bold text-gray-900">Privacy & Security</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600"><Settings size={18} /></div>
                            <span className="font-bold text-gray-900">App Preferences</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                    </button>
                </div>
            </div>
            
            <div className="mt-8 text-center">
                <Button variant="ghost" className="text-red-500 font-bold hover:bg-red-50 rounded-full px-8">Sign Out</Button>
            </div>
        </div>
    );
}
