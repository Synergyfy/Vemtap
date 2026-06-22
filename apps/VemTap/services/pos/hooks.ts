import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/lib/api/pos';
import type {
  PosSaleResponse,
  PosHeldSaleResponse,
  RegisterStatusResponse,
  RegisterSessionResponse,
  DashboardResponse,
  TopProductResponse,
  PaginatedResponse,
  CreatePosSaleDto,
  PosSaleStatus,
  HoldPosSaleDto,
  OpenRegisterDto,
  PosSalesQuery,
  RegisterHistoryQuery,
} from './types';

export const posKeys = {
  sales: {
    all: ['pos-sales'] as const,
    list: (params?: PosSalesQuery) => ['pos-sales', 'list', params] as const,
    detail: (id: string) => ['pos-sales', 'detail', id] as const,
  },
  heldSales: {
    all: ['pos-held-sales'] as const,
    list: (branchId?: string) => ['pos-held-sales', 'list', branchId] as const,
    detail: (id: string) => ['pos-held-sales', 'detail', id] as const,
  },
  register: {
    status: ['pos-register-status'] as const,
    history: (query?: RegisterHistoryQuery) => ['pos-register-history', query] as const,
  },
  dashboard: {
    main: (branchId?: string) => ['pos-dashboard', branchId] as const,
    topProducts: (branchId?: string) => ['pos-top-products', branchId] as const,
  },
};

export const usePosSales = (params?: PosSalesQuery) =>
  useQuery<PaginatedResponse<PosSaleResponse>>({
    queryKey: posKeys.sales.list(params),
    queryFn: () => posApi.getSales(params),
  });

export const usePosSale = (id: string) =>
  useQuery<PosSaleResponse>({
    queryKey: posKeys.sales.detail(id),
    queryFn: () => posApi.getSale(id),
    enabled: !!id,
  });

export const useCreatePosSale = () => {
  const queryClient = useQueryClient();
  return useMutation<PosSaleResponse, Error, CreatePosSaleDto>({
    mutationFn: (dto) => posApi.createSale(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: posKeys.dashboard.main() });
    },
  });
};

export const useUpdatePosSaleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<PosSaleResponse, Error, { id: string; status: PosSaleStatus }>({
    mutationFn: ({ id, status }) => posApi.updateSaleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.sales.all });
    },
  });
};

export const useHoldPosSale = () => {
  const queryClient = useQueryClient();
  return useMutation<PosHeldSaleResponse, Error, HoldPosSaleDto>({
    mutationFn: (dto) => posApi.holdSale(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.heldSales.all });
    },
  });
};

export const useHeldPosSales = (branchId?: string) =>
  useQuery<PosHeldSaleResponse[]>({
    queryKey: posKeys.heldSales.list(branchId),
    queryFn: () => posApi.getHeldSales(branchId),
  });

export const useHeldPosSale = (id: string) =>
  useQuery<PosHeldSaleResponse>({
    queryKey: posKeys.heldSales.detail(id),
    queryFn: () => posApi.getHeldSale(id),
    enabled: !!id,
  });

export const useDeleteHeldPosSale = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => posApi.deleteHeldSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.heldSales.all });
    },
  });
};

export const useOpenRegister = () => {
  const queryClient = useQueryClient();
  return useMutation<RegisterSessionResponse, Error, OpenRegisterDto>({
    mutationFn: (dto) => posApi.openRegister(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.register.status });
      queryClient.invalidateQueries({ queryKey: posKeys.dashboard.main() });
    },
  });
};

export const useCloseRegister = () => {
  const queryClient = useQueryClient();
  return useMutation<RegisterSessionResponse, Error, void>({
    mutationFn: () => posApi.closeRegister(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.register.status });
      queryClient.invalidateQueries({ queryKey: posKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: posKeys.dashboard.main() });
    },
  });
};

export const useRegisterStatus = () =>
  useQuery<RegisterStatusResponse>({
    queryKey: posKeys.register.status,
    queryFn: () => posApi.getRegisterStatus(),
    refetchInterval: 30000,
  });

export const useRegisterHistory = (query?: RegisterHistoryQuery) =>
  useQuery<PaginatedResponse<RegisterSessionResponse>>({
    queryKey: posKeys.register.history(query),
    queryFn: () => posApi.getRegisterHistory(query),
  });

export const usePosDashboard = (branchId?: string) =>
  useQuery<DashboardResponse>({
    queryKey: posKeys.dashboard.main(branchId),
    queryFn: () => posApi.getDashboard(branchId),
  });

export const usePosTopProducts = (branchId?: string) =>
  useQuery<TopProductResponse[]>({
    queryKey: posKeys.dashboard.topProducts(branchId),
    queryFn: () => posApi.getTopProducts(branchId),
  });

export const useAdjustPosStock = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; quantity: number }>({
    mutationFn: ({ id, quantity }) => posApi.adjustStock(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogue'] });
    },
  });
};
