'use client';

import React from 'react';
import { Utensils, Scissors, ShoppingBag, Dumbbell, Hotel, Store, Laptop, Building2 } from 'lucide-react';

const categories = [
    { name: 'Restaurant', icon: Utensils },
    { name: 'Salon', icon: Scissors },
    { name: 'Fashion Store', icon: ShoppingBag },
    { name: 'Gym', icon: Dumbbell },
    { name: 'Hotel', icon: Hotel },
    { name: 'Supermarket', icon: Store },
    { name: 'Electronics Store', icon: Laptop },
    { name: 'Small Business', icon: Building2 },
];

export default function TrustSection() {
    return (
        <section className="py-20 bg-gray-50/50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary opacity-50 mb-4">
                        Trusted By Growing Businesses
                    </h2>
                </div>

                <div className="relative group overflow-hidden">
                    <div className="flex w-max animate-marquee-scroll">
                        {[0, 1].map((copy) => (
                            <div key={copy} className="flex items-center justify-center gap-6 md:gap-8 pr-6 md:pr-8">
                                {categories.map((category, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col items-center gap-4 group/item min-w-[5.5rem] sm:min-w-[7rem]"
                                    >
                                        <div className="size-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-text-secondary group-hover/item:text-primary group-hover/item:border-primary/20 transition-all duration-300">
                                            <category.icon size={24} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary text-center group-hover/item:text-text-main transition-colors whitespace-nowrap">
                                            {category.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}