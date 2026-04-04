import React from 'react';
import { Zap, QrCode, CheckCircle2, Lightbulb, Focus, Nfc } from 'lucide-react';

export default function SpeedComparison() {
    return (
        <section className="py-12 md:py-16 bg-white overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
                    <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase mb-4 block">Speed Comparison</span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-text-main leading-tight mb-6">
                        Built for speed and reliability
                    </h2>
                    <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto font-medium">
                        Eliminate the friction of QR codes. No need for camera focus, lighting adjustments, or finding the right app.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 max-w-7xl mx-auto">

                    {/* Left Column: Visual Card */}
                    <div className="flex-1 w-full max-w-xl relative">
                        {/* Abstract background blobs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-linear-to-tr from-primary/10 to-blue-200/20 rounded-full blur-[80px] -z-10"></div>

                        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] font-black text-9xl select-none leading-none -mr-4 -mt-4 group-hover:opacity-10 transition-opacity">4x</div>

                            <div className="space-y-10 relative z-10">
                                <div className="space-y-2 text-left">
                                    <h3 className="text-3xl md:text-4xl font-display font-bold text-text-main leading-tight">
                                        <span className="text-primary">4x Faster</span> <br className="sm:hidden" /> than QR
                                    </h3>
                                    <p className="text-text-secondary text-xs uppercase tracking-widest font-bold opacity-60">Real-world performance test</p>
                                </div>

                                <div className="space-y-8">
                                    {/* NFC Bar */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm font-bold text-text-main">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                    <Nfc size={18} />
                                                </div>
                                                <span>NFC Tap</span>
                                            </div>
                                            <span className="text-primary bg-primary/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">~2s (Instant)</span>
                                        </div>
                                        <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1">
                                            <div className="h-full bg-primary w-[95%] rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] animate-pulse"></div>
                                        </div>
                                    </div>

                                    {/* QR Bar */}
                                    <div className="space-y-4 opacity-50">
                                        <div className="flex justify-between items-center text-sm font-bold text-text-main">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
                                                    <QrCode size={18} />
                                                </div>
                                                <span>QR Scan</span>
                                            </div>
                                            <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">~8s+ (Slow)</span>
                                        </div>
                                        <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-1">
                                            <div className="h-full bg-gray-300 w-[25%] rounded-full"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badge Effect - Improved for mobile positioning */}
                                <div className="md:absolute md:-bottom-6 md:-right-6 bg-white p-5 rounded-2xl shadow-xl border border-gray-50 transform md:rotate-3 mt-8 md:mt-0 max-w-fit mx-auto md:mx-0">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[10px] text-text-secondary font-black uppercase tracking-widest leading-none mb-1">Success Rate</div>
                                            <div className="text-xl font-black text-text-main">99.9%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Timeline/Stepper */}
                    <div className="flex-1 w-full max-w-lg">
                        <div className="relative space-y-10 md:space-y-12 pl-4 md:pl-0">
                            {/* Vertical Line - Visible on mobile now */}
                            <div className="absolute left-6 md:left-6 top-8 bottom-8 w-0.5 bg-gray-100"></div>

                            {[
                                {
                                    icon: <Zap size={22} />,
                                    title: 'Lightning Faster',
                                    desc: 'Process entries in seconds. Keep the queue moving smoothly without bottlenecks.'
                                },
                                {
                                    icon: <Lightbulb size={22} />,
                                    title: 'No Lighting Needed',
                                    desc: 'Works perfectly in dark clubs or bright sunlight where QR codes often fail.'
                                },
                                {
                                    icon: <Focus size={22} />,
                                    title: 'No Camera Focus',
                                    desc: 'Forget about blurry scans or dirty lenses. NFC works with a simple proximity tap.'
                                }
                            ].map((feature, i) => (
                                <div key={i} className="relative flex items-start gap-8 md:gap-10 group">
                                    {/* Icon */}
                                    <div className="relative z-10 shrink-0">
                                        <div className="size-12 md:size-14 rounded-2xl bg-white shadow-soft text-primary flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:bg-primary group-hover:text-white border border-gray-50">
                                            {feature.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="pt-1 text-left">
                                        <h4 className="text-xl font-bold text-text-main mb-2 font-display tracking-tight group-hover:text-primary transition-colors">{feature.title}</h4>
                                        <p className="text-text-secondary leading-relaxed text-sm md:text-base font-medium">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
