import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  category: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const colors: Record<string, string> = {
    Restaurant: 'bg-rose-500',
    "Eye Clinic": 'bg-indigo-500',
    Pharmacy: 'bg-green-500',
    Salon: 'bg-pink-500',
    "Fashion Store": 'bg-purple-500',
    Hotel: 'bg-teal-500',
  };
  const bg = colors[category] ?? 'bg-gray-500';
  return (
    <Badge className={`${bg} text-white`}>Business Type: {category}</Badge>
  );
};
