'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    Calendar as CalendarIcon, 
    Check, 
    ArrowRight,
    Loader2
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { CatalogueItem } from '@/services/catalogue/hooks';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TIME_SLOTS = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
    '12:00 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', 
    '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
];

interface BookingSystemProps {
    service: CatalogueItem;
    onConfirm: (date: string, time: string) => void;
    isSubmitting?: boolean;
}

export const BookingSystem: React.FC<BookingSystemProps> = ({ 
    service, 
    onConfirm, 
    isSubmitting = false 
}) => {
    const today = useMemo(() => new Date(), []);
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Calendar logic
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const isPast = (day: number) => {
        const d = new Date(currentYear, currentMonth, day);
        const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return d < t;
    };

    const isToday = (day: number) => {
        return day === today.getDate() && 
               currentMonth === today.getMonth() && 
               currentYear === today.getFullYear();
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
        setSelectedDay(null);
        setSelectedTime(null);
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
        setSelectedDay(null);
        setSelectedTime(null);
    };

    const calendarCells = useMemo(() => {
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        return cells;
    }, [currentMonth, currentYear, daysInMonth, firstDayOfMonth]);

    const formattedSelectedDate = useMemo(() => {
        if (!selectedDay) return '';
        const d = new Date(currentYear, currentMonth, selectedDay);
        return d.toISOString().split('T')[0];
    }, [selectedDay, currentMonth, currentYear]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Calendar Widget */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-outline uppercase tracking-[0.2em]">Select Appointment Date</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                        <CalendarIcon size={12} />
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </div>
                </div>

                <div className="bg-white asymmetric-leaf p-4 md:p-6 shadow-xl border border-slate-50">
                    <div className="flex items-center justify-between mb-6">
                        <button 
                            onClick={handlePrevMonth}
                            className="size-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all active:scale-90"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h4 className="text-sm font-black text-on-surface uppercase tracking-widest">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </h4>
                        <button 
                            onClick={handleNextMonth}
                            className="size-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all active:scale-90"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                        {DAY_LABELS.map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {calendarCells.map((day, idx) => {
                            if (day === null) return <div key={`empty-${idx}`} />;
                            const past = isPast(day);
                            const todayMark = isToday(day);
                            const selected = selectedDay === day;

                            return (
                                <button
                                    key={day}
                                    disabled={past}
                                    onClick={() => {
                                        setSelectedDay(day);
                                        setSelectedTime(null);
                                    }}
                                    className={cn(
                                        "relative w-full aspect-square rounded-xl flex items-center justify-center text-xs md:text-sm font-black transition-all",
                                        past ? "text-slate-200 cursor-not-allowed" : "hover:bg-primary/5 cursor-pointer",
                                        selected ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "text-on-surface",
                                        todayMark && !selected ? "text-primary border border-primary/20" : ""
                                    )}
                                >
                                    {day}
                                    {todayMark && !selected && (
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Time Slots */}
            <AnimatePresence>
                {selectedDay && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-outline uppercase tracking-[0.2em]">Select Arrival Time</h3>
                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                <Clock size={14} />
                                {TIME_SLOTS.length} Slots Available
                            </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-3">
                            {TIME_SLOTS.map(slot => (
                                <button
                                    key={slot}
                                    onClick={() => setSelectedTime(slot)}
                                    className={cn(
                                        "py-3 rounded-xl text-[10px] md:text-xs font-black border transition-all active:scale-95 uppercase tracking-widest",
                                        selectedTime === slot 
                                            ? "bg-primary text-white border-transparent shadow-lg shadow-primary/20" 
                                            : "bg-white text-on-surface border-slate-100 hover:border-primary/30"
                                    )}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Action */}
            <div className="pt-6">
                <button
                    disabled={!selectedDay || !selectedTime || isSubmitting}
                    onClick={() => onConfirm(formattedSelectedDate, selectedTime!)}
                    className={cn(
                        "group relative w-full h-16 rounded-2xl text-white font-black text-sm md:text-base uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 overflow-hidden shadow-2xl shadow-primary/20",
                        (!selectedDay || !selectedTime) ? "bg-slate-200 cursor-not-allowed" : "bg-primary hover:bg-primary/90 hover:-translate-y-0.5 active:scale-[0.98]"
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            {(!selectedDay || !selectedTime) ? (
                                "Select Date & Time to Book"
                            ) : (
                                <>
                                    Confirm Booking for {selectedTime}
                                    <div className="absolute right-6 size-8 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                        <ArrowRight size={18} />
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </button>
                <p className="text-[9px] md:text-[10px] text-center text-outline font-bold mt-4 uppercase tracking-widest">
                    Secure checkout powered by Vemtap Premium
                </p>
            </div>
        </div>
    );
};
