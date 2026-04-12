import { useRef } from 'react';

export function useQRCode(options: any) {
  const ref = useRef<HTMLDivElement>(null);
  return { ref };
}