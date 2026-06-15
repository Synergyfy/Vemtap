import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  onGenerate: (id: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ id, name, description, previewUrl, onGenerate }) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <Image src={previewUrl} alt={name} width={400} height={300} className="object-cover w-full h-48" />
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        <Button className="mt-auto" onClick={() => onGenerate(id)}>
          Generate Asset
        </Button>
      </div>
    </div>
  );
};
