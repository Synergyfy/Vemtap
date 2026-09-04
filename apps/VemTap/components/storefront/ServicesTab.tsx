'use client';

import { Briefcase, CheckCircle2, Clock } from 'lucide-react';

interface ServicesTabProps {
  businessName: string;
  items: any[];
  isLoading: boolean;
  phone?: string | null;
  email?: string | null;
}

function itemImage(item: any): string {
  return item?.mainImage || item?.galleryImages?.[0] || item?.image || '';
}

export default function ServicesTab({ businessName, items, isLoading, phone, email }: ServicesTabProps) {
  const bookHref = phone ? `tel:${phone}` : email ? `mailto:${email}` : '#';

  return (
    <section id="services-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 scroll-mt-32">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-bold text-slate-900">Services</h3>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
          {items?.length || 0} Services
        </span>
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-5">
        Available services at {businessName}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-3.5">
          {items.map((item: any) => {
            const image = itemImage(item);
            const duration = item?.duration || item?.durationMinutes || item?.estimatedTime;
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-100 hover:shadow-sm transition-all gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100/30 flex items-center justify-center shrink-0">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Briefcase size={22} className="text-[#066CF4]/50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-[15px]">
                        {item.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle2 size={10} />
                        Bookable
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {item.shortDescription || item.description || 'Professional standard service execution.'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {item.price !== undefined && item.price !== null && (
                        <span className="text-sm font-black text-slate-900">
                          From ₦{Number(item.price).toLocaleString()}
                        </span>
                      )}
                      {duration && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <Clock size={11} />
                          {duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <a
                    href={bookHref}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    Book Now
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
          <p className="text-sm font-bold text-slate-600">No services listed yet</p>
          <p className="text-xs text-slate-400 mt-1">Call the business to ask about services.</p>
        </div>
      )}
    </section>
  );
}
