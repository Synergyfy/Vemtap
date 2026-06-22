import { api } from '@/lib/api';
import type {
  CreateCountSessionDto,
  AddCountItemsDto,
  UpdateCountItemDto,
  CompleteCountDto,
  ApproveVarianceDto,
  RejectVarianceDto,
  CountSessionQueryDto,
} from '@/services/inventory-counting/types';

export const inventoryCountingApi = {
  createSession: (dto: CreateCountSessionDto) =>
    api.post('/inventory/counting/sessions', dto),

  listSessions: (params?: CountSessionQueryDto) =>
    api.get('/inventory/counting/sessions', { params }),

  getSession: (id: string) =>
    api.get(`/inventory/counting/sessions/${id}`),

  startSession: (id: string) =>
    api.post(`/inventory/counting/sessions/${id}/start`, {}),

  addItems: (id: string, dto: AddCountItemsDto) =>
    api.post(`/inventory/counting/sessions/${id}/items`, dto),

  updateItem: (sessionId: string, itemId: string, dto: UpdateCountItemDto) =>
    api.patch(`/inventory/counting/sessions/${sessionId}/items/${itemId}`, dto),

  completeSession: (id: string, dto: CompleteCountDto) =>
    api.post(`/inventory/counting/sessions/${id}/complete`, dto),

  getReconciliation: (id: string) =>
    api.get(`/inventory/counting/sessions/${id}/reconciliation`),

  approveSession: (id: string, dto: ApproveVarianceDto) =>
    api.post(`/inventory/counting/sessions/${id}/approve`, dto),

  rejectSession: (id: string, dto: RejectVarianceDto) =>
    api.post(`/inventory/counting/sessions/${id}/reject`, dto),
};
