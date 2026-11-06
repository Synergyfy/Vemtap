'use client';

import React from 'react';
import { HOME_CATEGORIES } from './mock';
import CategoryCard from './cards/CategoryCard';
import HorizontalRail from './rails/HorizontalRail';

export default function CategoriesRail() {
  return (
    <section className="py-8 sm:py-10">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1">
            Explore Categories
          </h2>
          <p className="text-sm text-gray-500">Jump into what you&apos;re looking for</p>
        </div>
        <HorizontalRail>
          {HOME_CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </HorizontalRail>
      </div>
    </section>
  );
}
