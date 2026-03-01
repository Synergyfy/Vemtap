import React from 'react';
import Link from 'next/link';
import Script from 'next/script';

interface VisitorLayoutProps {
    children: React.ReactNode;
    onReset?: () => void;
    onCredentialResponse?: (response: any) => void;
}

export const VisitorLayout: React.FC<VisitorLayoutProps> = ({ children, onReset, onCredentialResponse }) => {
    return (
        <div className="min-h-screen bg-[#fafbfc] font-body flex flex-col items-center py-20 px-6 antialiased">
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

            <nav className="fixed top-0 left-0 right-0 z-60 px-10 py-8 flex items-center justify-between pointer-events-none">
                <Link href="/" className="flex items-center gap-2 group pointer-events-auto active:scale-95 transition-all">
                    <div className="size-8 rounded-full bg-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
                        <img src="/VEMTAP_PNG.png" alt="VemTap" className="w-5 h-5 object-contain" />
                    </div>
                    <span className="font-display font-black text-xl tracking-tighter text-slate-900">VemTap</span>
                </Link>

                <div className="flex items-center gap-4 pointer-events-auto">
                    <button onClick={onReset} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
                        Restart
                    </button>
                    <div className="size-8 rounded-full border-2 border-gray-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-gray-300">help</span>
                    </div>
                </div>
            </nav>

            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] size-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] -right-[10%] size-[40%] rounded-full bg-indigo-500/5 blur-[100px]" />
                <div className="absolute -bottom-[10%] left-[20%] size-[50%] rounded-full bg-blue-400/5 blur-[120px] animate-pulse" />
            </div>

            <main className="grow flex items-center justify-center w-full max-w-2xl relative">
                {children}
            </main>

            <footer className="mt-12 flex flex-col items-center gap-3 opacity-20 pointer-events-none grayscale saturate-0">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-900">Transaction Verified</span>
                </div>
            </footer>

            <style jsx>{`
                .font-display { font-family: var(--font-outfit), sans-serif; }
            `}</style>
        </div>
    );
};
