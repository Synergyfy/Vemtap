import React from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';

export default function Footer() {
    return (
        <footer className="bg-white text-text-main py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="mb-8 block w-fit">
                            <Logo className="flex items-center h-14" iconSize={72} />
                        </Link>
                        <p className="text-text-secondary max-w-sm mb-10 font-bold leading-relaxed">
                            The easiest way to collect customer data instantly from your shop or event to your phone.
                        </p>

                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-8 font-display">Product</h4>
                        <ul className="space-y-4 text-text-secondary font-bold text-sm">
                            <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-8 font-display">Legal</h4>
                        <ul className="space-y-4 text-text-secondary font-bold text-sm">
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-8 font-display">Social</h4>
                        <div className="flex gap-4">
                            <Link href="https://facebook.com/vemtap" className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all">
                                <span className="material-icons-round">facebook</span>
                            </Link>
                            <Link href="https://instagram.com/vemtapng" className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all">
                                <span className="material-icons-round">camera_alt</span>
                            </Link>
                            <Link href="https://linkedin.com/company/vemtap" className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all">
                                <span className="material-icons-round">business</span>
                            </Link>
                            <Link href="https://x.com/vemtap" className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all">
                                <span className="material-icons-round">X</span>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <p>© {new Date().getFullYear()} VemTap Inc. All rights reserved.</p>
                    <div className="flex gap-8 mt-6 md:mt-0 flex-wrap justify-center">
                        <Link href="/privacy" className="hover:text-text-main transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-text-main transition-colors">Terms of Service</Link>
                        <Link href="/cookie-policy" className="hover:text-text-main transition-colors">Cookie Policy</Link>
                        <Link href="/dpa" className="hover:text-text-main transition-colors">DPA</Link>
                        <Link href="/trust" className="hover:text-text-main transition-colors">Trust & Security</Link>
                        <Link href="/status" className="hover:text-text-main transition-colors">Status</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
