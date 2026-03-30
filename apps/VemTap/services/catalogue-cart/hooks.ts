import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { useAuthStore } from '../../store/useAuthStore';
import { CatalogueItem } from '../catalogue/types';
import { CatalogueOffer } from '../offers/types';

export interface CartItem {
  id: string;
  cartId: string;
  itemId?: string;
  item?: CatalogueItem;
  offerId?: string;
  offer?: CatalogueOffer;
  quantity: number;
  snapshotPrice: number;
  snapshotName: string;
  snapshotImage?: string;
}

export interface Cart {
  id: string;
  customerId: string;
  branchId: string;
  businessId: string;
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface CartSummary {
  itemCount: number;
  total: number;
}

export const useCart = (branchId: string | null) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery<Cart>({
    queryKey: ['cart', branchId],
    queryFn: async () => {
      const response = await api.get('/catalogue/cart', {
        params: { branchId },
      });
      return response.data;
    },
    enabled: !!branchId && isAuthenticated,
  });
};

export const useCartSummary = (branchId: string | null) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery<CartSummary>({
    queryKey: ['cart', 'summary', branchId],
    queryFn: async () => {
      const response = await api.get('/catalogue/cart/summary', {
        params: { branchId },
      });
      return response.data;
    },
    enabled: !!branchId && isAuthenticated,
    staleTime: 30_000,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { branchId: string; itemId?: string; offerId?: string; quantity?: number }) => {
      const response = await api.post('/catalogue/cart/items', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.branchId] });
      queryClient.invalidateQueries({ queryKey: ['cart', 'summary', variables.branchId] });
    },
  });
};

export const useUpdateCartItem = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { cartItemId: string; quantity: number }) => {
      const response = await api.patch(`/catalogue/cart/items/${data.cartItemId}`, {
        quantity: data.quantity,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', branchId] });
      queryClient.invalidateQueries({ queryKey: ['cart', 'summary', branchId] });
    },
  });
};

export const useRemoveCartItem = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cartItemId: string) => {
      const response = await api.delete(`/catalogue/cart/items/${cartItemId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', branchId] });
      queryClient.invalidateQueries({ queryKey: ['cart', 'summary', branchId] });
    },
  });
};

export const useClearCart = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.delete('/catalogue/cart', {
        params: { branchId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', branchId] });
      queryClient.invalidateQueries({ queryKey: ['cart', 'summary', branchId] });
    },
  });
};

export const useMergeGuestCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { branchId: string; items: { itemId?: string; offerId?: string; quantity: number }[] }) => {
      const response = await api.post('/catalogue/cart/merge', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.branchId] });
      queryClient.invalidateQueries({ queryKey: ['cart', 'summary', variables.branchId] });
    },
  });
};

export const useCheckoutCart = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { branchId: string; notes?: string; tableNumber?: string; deviceId?: string }) => {
      const response = await api.post('/catalogue/cart/checkout', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', branchId] });
      queryClient.invalidateQueries({ queryKey: ['cart', 'summary', branchId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
