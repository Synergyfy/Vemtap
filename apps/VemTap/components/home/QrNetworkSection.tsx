'use client';

import { motion } from 'framer-motion';
import { QrCode, Scan, Search, Sparkles } from 'lucide-react';

const steps = [
  { icon: QrCode, label: 'VEMTAP QR', color: 'bg-primary text-white' },
  { icon: Scan, label: 'Scan', color: 'bg-gray-100 text-gray-600' },
  { icon: Search, label: 'Discover', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Sparkles, label: 'Explore', color: 'bg-amber-50 text-amber-600' },
];

export default function QRNetworkSection() {
  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 md:p-12 text-center"
        >
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Look Out for VEMTAP Around You
          </h2>
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            Scan VEMTAP QR codes to discover local businesses, offers and deals.
          </p>

          <div className="flex items-center justify-center gap-3 md:gap-6 flex-wrap">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-sm`}>
                  <step.icon size={22} />
                </div>
                <span className="text-xs font-semibold text-gray-600">{step.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
