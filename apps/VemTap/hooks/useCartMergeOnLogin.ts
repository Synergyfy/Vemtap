import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useGuestCartStore } from '../store/useGuestCartStore';
import { useMergeGuestCart } from '../services/catalogue-cart/hooks';

export const useCartMergeOnLogin = (branchId: string | null) => {
  const { isAuthenticated } = useAuthStore();
  const { getItemsForBranch, clearBranchCart } = useGuestCartStore();
  const mergeMutation = useMergeGuestCart();

  useEffect(() => {
    if (isAuthenticated && branchId) {
      const items = getItemsForBranch(branchId);

      if (items.length > 0) {
        const payload = items.map(item => ({
          itemId: item.itemId,
          offerId: item.offerId,
          quantity: item.quantity,
        }));

        mergeMutation.mutate(
          { branchId, items: payload },
          {
            onSuccess: () => {
              clearBranchCart(branchId);
            },
            onError: (err) => {
              console.error('Failed to merge guest cart:', err);
            }
          }
        );
      }
    }
  }, [isAuthenticated, branchId]);
};
