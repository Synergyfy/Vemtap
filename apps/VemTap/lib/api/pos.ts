import { api } from '@/lib/api';
import type {
  CreatePosSaleDto,
  HoldPosSaleDto,
  OpenRegisterDto,
  PosSaleStatus,
  PosSalesQuery,
  RegisterHistoryQuery,
} from '@/services/pos/types';

export const posApi = {
  getSales: (params?: PosSalesQuery) =>
    api.get('/pos/sales', { params }),

  getSale: (id: string) =>
    api.get(`/pos/sales/${id}`),

  createSale: (dto: CreatePosSaleDto) =>
    api.post('/pos/sales', dto),

  updateSaleStatus: (id: string, status: PosSaleStatus) =>
    api.patch(`/pos/sales/${id}/status`, { status }),

  holdSale: (dto: HoldPosSaleDto) =>
    api.post('/pos/sales/hold', dto),

  getHeldSales: (branchId?: string) =>
    api.get('/pos/sales/held', { params: { branchId } }),

  getHeldSale: (id: string) =>
    api.get(`/pos/sales/held/${id}`),

  deleteHeldSale: (id: string) =>
    api.delete(`/pos/sales/held/${id}`),

  openRegister: (dto: OpenRegisterDto) =>
    api.post('/pos/register/open', dto),

  closeRegister: () =>
    api.post('/pos/register/close', {}),

  getRegisterStatus: () =>
    api.get('/pos/register/status'),

  getRegisterHistory: (query?: RegisterHistoryQuery) =>
    api.get('/pos/register/history', { params: query }),

  getDashboard: (branchId?: string) =>
    api.get('/pos/dashboard', { params: { branchId } }),

  getTopProducts: (branchId?: string) =>
    api.get('/pos/dashboard/top-products', { params: { branchId } }),

  adjustStock: (id: string, quantity: number) =>
    api.patch(`/pos/products/${id}/stock`, { quantity }),
};
