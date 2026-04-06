import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PortalVisitResponse {
  visitId: string;
  sessionToken: string;
  isNewVisit: boolean;
}

/**
 * Fires a portal visit recording request when the customer reaches the portal menu.
 *
 * The returned `sessionToken` should be stored in the Zustand `useCustomerFlowStore`
 * and forwarded in the checkout payload so the backend can upgrade the visit to
 * 'patronage' on order completion.
 */
export const useRecordPortalVisit = () => {
  return useMutation<
    PortalVisitResponse,
    Error,
    { deviceCode: string; sessionToken?: string }
  >({
    mutationFn: (data) =>
      api.post('/visitors/portal-visit', data),
  });
};
