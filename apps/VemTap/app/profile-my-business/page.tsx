import PublicProfilingForm from './PublicProfilingForm';
import { Sparkles, BarChart3, Zap, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Profile My Business | Vemtap AI',
  description: 'Unlock your business digitization potential with Vemtap AI. Get a custom analysis and priority scoring today.',
};

export default function ProfileMyBusinessPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 text-text-main selection:bg-primary/30">
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
                <div key={i} className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <item.icon size={24} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-black text-text-main mb-3">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed text-sm font-medium">{item.desc}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
