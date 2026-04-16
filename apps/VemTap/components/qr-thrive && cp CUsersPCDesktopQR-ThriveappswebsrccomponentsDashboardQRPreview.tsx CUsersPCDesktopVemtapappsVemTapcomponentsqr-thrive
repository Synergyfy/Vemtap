import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Clock, MapPin, CreditCard, ArrowRight, ShieldCheck, Star, ChevronLeft, ChevronRight, Check, LinkIcon, MessageSquare, ArrowLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { FormField } from '../types/form';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface BookingProfilePreviewProps {
  businessName?: string;
  title?: string;
  description?: string;
  location?: string;
  bookingUrl?: string;
  imageUrl?: string;
  profileImageUrl?: string;
  price?: string;
  duration?: string;
  themeColor?: string;
  buttonText?: string;
  destinationMode?: 'url' | 'calendar' | 'qr_link';
  qrLinkId?: string;
  customFormEnabled?: boolean;
  customFormFields?: FormField[];
  whatsappEnabled?: boolean;
  whatsappNumber?: string;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1544161515-4ae6b918af99?w=800&h=600&fit=crop";

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

const MOCK_QRS: Record<string, { name: string; type: string }> = {
  'qr-form-1': { name: 'Registration Form', type: 'form' },
  'qr-form-2': { name: 'Feedback Survey', type: 'form' },
  'qr-menu-1': { name: 'Summer Menu', type: 'menu' },
};

const BookingProfilePreview: React.FC<BookingProfilePreviewProps> = ({
  businessName = "Premium Services",
  title = "Book Your Session",
  description = "Experience the best quality service tailored to your needs. Professional, reliable, and convenient.",
  location = "Main Street, NY",
  bookingUrl = "#",
  imageUrl,
  profileImageUrl,
  price,
  duration,
  themeColor = "#3b82f6",
  buttonText = "Book Now",
  destinationMode = "url",
  qrLinkId,
  customFormEnabled = false,
  customFormFields = [],
  whatsappEnabled = false,
  whatsappNumber = ""
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);

  // Calendar state
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [showingForm, setShowingForm] = useState(false);
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const isPast = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };

  const isToday = (day: number) => {
    return day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
    setSelectedDay(null);
    setSelectedTime(null);
  };

  const handleNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
    setSelectedDay(null);
    setSelectedTime(null);
  };

  const handleBook = () => {
    if (destinationMode === 'url') {
      return;
    }
    if (destinationMode === 'qr_link') {
      return;
    }
    if (destinationMode === 'calendar' && selectedDay && selectedTime) {
      if (customFormEnabled && customFormFields.length > 0) {
        setShowingForm(true);
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      } else {
        setBookingConfirmed(true);
      }
    }
  };

  const handleFormSubmit = () => {
    setShowingForm(false);
    setBookingConfirmed(true);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

  const linkedQR = qrLinkId ? MOCK_QRS[qrLinkId] : null;

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  return (
    <div className="w-full h-full flex flex-col font-sans bg-slate-50 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b opacity-10 pointer-events-none" style={{ backgroundColor: themeColor }} />
      
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center z-10">
        
        {/* Cover Image Section */}
        <div className="w-full h-64 relative overflow-hidden bg-slate-200 shrink-0">
           <img 
            src={imageUrl || DEFAULT_IMAGE} 
            alt="Service" 
            className="w-full h-full object-cover relative z-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
            }}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
           
           {/* Wavy Divider */}
           <div className="absolute bottom-0 left-0 w-full leading-[0] z-20">
             <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-12 fill-slate-50">
               <path d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
             </svg>
           </div>
           
           {/* Business Floating Badge */}
           <div className="absolute bottom-8 left-6 flex items-center gap-3 z-30">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center p-1.5 border border-white/50 backdrop-blur-sm">
                 <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                    {profileImageUrl ? (
                       <img src={profileImageUrl} alt={businessName} className="w-full h-full object-cover" />
                    ) : (
                       <span className="text-slate-900 font-black text-lg">{businessName.charAt(0)}</span>
                    )}
                 </div>
              </div>
              <div className="text-white drop-shadow-lg">
                 <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-90">Booking with</p>
                 <h4 className="text-sm font-black tracking-tight">{businessName}</h4>
              </div>
           </div>
        </div>

        {/* Content Section */}
        <div className="w-full bg-slate-50 px-6 pt-4 pb-20 space-y-8 relative">
           
           {/* Header Info */}
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="flex text-amber-500">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                 </div>
                 <span className="text-[10px] font-bold text-slate-400">Verified Professional</span>
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {title}
              </h1>
              
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                {description}
              </p>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-2 gap-4">
              {price && (
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <CreditCard size={18} />
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Price</p>
                      <p className="text-xs font-bold text-slate-900">{price}</p>
                   </div>
                </div>
              )}
              {duration && (
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Clock size={18} />
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Duration</p>
                      <p className="text-xs font-bold text-slate-900">{duration}</p>
                   </div>
                </div>
              )}
           </div>

           {/* Details Section */}
           <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4 p-4 bg-slate-100/50 rounded-3xl border border-slate-100">
                 <div className="w-8 h-8 bg-white text-slate-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <MapPin size={16} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Location</p>
                    <p className="text-[11px] font-semibold text-slate-700">{location}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-3xl border border-emerald-50">
                 <div className="w-8 h-8 bg-white text-emerald-500 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <ShieldCheck size={16} />
                 </div>
                 <p className="text-[10px] font-bold text-emerald-700">
                    Your appointment is secured via QR Thrive verified business link.
                 </p>
              </div>
           </div>

           {/* ===== CALENDAR SECTION (only for calendar mode) ===== */}
           {destinationMode === 'calendar' && !bookingConfirmed && !showingForm && (
              <div className="space-y-5 pt-6 border-t border-slate-100">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Select Date & Time</h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-tight">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                       Live Booking
                    </div>
                 </div>

                 {/* Calendar Widget */}
                 <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                       <button onClick={handlePrevMonth} className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all active:scale-90">
                          <ChevronLeft size={16} />
                       </button>
                       <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                          {MONTH_NAMES[calMonth]} {calYear}
                       </h4>
                       <button onClick={handleNextMonth} className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all active:scale-90">
                          <ChevronRight size={16} />
                       </button>
                    </div>

                    {/* Day Labels */}
                    <div className="grid grid-cols-7 px-4 pt-3 pb-1">
                       {DAY_LABELS.map(d => (
                          <div key={d} className="text-center text-[8px] font-black text-slate-300 uppercase tracking-widest py-1">{d}</div>
                       ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 px-4 pb-4 gap-y-1">
                       {calendarCells.map((day, idx) => {
                          if (day === null) return <div key={`empty-${idx}`} />;
                          const past = isPast(day);
                          const todayMark = isToday(day);
                          const selected = selectedDay === day;
                          return (
                            <button
                              key={day}
                              disabled={past}
                              onClick={() => { setSelectedDay(day); setSelectedTime(null); }}
                              className={`
                                relative w-full aspect-square rounded-xl flex items-center justify-center text-[11px] font-bold transition-all
                                ${past ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'}
                                ${selected ? 'text-white shadow-lg' : ''}
                                ${todayMark && !selected ? 'text-blue-600 font-black' : ''}
                                ${!past && !selected && !todayMark ? 'text-slate-700' : ''}
                              `}
                              style={selected ? { backgroundColor: themeColor, boxShadow: `0 4px 12px ${themeColor}50` } : {}}
                            >
                              {day}
                              {todayMark && !selected && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                              )}
                            </button>
                          );
                       })}
                    </div>
                 </div>

                 {/* Time Slots (shown after selecting a day) */}
                 {selectedDay && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                       <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             Available Times — {MONTH_NAMES[calMonth]} {selectedDay}
                          </p>
                          <Clock size={12} className="text-slate-300" />
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {TIME_SLOTS.map(slot => (
                             <button
                               key={slot}
                               onClick={() => setSelectedTime(slot)}
                               className={`
                                 px-3 py-2 rounded-xl text-[10px] font-bold border transition-all active:scale-95
                                 ${selectedTime === slot 
                                   ? 'text-white border-transparent shadow-lg' 
                                   : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}
                               `}
                               style={selectedTime === slot ? { backgroundColor: themeColor, boxShadow: `0 4px 12px ${themeColor}40` } : {}}
                             >
                               {slot}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           )}

           {/* ===== CUSTOM FORM SECTION ===== */}
           {showingForm && (
              <div className="space-y-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                <button 
                  onClick={() => setShowingForm(false)}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft size={12} /> Back to Calendar
                </button>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 leading-none">Booking Details</h3>
                  <p className="text-xs text-slate-500 font-medium">Please provide the following info to complete your request.</p>
                </div>

                <div className="space-y-4">
                  {customFormFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </p>
                      {field.type === 'textarea' ? (
                        <textarea 
                          className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 min-h-[100px] transition-all"
                          placeholder={field.label}
                          value={formAnswers[field.id] || ''}
                          onChange={(e) => setFormAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                        />
                      ) : field.type === 'boolean' ? (
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                           <button 
                            onClick={() => setFormAnswers(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative",
                              formAnswers[field.id] ? "bg-blue-600 shadow-md shadow-blue-100" : "bg-slate-200"
                            )}
                           >
                             <div className={cn(
                               "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                               formAnswers[field.id] ? "translate-x-6" : "translate-x-0"
                             )} />
                           </button>
                           <span className="text-xs font-bold text-slate-600">{formAnswers[field.id] ? 'Yes, confirmed' : 'No'}</span>
                        </div>
                      ) : (
                        <input 
                          type={field.type === 'phone' ? 'tel' : field.type}
                          className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder={field.label}
                          value={formAnswers[field.id] || ''}
                          onChange={(e) => setFormAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
           )}

           {/* ===== QR LINK INFO (only for qr_link mode) ===== */}
           {destinationMode === 'qr_link' && linkedQR && (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Connected Experience</h3>
                 </div>
                 <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${themeColor}15` }}>
                       <LinkIcon size={20} style={{ color: themeColor }} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Opens</p>
                       <p className="text-sm font-bold text-slate-900">{linkedQR.name}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">{linkedQR.type} QR</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300" />
                 </div>
              </div>
           )}

           {/* ===== BOOKING CONFIRMED STATE ===== */}
           {bookingConfirmed && (
              <div className="space-y-6 pt-8 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                 <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: themeColor }}>
                       <Check size={32} strokeWidth={3} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-slate-900 mb-1">Booking Requested!</h3>
                       <p className="text-xs text-slate-500 font-medium">Your appointment request has been sent to {businessName}.</p>
                    </div>
                 </div>
                 <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                       <span className="text-xs font-bold text-slate-900">{MONTH_NAMES[calMonth]} {selectedDay}, {calYear}</span>
                    </div>
                    <div className="border-t border-slate-50" />
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</span>
                       <span className="text-xs font-bold text-slate-900">{selectedTime}</span>
                    </div>
                    <div className="border-t border-slate-50" />
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Service</span>
                       <span className="text-xs font-bold text-slate-900">{title}</span>
                    </div>
                    {price && (
                      <>
                        <div className="border-t border-slate-50" />
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                           <span className="text-sm font-black" style={{ color: themeColor }}>{price}</span>
                        </div>
                      </>
                    )}
                 </div>
                 <button
                   onClick={() => { setBookingConfirmed(false); setSelectedDay(null); setSelectedTime(null); setFormAnswers({}); setShowingForm(false); }}
                   className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all"
                 >
                   ← Book Another
                 </button>

                 {whatsappEnabled && whatsappNumber && (
                   <div className="pt-4 border-t border-slate-50 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Have Questions?</p>
                     <a 
                       href={`https://wa.me/${whatsappNumber.replace(/\+/g, '').replace(/\s/g, '').replace(/-/g, '')}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-100/50 hover:scale-[1.02] active:scale-95 transition-all"
                     >
                       <MessageSquare className="w-5 h-5 fill-white/20" />
                       Chat on WhatsApp
                     </a>
                   </div>
                 )}
              </div>
           )}
        </div>
      </div>
      
      {/* CTA Footer */}
      {!bookingConfirmed && (
        <div className="p-6 bg-white border-t border-slate-100 rounded-t-[40px] shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-20">
           {destinationMode === 'url' ? (
             <a 
               href={bookingUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
               style={{ backgroundColor: themeColor, boxShadow: `0 10px 20px -5px ${themeColor}40` }}
             >
                {buttonText}
                <ArrowRight size={18} />
             </a>
           ) : destinationMode === 'calendar' ? (
             <button
               onClick={showingForm ? handleFormSubmit : handleBook}
               disabled={(showingForm ? false : (!selectedDay || !selectedTime))}
               className={`w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                 (!showingForm && (!selectedDay || !selectedTime)) ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
               }`}
               style={{ backgroundColor: themeColor, boxShadow: (showingForm || (selectedDay && selectedTime)) ? `0 10px 20px -5px ${themeColor}40` : 'none' }}
             >
                {showingForm 
                  ? 'Complete Booking'
                  : (selectedDay && selectedTime 
                    ? <>{buttonText} — {MONTH_NAMES[calMonth].slice(0,3)} {selectedDay}, {selectedTime}</>
                    : selectedDay 
                      ? 'Select a time slot' 
                      : 'Select a date first')}
                {(showingForm || (selectedDay && selectedTime)) && <ArrowRight size={18} />}
             </button>
           ) : (
             <button
               onClick={handleBook}
               className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
               style={{ backgroundColor: themeColor, boxShadow: `0 10px 20px -5px ${themeColor}40` }}
             >
                {buttonText}
                <ArrowRight size={18} />
             </button>
           )}
        </div>
      )}
    </div>
  );
};

export default BookingProfilePreview;
