import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryCountingApi } from '@/lib/api/inventory-counting';
import type {
  StockCountSession,
  StockCountItem,
  ReconciliationReport,
  PaginatedResponse,
  CreateCountSessionDto,
  AddCountItemsDto,
  UpdateCountItemDto,
  CompleteCountDto,
  ApproveVarianceDto,
  RejectVarianceDto,
  CountSessionQueryDto,
} from './types';

export const countingKeys = {
  all: ['stock-counting'] as const,
  sessions: {
    all: ['stock-counting', 'sessions'] as const,
    list: (params?: CountSessionQueryDto) =>
      ['stock-counting', 'sessions', 'list', params] as const,
    detail: (id: string) => ['stock-counting', 'sessions', 'detail', id] as const,
    reconciliation: (id: string) =>
      ['stock-counting', 'sessions', 'reconciliation', id] as const,
  },
};

export const useCountSessions = (params?: CountSessionQueryDto) =>
  useQuery<PaginatedResponse<StockCountSession>>({
    queryKey: countingKeys.sessions.list(params),
    queryFn: () => inventoryCountingApi.listSessions(params),
  });

export const useCountSession = (id: string) =>
  useQuery<StockCountSession>({
    queryKey: countingKeys.sessions.detail(id),
    queryFn: () => inventoryCountingApi.getSession(id),
    enabled: !!id,
  });

export const useCreateCountSession = () => {
  const queryClient = useQueryClient();
  return useMutation<StockCountSession, Error, CreateCountSessionDto>({
    mutationFn: (dto) => inventoryCountingApi.createSession(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countingKeys.sessions.all });
    },
  });
};

export const useStartCountSession = () => {
  const queryClient = useQueryClient();
  return useMutation<StockCountSession, Error, string>({
    mutationFn: (id) => inventoryCountingApi.startSession(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: countingKeys.sessions.all });
      queryClient.invalidateQueries({
        queryKey: countingKeys.sessions.detail(data.id),
      });
    },
  });
};

export const useAddCountItems = () => {
  const queryClient = useQueryClient();
  return useMutation<
    StockCountItem[],
    Error,
    { sessionId: string; dto: AddCountItemsDto }
  >({
    mutationFn: ({ sessionId, dto }) =>
      inventoryCountingApi.addItems(sessionId, dto),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: countingKeys.sessions.detail(sessionId),
      });
    },
  });
};

export const useUpdateCountItem = () => {
  const queryClient = useQueryClient();
  return useMutation<
    StockCountItem,
    Error,
    { sessionId: string; itemId: string; dto: UpdateCountItemDto }
  >({
    mutationFn: ({ sessionId, itemId, dto }) =>
      inventoryCountingApi.updateItem(sessionId, itemId, dto),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: countingKeys.sessions.detail(sessionId),
      });
    },
  });
};

export const useCompleteCountSession = () => {
  const queryClient = useQueryClient();
  return useMutation<
    StockCountSession,
    Error,
    { sessionId: string; dto: CompleteCountDto }
  >({
    mutationFn: ({ sessionId, dto }) =>
      inventoryCountingApi.completeSession(sessionId, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: countingKeys.sessions.all });
      queryClient.invalidateQueries({
        queryKey: countingKeys.sessions.detail(data.id),
      });
    },
  });
};

export const useGetReconciliation = (id: string) =>
  useQuery<ReconciliationReport>({
    queryKey: countingKeys.sessions.reconciliation(id),
    queryFn: () => inventoryCountingApi.getReconciliation(id),
    enabled: !!id,
  });

export const useApproveSession = () => {
  const queryClient = useQueryClient();
  return useMutation<
    StockCountSession,
    Error,
    { sessionId: string; dto: ApproveVarianceDto }
  >({
    mutationFn: ({ sessionId, dto }) =>
      inventoryCountingApi.approveSession(sessionId, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: countingKeys.sessions.all });
      queryClient.invalidateQueries({
        queryKey: countingKeys.sessions.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: countingKeys.sessions.reconciliation(data.id),
      });
      queryClient.invalidateQueries({ queryKey: ['catalogue'] });
    },
  });
};

export const useRejectSession = () => {
  const queryClient = useQueryClient();
  return useMutation<
    StockCountSession,
    Error,
    { sessionId: string; dto: RejectVarianceDto }
  >({
    mutationFn: ({ sessionId, dto }) =>
      inventoryCountingApi.rejectSession(sessionId, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: countingKeys.sessions.all });
      queryClient.invalidateQueries({
        queryKey: countingKeys.sessions.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: countingKeys.sessions.reconciliation(data.id),
      });
    },
  });
};
