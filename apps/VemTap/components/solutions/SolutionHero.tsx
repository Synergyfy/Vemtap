import React from 'react';

export default function SolutionHero() {
    return (
        <section className="relative pt-48 pb-24 overflow-hidden bg-white flex flex-col items-center">
            <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
                backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                maskImage: 'linear-gradient(to right, black 20%, transparent 80%)',
                WebkitMaskImage: 'linear-gradient(to right, black 20%, transparent 80%)'
            }}></div>

            <div className="vemtap-container text-center z-10 relative">
                <span className="inline-block py-1 px-4 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">Use Cases</span>
                <h1 className="font-display font-bold text-5xl md:text-7xl leading-[1.1] text-text-main vemtap-container mb-8 tracking-tight">
                    Solutions for every <br />
                    <span className="text-gradient">physical space</span>
                </h1>
                <p className="text-lg md:text-xl text-text-secondary vemtap-container leading-relaxed font-medium">
                    From high-street retail to exclusive events, discover how VemTap transforms visitor interactions into valuable digital connections.
                </p>
            </div>
        </section>
    );
}
