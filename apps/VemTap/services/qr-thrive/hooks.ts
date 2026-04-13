import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useQrThrivePlans = () => {
  return useQuery({
    queryKey: ['qr-thrive-plans'],
    queryFn: async () => {
      const { data } = await api.get('/qr-thrive/plans');
      return data;
    },
  });
};
