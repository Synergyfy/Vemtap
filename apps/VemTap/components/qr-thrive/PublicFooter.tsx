import Link from 'next/link';
import { Zap, Globe, MessageSquare, Camera, Briefcase, type LucideIcon } from 'lucide-react';

function SocialIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <button className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-100 hover:bg-white/20 hover:text-white hover:-translate-y-1 transition-all border border-white/5">
      <Icon className="w-5 h-5" />
    </button>
  );
}

export default function PublicFooter() {
  return (
    <footer className="bg-blue-600 py-24 px-4 text-white font-sans mt-auto border-t border-blue-500">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 mb-24">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="text-white w-6 h-6 fill-yellow-300" />
              </div>
              <span className="text-2xl font-bold tracking-tighter">QR Thrive</span>
            </div>
            <p className="text-blue-100 max-w-xs mb-10 font-medium leading-relaxed">Modernize your business interactions with the world's most intuitive QR management engine.</p>
            <div className="flex gap-5">
              <SocialIcon icon={Globe} />
              <SocialIcon icon={MessageSquare} />
              <SocialIcon icon={Camera} />
              <SocialIcon icon={Briefcase} />
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-sm uppercase tracking-[0.2em] mb-8 text-blue-200">Product</h4>
            <ul className="space-y-5 text-blue-100 text-sm font-semibold">
              <li><Link href="/" className="hover:text-white transition-colors">QR Generator</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Dynamic Links</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Analytics Pro</a></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-[0.2em] mb-8 text-blue-200">Company</h4>
            <ul className="space-y-5 text-blue-100 text-sm font-semibold">
              <li><a href="#" className="hover:text-white transition-colors">About Story</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Product Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Join Team</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-[0.2em] mb-8 text-blue-200">Legal</h4>
            <ul className="space-y-5 text-blue-100 text-sm font-semibold">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Guard</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Usage Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-blue-500/30 flex flex-col md:flex-row justify-between items-center gap-8 text-blue-200 text-[10px] font-bold uppercase tracking-[0.3em]">
          <p>© {(new Date()).getFullYear()} QR Thrive Enterprise. Built for the future of physical interactions.</p>
          <div className="flex gap-10">
            <span className="hover:text-white cursor-pointer">System Status</span>
            <span className="hover:text-white cursor-pointer">Security Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
