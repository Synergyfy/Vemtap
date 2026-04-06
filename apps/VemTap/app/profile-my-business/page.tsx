import PublicProfilingForm from './PublicProfilingForm';
import { Sparkles, BarChart3, Zap, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Profile My Business | Vemtap AI',
  description: 'Unlock your business digitization potential with Vemtap AI. Get a custom analysis and priority scoring today.',
};

export default function ProfileMyBusinessPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Form Container */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 mb-24">
            <PublicProfilingForm />
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            {[
                { icon: BarChart3, title: 'Growth Metrics', desc: 'See how much revenue you are leaving on the table.' },
                { icon: Zap, title: 'Action Plans', desc: 'Get immediate recommendations tailored to your store layout.' },
                { icon: ShieldCheck, title: 'Priority Access', desc: 'Qualified businesses get early access to our new loyalty tools.' }
            ].map((item, i) => (
                <div key={i} className="group p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <item.icon size={24} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-white/30 leading-relaxed text-sm">{item.desc}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
