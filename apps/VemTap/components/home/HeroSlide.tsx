'use client';

import { motion } from 'framer-motion';
import { MapPin, Search, ArrowRight, Store, Sparkles, Tag, Star, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchBar from './SearchBar';
import Link from 'next/link';

interface HeroSlideProps {
  variant: 'consumer' | 'business' | 'discovery';
  locationLabel?: string | null;
  onLocationClick?: () => void;
}

function FloatingCard({ icon, label, color, delay, className }: { icon: React.ReactNode; label: string; color: string; delay: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 120 }}
      className={`absolute ${color} px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl shadow-lg border border-white/50 flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm ${className || ''}`}
    >
      {icon}
      <span className="text-[10px] sm:text-[11px] font-bold text-white whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

function MapGridBackground({ color = 'primary' }: { color?: string }) {
  return (
    <div className="absolute inset-0 rounded-2xl md:rounded-3xl overflow-hidden">
      {/* Google Maps-style base */}
      <div className="absolute inset-0 bg-[#f2efe9]" />

      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {/* Building blocks - varied sizes and shades */}
        <g opacity="0.5">
          {/* Row 1 */}
          <rect x="20" y="20" width="80" height="50" fill="#e8e4db" rx="2" />
          <rect x="120" y="15" width="60" height="55" fill="#dfd9ce" rx="2" />
          <rect x="200" y="25" width="90" height="45" fill="#e8e4db" rx="2" />
          <rect x="310" y="18" width="70" height="52" fill="#e2ddd3" rx="2" />
          <rect x="400" y="22" width="85" height="48" fill="#e8e4db" rx="2" />
          <rect x="505" y="16" width="75" height="54" fill="#dfd9ce" rx="2" />
          <rect x="600" y="20" width="95" height="50" fill="#e8e4db" rx="2" />
          <rect x="715" y="24" width="65" height="46" fill="#e2ddd3" rx="2" />

          {/* Row 2 */}
          <rect x="30" y="100" width="70" height="60" fill="#e2ddd3" rx="2" />
          <rect x="120" y="95" width="85" height="65" fill="#e8e4db" rx="2" />
          <rect x="225" y="102" width="65" height="58" fill="#dfd9ce" rx="2" />
          <rect x="310" y="98" width="90" height="62" fill="#e8e4db" rx="2" />
          <rect x="420" y="100" width="75" height="60" fill="#e2ddd3" rx="2" />
          <rect x="515" y="96" width="80" height="64" fill="#e8e4db" rx="2" />
          <rect x="615" y="101" width="70" height="59" fill="#dfd9ce" rx="2" />
          <rect x="705" y="97" width="75" height="63" fill="#e8e4db" rx="2" />

          {/* Row 3 */}
          <rect x="25" y="190" width="90" height="55" fill="#e8e4db" rx="2" />
          <rect x="135" y="185" width="70" height="60" fill="#e2ddd3" rx="2" />
          <rect x="225" y="192" width="85" height="53" fill="#e8e4db" rx="2" />
          <rect x="330" y="188" width="75" height="57" fill="#dfd9ce" rx="2" />
          <rect x="425" y="190" width="95" height="55" fill="#e8e4db" rx="2" />
          <rect x="540" y="186" width="65" height="59" fill="#e2ddd3" rx="2" />
          <rect x="625" y="191" width="80" height="54" fill="#e8e4db" rx="2" />
          <rect x="725" y="187" width="55" height="58" fill="#dfd9ce" rx="2" />

          {/* Row 4 */}
          <rect x="20" y="280" width="75" height="65" fill="#dfd9ce" rx="2" />
          <rect x="115" y="275" width="90" height="70" fill="#e8e4db" rx="2" />
          <rect x="225" y="282" width="70" height="63" fill="#e2ddd3" rx="2" />
          <rect x="315" y="278" width="85" height="67" fill="#e8e4db" rx="2" />
          <rect x="420" y="280" width="80" height="65" fill="#dfd9ce" rx="2" />
          <rect x="520" y="276" width="75" height="69" fill="#e8e4db" rx="2" />
          <rect x="615" y="281" width="90" height="64" fill="#e2ddd3" rx="2" />
          <rect x="725" y="277" width="60" height="68" fill="#e8e4db" rx="2" />

          {/* Row 5 */}
          <rect x="30" y="380" width="85" height="50" fill="#e8e4db" rx="2" />
          <rect x="135" y="375" width="75" height="55" fill="#e2ddd3" rx="2" />
          <rect x="230" y="382" width="80" height="48" fill="#e8e4db" rx="2" />
          <rect x="330" y="378" width="90" height="52" fill="#dfd9ce" rx="2" />
          <rect x="440" y="380" width="70" height="50" fill="#e8e4db" rx="2" />
          <rect x="530" y="376" width="85" height="54" fill="#e2ddd3" rx="2" />
          <rect x="635" y="381" width="75" height="49" fill="#e8e4db" rx="2" />
          <rect x="730" y="377" width="55" height="53" fill="#dfd9ce" rx="2" />

          {/* Row 6 */}
          <rect x="20" y="460" width="80" height="60" fill="#e2ddd3" rx="2" />
          <rect x="120" y="455" width="95" height="65" fill="#e8e4db" rx="2" />
          <rect x="235" y="462" width="70" height="58" fill="#dfd9ce" rx="2" />
          <rect x="325" y="458" width="85" height="62" fill="#e8e4db" rx="2" />
          <rect x="430" y="460" width="75" height="60" fill="#e2ddd3" rx="2" />
          <rect x="525" y="456" width="90" height="64" fill="#e8e4db" rx="2" />
          <rect x="635" y="461" width="80" height="59" fill="#dfd9ce" rx="2" />
          <rect x="735" y="457" width="50" height="63" fill="#e8e4db" rx="2" />
        </g>

        {/* Main roads - yellow/orange highways */}
        <g>
          {/* Horizontal highway */}
          <path d="M0,250 Q200,245 400,250 Q600,255 800,250" stroke="#f9c74f" strokeWidth="8" fill="none" opacity="0.7" />
          {/* Vertical highway */}
          <path d="M400,0 Q395,150 400,300 Q405,450 400,600" stroke="#f9c74f" strokeWidth="8" fill="none" opacity="0.7" />
        </g>

        {/* Major roads - white */}
        <g stroke="#ffffff" strokeWidth="4" fill="none" opacity="0.9">
          {/* Horizontal major roads */}
          <line x1="0" y1="80" x2="800" y2="80" />
          <line x1="0" y1="165" x2="800" y2="165" />
          <line x1="0" y1="340" x2="800" y2="340" />
          <line x1="0" y1="430" x2="800" y2="430" />
          <line x1="0" y1="530" x2="800" y2="530" />

          {/* Vertical major roads */}
          <line x1="110" y1="0" x2="110" y2="600" />
          <line x1="220" y1="0" x2="220" y2="600" />
          <line x1="315" y1="0" x2="315" y2="600" />
          <line x1="510" y1="0" x2="510" y2="600" />
          <line x1="610" y1="0" x2="610" y2="600" />
          <line x1="720" y1="0" x2="720" y2="600" />
        </g>

        {/* Minor roads - thinner white */}
        <g stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.6">
          <line x1="55" y1="0" x2="55" y2="600" />
          <line x1="165" y1="0" x2="165" y2="600" />
          <line x1="270" y1="0" x2="270" y2="600" />
          <line x1="365" y1="0" x2="365" y2="600" />
          <line x1="455" y1="0" x2="455" y2="600" />
          <line x1="560" y1="0" x2="560" y2="600" />
          <line x1="665" y1="0" x2="665" y2="600" />
          <line x1="765" y1="0" x2="765" y2="600" />

          <line x1="0" y1="45" x2="800" y2="45" />
          <line x1="0" y1="125" x2="800" y2="125" />
          <line x1="0" y1="210" x2="800" y2="210" />
          <line x1="0" y1="295" x2="800" y2="295" />
          <line x1="0" y1="385" x2="800" y2="385" />
          <line x1="0" y1="480" x2="800" y2="480" />
          <line x1="0" y1="565" x2="800" y2="565" />
        </g>

        {/* Green park areas */}
        <g opacity="0.5">
          <rect x="440" y="120" width="60" height="40" fill="#b5d6a7" rx="8" />
          <rect x="140" y="310" width="70" height="35" fill="#b5d6a7" rx="8" />
          <rect x="620" y="400" width="55" height="30" fill="#b5d6a7" rx="8" />
          <rect x="30" y="500" width="50" height="35" fill="#b5d6a7" rx="8" />
          <rect x="700" y="140" width="45" height="30" fill="#b5d6a7" rx="8" />
        </g>

        {/* Street labels */}
        <g fontSize="9" fill="#888" fontFamily="Arial, sans-serif" opacity="0.5">
          <text x="140" y="78">MG Road</text>
          <text x="350" y="163">Park Avenue</text>
          <text x="550" y="338">Market Street</text>
          <text x="108" y="310" transform="rotate(-90, 108, 310)">Main Street</text>
          <text x="508" y="200" transform="rotate(-90, 508, 200)">Broadway</text>
          <text x="250" y="428">Commerce Lane</text>
          <text x="620" y="528">Hill Road</text>
        </g>

        {/* Metro/transit icons */}
        <g opacity="0.4">
          <circle cx="165" cy="80" r="6" fill="#4285f4" />
          <circle cx="400" cy="165" r="6" fill="#4285f4" />
          <circle cx="610" cy="340" r="6" fill="#4285f4" />
          <circle cx="315" cy="430" r="6" fill="#4285f4" />
          <circle cx="720" cy="250" r="6" fill="#4285f4" />
        </g>

        {/* Pin glow */}
        <defs>
          <radialGradient id="pin-glow">
            <stop offset="0%" stopColor="#004ac6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#004ac6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="400" cy="300" r="80" fill="url(#pin-glow)" />
      </svg>
    </div>
  );
}

function ConsumerVisual() {
  return (
    <div className="relative w-full h-[180px] sm:h-[240px] md:h-[340px] mt-4 sm:mt-6 md:mt-0">
      <MapGridBackground color="primary" />

      <FloatingCard
        icon={<Tag size={12} className="text-white sm:hidden" />}
        label="20% OFF"
        color="bg-rose-500"
        delay={0.3}
        className="top-2 left-2 sm:top-4 sm:left-4 md:top-6 md:left-8"
      />
      <FloatingCard
        icon={<Store size={12} className="text-white sm:hidden" />}
        label="Bella Restaurant"
        color="bg-primary"
        delay={0.45}
        className="top-12 right-2 sm:top-16 sm:right-4 md:top-12 md:right-8"
      />
      <FloatingCard
        icon={<ShoppingBag size={12} className="text-white sm:hidden" />}
        label="New Arrivals"
        color="bg-emerald-500"
        delay={0.6}
        className="bottom-20 left-2 sm:bottom-24 sm:left-4 md:bottom-20 md:left-12"
      />
      <FloatingCard
        icon={<Star size={12} className="text-white sm:hidden" />}
        label="4.8 Rating"
        color="bg-amber-500"
        delay={0.5}
        className="top-1/2 -translate-y-1/2 right-2 sm:right-6 md:right-12"
      />
      <FloatingCard
        icon={<MapPin size={12} className="text-white sm:hidden" />}
        label="Wuse 2, Abuja"
        color="bg-violet-500"
        delay={0.7}
        className="bottom-8 right-4 sm:bottom-8 sm:right-8 md:bottom-12 md:right-16"
      />
      <FloatingCard
        icon={<Sparkles size={12} className="text-white sm:hidden" />}
        label="Trending Now"
        color="bg-cyan-500"
        delay={0.8}
        className="bottom-2 left-1/2 -translate-x-1/2 sm:bottom-4 md:bottom-4"
      />

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative">
          {/* Pin shadow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/15 rounded-full blur-sm" />
          {/* Pin body */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-white">
            <MapPin size={20} className="text-white sm:w-6 sm:h-6" fill="currentColor" />
          </div>
          {/* Pin tail */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-primary" />
        </div>
      </motion.div>
    </div>
  );
}

function BusinessVisual() {
  return (
    <div className="relative w-full h-[180px] sm:h-[240px] md:h-[340px] mt-4 sm:mt-6 md:mt-0">
      <MapGridBackground color="emerald" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-3 left-1/2 -translate-x-1/2 sm:top-4 md:top-8 bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-5 w-[240px] sm:w-64 border border-gray-100"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
            <Store size={14} className="text-primary sm:w-[18px] sm:h-[18px]" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-gray-900">Your Business</p>
            <p className="text-[9px] sm:text-[11px] text-gray-500">Get discovered by locals</p>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <div className="flex-1 bg-primary/5 rounded-lg p-1.5 sm:p-2 text-center">
            <p className="text-sm sm:text-lg font-bold text-primary">1.2K</p>
            <p className="text-[8px] sm:text-[10px] text-gray-500 font-medium">Views</p>
          </div>
          <div className="flex-1 bg-emerald-50 rounded-lg p-1.5 sm:p-2 text-center">
            <p className="text-sm sm:text-lg font-bold text-emerald-600">89</p>
            <p className="text-[8px] sm:text-[10px] text-gray-500 font-medium">Leads</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-lg p-1.5 sm:p-2 text-center">
            <p className="text-sm sm:text-lg font-bold text-amber-600">₦45K</p>
            <p className="text-[8px] sm:text-[10px] text-gray-500 font-medium">Revenue</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute bottom-4 left-3 sm:bottom-8 sm:left-6 md:bottom-12 md:left-8 bg-white rounded-xl sm:rounded-2xl shadow-lg p-2.5 sm:p-3 md:p-4 border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-rose-500 flex items-center justify-center">
            <Tag size={11} className="text-white sm:w-[14px] sm:h-[14px]" />
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-gray-900">30% OFF</p>
            <p className="text-[9px] sm:text-[10px] text-gray-500">Weekend Special</p>
          </div>
        </div>
        <div className="h-1 sm:h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '65%' }}
            transition={{ delay: 1, duration: 1 }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <p className="text-[8px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1">65% claimed</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-6 right-3 sm:bottom-10 sm:right-6 md:bottom-16 md:right-8 bg-white rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-3 border border-gray-100"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-600 text-xs sm:text-sm">✓</span>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-gray-900">New Customer!</p>
            <p className="text-[9px] sm:text-[10px] text-gray-500">Just registered via QR</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DiscoveryVisual() {
  return (
    <div className="relative w-full h-[180px] sm:h-[240px] md:h-[340px] mt-4 sm:mt-6 md:mt-0">
      <MapGridBackground color="violet" />

      {/* Rotating ring of category icons */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-rose-500 shadow-lg flex items-center justify-center">
          <Tag size={13} className="text-white sm:w-4 sm:h-4" />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-primary shadow-lg flex items-center justify-center">
          <Store size={13} className="text-white sm:w-4 sm:h-4" />
        </div>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-emerald-500 shadow-lg flex items-center justify-center">
          <ShoppingBag size={13} className="text-white sm:w-4 sm:h-4" />
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-amber-500 shadow-lg flex items-center justify-center">
          <Sparkles size={13} className="text-white sm:w-4 sm:h-4" />
        </div>
      </motion.div>

      {/* Center icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
          <Sparkles size={18} className="text-white sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </div>
      </motion.div>

      {/* Floating product cards */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-3 left-3 sm:top-5 sm:left-5 md:top-6 md:left-8 bg-white rounded-xl shadow-lg p-2.5 border border-gray-100 w-[120px] sm:w-[140px]"
      >
        <div className="w-full h-10 sm:h-12 rounded-lg bg-rose-100 mb-1.5" />
        <p className="text-[9px] sm:text-[10px] font-bold text-gray-900 line-clamp-1">Ankara Dress</p>
        <p className="text-[8px] sm:text-[9px] text-gray-400">StyleHub Fashion</p>
        <p className="text-[10px] sm:text-xs font-bold text-primary mt-0.5">₦8,500</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-3 right-3 sm:top-5 sm:right-5 md:top-6 md:right-8 bg-white rounded-xl shadow-lg p-2.5 border border-gray-100 w-[120px] sm:w-[140px]"
      >
        <div className="w-full h-10 sm:h-12 rounded-lg bg-blue-100 mb-1.5" />
        <p className="text-[9px] sm:text-[10px] font-bold text-gray-900 line-clamp-1">iPhone 15</p>
        <p className="text-[8px] sm:text-[9px] text-gray-400">TechZone</p>
        <p className="text-[10px] sm:text-xs font-bold text-primary mt-0.5">₦84,000</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 md:bottom-6 md:left-8 bg-white rounded-xl shadow-lg p-2.5 border border-gray-100 w-[120px] sm:w-[140px]"
      >
        <div className="w-full h-10 sm:h-12 rounded-lg bg-green-100 mb-1.5" />
        <p className="text-[9px] sm:text-[10px] font-bold text-gray-900 line-clamp-1">Organic Bundle</p>
        <p className="text-[8px] sm:text-[9px] text-gray-400">GreenLeaf</p>
        <p className="text-[10px] sm:text-xs font-bold text-primary mt-0.5">₦12,500</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 md:bottom-6 md:right-8 bg-white rounded-xl shadow-lg p-2.5 border border-gray-100 w-[120px] sm:w-[140px]"
      >
        <div className="w-full h-10 sm:h-12 rounded-lg bg-purple-100 mb-1.5" />
        <p className="text-[9px] sm:text-[10px] font-bold text-gray-900 line-clamp-1">Spa Package</p>
        <p className="text-[8px] sm:text-[9px] text-gray-400">Glow Beauty</p>
        <p className="text-[10px] sm:text-xs font-bold text-primary mt-0.5">₦16,667</p>
      </motion.div>

      {/* Floating tags */}
      <FloatingCard
        icon={<MapPin size={10} className="text-white" />}
        label="Abuja"
        color="bg-violet-500"
        delay={0.8}
        className="top-[42%] left-1 sm:left-2 md:left-4"
      />
      <FloatingCard
        icon={<Star size={10} className="text-white" />}
        label="Top Rated"
        color="bg-amber-500"
        delay={0.9}
        className="top-[42%] right-1 sm:right-2 md:right-4"
      />
      <FloatingCard
        icon={<Tag size={10} className="text-white" />}
        label="Hot Deals"
        color="bg-rose-500"
        delay={1.0}
        className="bottom-[42%] left-1 sm:left-2 md:left-4"
      />
      <FloatingCard
        icon={<ShoppingBag size={10} className="text-white" />}
        label="New Drops"
        color="bg-emerald-500"
        delay={1.1}
        className="bottom-[42%] right-1 sm:right-2 md:right-4"
      />
    </div>
  );
}

export default function HeroSlide({ variant, locationLabel, onLocationClick }: HeroSlideProps) {
  return (
    <div className="min-h-[360px] sm:min-h-[420px] md:min-h-[600px] flex items-center">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-12 items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center md:text-left"
        >
          {variant === 'consumer' && (
            <>
              {locationLabel && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-full mb-3 sm:mb-4"
                >
                  <MapPin size={12} />
                  {locationLabel}
                </motion.div>
              )}
              <h1 className="text-[28px] sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight mb-3 sm:mb-4">
                Discover What's{' '}
                <span className="text-primary">Near You</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-5 sm:mb-6 md:mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
                Find amazing deals, businesses, products and services around you.
              </p>
              <div className="mb-4 sm:mb-6">
                <SearchBar locationLabel={locationLabel} onLocationClick={onLocationClick} />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 justify-center md:justify-start">
                <Link href="/deals">
                  <Button className="h-10 sm:h-12 px-5 sm:px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center gap-2">
                    <MapPin size={14} className="sm:w-4 sm:h-4" />
                    Find What's Near Me
                  </Button>
                </Link>
                <Link href="/deals" className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                  Explore All Deals <ArrowRight size={12} />
                </Link>
              </div>
            </>
          )}

          {variant === 'business' && (
            <>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full mb-3 sm:mb-4">
                <Store size={12} />
                For Business Owners
              </div>
              <h1 className="text-[28px] sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight mb-3 sm:mb-4">
                Get Your Business{' '}
                <span className="text-primary">Discovered</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-5 sm:mb-6 md:mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
                Put your business, products and offers in front of people looking for what you offer.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 justify-center md:justify-start">
                <Link href="/business-landing">
                  <Button className="h-10 sm:h-12 px-5 sm:px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center gap-2">
                    Get Started as a Business
                    <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}

          {variant === 'discovery' && (
            <>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full mb-3 sm:mb-4">
                <Sparkles size={12} />
                Explore
              </div>
              <h1 className="text-[28px] sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-gray-900 leading-[1.1] tracking-tight mb-3 sm:mb-4">
                There's Always Something to{' '}
                <span className="text-primary">Discover</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-5 sm:mb-6 md:mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
                Explore new deals, businesses, products and offers around you.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 justify-center md:justify-start">
                <Link href="/deals">
                  <Button className="h-10 sm:h-12 px-5 sm:px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center gap-2">
                    Explore VEMTAP
                    <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </motion.div>

        {variant === 'consumer' && <ConsumerVisual />}
        {variant === 'business' && <BusinessVisual />}
        {variant === 'discovery' && <DiscoveryVisual />}
      </div>
    </div>
  );
}
