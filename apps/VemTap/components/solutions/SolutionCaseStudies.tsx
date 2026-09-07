import React from 'react';
import Link from 'next/link';

export default function SolutionCaseStudies() {
    return (
        <section className="pb-32 bg-white">
            <div className="vemtap-container space-y-32">
                {/* Solution 1: Retail */}
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div className="inline-flex items-center gap-3 text-emerald-600 font-black text-xs uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl">
                            <span className="material-icons-round">storefront</span> Retail & Shops
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-text-main leading-tight">
                            Boost loyalty with a <br />single tap.
                        </h2>
                        <p className="text-lg text-text-secondary leading-relaxed font-medium">
                            Turn walk-ins into members instantly. Customers tap at checkout to join your loyalty program, receive digital receipts, or unlock exclusive in-store offers without filling out paper forms.
                        </p>
                        <ul className="space-y-4">
                            {[
                                'Instant Loyalty Signup',
                                'Digital Receipts via Email',
                                'Post-Purchase Feedback'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-text-main font-bold">
                                    <span className="material-icons-round text-emerald-500 text-xl">check_circle</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Link href="/get-started" className="bg-text-main text-white font-bold px-10 py-4 rounded-full hover:bg-black transition-all shadow-xl shadow-black/10 cursor-pointer text-center">
                            Get Started for Retail
                        </Link>
                    </div>
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-emerald-100 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            {/* Phone Mockup */}
                            <div className="w-[300px] h-[620px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-slate-800 transform rotate-2 group-hover:rotate-0 transition-transform duration-700">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20"></div>
                                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col font-sans">
                                    <div className="bg-emerald-50/50 p-8 pt-12 text-center">
                                        <div className="size-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                            <span className="material-icons-round text-emerald-500 text-3xl">shopping_bag</span>
                                        </div>
                                        <h4 className="font-display font-bold text-gray-900 text-xl">Fashion Co.</h4>
                                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mt-1">Loyalty Club</p>
                                    </div>
                                    <div className="p-8 space-y-6 flex-1 bg-white rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)] -mt-4">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500 font-bold mb-1">Join today and get</p>
                                            <h5 className="text-3xl font-display font-bold text-emerald-600">15% OFF</h5>
                                            <p className="text-xs text-gray-500 font-bold">your current purchase</p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 flex items-center gap-3">
                                                <span className="material-icons-round text-gray-300 text-sm">email</span>
                                                <span className="text-gray-400 text-xs font-bold truncate">Enter your email...</span>
                                            </div>
                                            <button className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200">Claim Offer</button>
                                        </div>
                                        <p className="text-[10px] text-center text-gray-400 font-bold">No spam, just style updates.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Solution 2: Gyms */}
                <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div className="inline-flex items-center gap-3 text-amber-600 font-black text-xs uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-xl">
                            <span className="material-icons-round">fitness_center</span> Gyms & Wellness
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-text-main leading-tight">
                            Streamline member <br />check-ins.
                        </h2>
                        <p className="text-lg text-text-secondary leading-relaxed font-medium">
                            Remove friction at the front desk. Members tap to check in, book classes, or sign waivers instantly. Keep your staff focused on member experience, not data entry.
                        </p>
                        <ul className="space-y-4">
                            {[
                                'Contactless Entry',
                                'Digital Liability Waivers',
                                'Class Booking Integration'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-text-main font-bold">
                                    <span className="material-icons-round text-amber-500 text-xl">check_circle</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Link href="/get-started" className="bg-text-main text-white font-bold px-10 py-4 rounded-full hover:bg-black transition-all shadow-xl shadow-black/10 cursor-pointer text-center">
                            Get Started for Wellness
                        </Link>
                    </div>
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-start">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-amber-100 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            {/* Phone Mockup */}
                            <div className="w-[300px] h-[620px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-slate-800 transform -rotate-2 group-hover:rotate-0 transition-transform duration-700">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20"></div>
                                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col font-sans">
                                    <div className="bg-text-main p-8 pt-12 text-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-amber-400/10"></div>
                                        <h4 className="font-display font-bold text-amber-400 text-2xl relative z-10">Welcome Back!</h4>
                                        <p className="text-white/60 text-xs font-bold mt-1 relative z-10">Iron Paradise Gym</p>
                                    </div>
                                    <div className="p-8 bg-white flex-1 -mt-4 rounded-t-3xl relative z-20 space-y-8">
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="size-12 rounded-full overflow-hidden bg-gray-200">
                                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" alt="User" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-text-main">Alex Morgan</p>
                                                <p className="text-[10px] text-green-500 font-black uppercase tracking-tighter">Active Member</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <button className="w-full bg-text-main text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                                <span className="material-icons-round text-base">check</span> Check In Now
                                            </button>
                                            <button className="w-full bg-white border border-gray-200 text-text-main py-4 rounded-xl font-black text-xs uppercase tracking-widest">
                                                Book Class
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Solution 3: Events */}
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div className="inline-flex items-center gap-3 text-primary font-black text-xs uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-xl">
                            <span className="material-icons-round">event</span> Events & Pop-ups
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-text-main leading-tight">
                            High-speed entry for <br />volume crowds.
                        </h2>
                        <p className="text-lg text-text-secondary leading-relaxed font-medium">
                            Process thousands of attendees seamlessly. Replace paper guest lists with lightning-fast NFC taps. Capture lead data at booths or control access to VIP areas effortlessly.
                        </p>
                        <ul className="space-y-4">
                            {[
                                'Under 1s Check-in Time',
                                'Real-time Capacity Tracking',
                                'Offline Mode Support'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-text-main font-bold">
                                    <span className="material-icons-round text-primary text-xl">check_circle</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Link href="/get-started" className="bg-primary hover:bg-primary-hover text-white font-bold px-10 py-4 rounded-full transition-all shadow-xl shadow-primary/20 cursor-pointer text-center">
                            Get Started with Events
                        </Link>
                    </div>
                    <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            {/* Phone Mockup */}
                            <div className="w-[300px] h-[620px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-slate-800 transform rotate-2 group-hover:rotate-0 transition-transform duration-700">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20"></div>
                                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col font-sans">
                                    <div className="bg-primary p-8 pt-12 pb-16 text-center text-white">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-[10px] font-black tracking-widest opacity-70">TECH SUMMIT 24</span>
                                            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase">VIP</span>
                                        </div>
                                        <h4 className="font-display font-bold text-3xl">Hello, Sarah.</h4>
                                        <p className="text-white/70 text-xs font-bold mt-1">Tap to confirm entry</p>
                                    </div>
                                    <div className="p-6 bg-white flex-1 -mt-8 mx-4 mb-4 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center border border-gray-100">
                                        <div className="size-24 rounded-full border-[6px] border-primary/5 flex items-center justify-center mb-6 relative">
                                            <span className="material-icons-round text-primary text-4xl animate-pulse">nfc</span>
                                            <div className="absolute inset-0 rounded-full border-t-[6px] border-primary animate-spin"></div>
                                        </div>
                                        <h5 className="font-bold text-text-main text-lg">Scanning...</h5>
                                        <p className="text-xs text-gray-400 font-bold mb-8">Hold device near reader</p>
                                        <div className="w-full border-t border-gray-50 pt-6 space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-gray-400 uppercase tracking-widest">Ticket ID</span>
                                                <span className="text-text-main">#8X99-22</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-gray-400 uppercase tracking-widest">Session</span>
                                                <span className="text-text-main">Keynote Hall A</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
