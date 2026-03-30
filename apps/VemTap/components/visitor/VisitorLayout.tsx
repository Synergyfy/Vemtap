import React from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { buildBrandCssVars } from '@/lib/brandColor';

interface VisitorLayoutProps {
    children: React.ReactNode;
    onReset?: () => void;
    onCredentialResponse?: (response: any) => void;
    brandColor?: string | null;
}

export const VisitorLayout: React.FC<VisitorLayoutProps> = ({ children, onReset, onCredentialResponse, brandColor }) => {
    const brandVars = buildBrandCssVars(brandColor || undefined);
    return (
        <div style={brandVars} className="min-h-screen bg-[#fafbfc] font-body flex flex-col items-center pt-2 pb-12 px-5 antialiased">
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => {
                    if ((window as any).google && onCredentialResponse) {
                        (window as any).google.accounts.id.initialize({
                            client_id: "721458892695-placeholder.apps.googleusercontent.com",
                            callback: onCredentialResponse,
                            auto_select: true
                        });
                    }
                }}
            />


            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] size-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] -right-[10%] size-[40%] rounded-full bg-indigo-500/5 blur-[100px]" />
                <div className="absolute -bottom-[10%] left-[20%] size-[50%] rounded-full bg-blue-400/5 blur-[120px] animate-pulse" />
            </div>

            <main className="grow flex flex-col items-center w-full max-w-4xl relative">
                {children}
            </main>

            <footer className="mt-12 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 opacity-10 grayscale saturate-0 pointer-events-none">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-900">Transaction Verified</span>
                </div>
                
                <div className="flex items-center gap-2 opacity-40">
                    <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        <img src="/VEMTAP_PNG.png" alt="VemTap" className="w-3 h-3 object-contain opacity-50" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Powered by VemTap</span>
                </div>
            </footer>

            <style jsx>{`
                .font-display { font-family: var(--font-outfit), sans-serif; }
            `}</style>
        </div>
    );
};
