export type CountSessionStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected';

export interface StockCountItem {
  id: string;
  sessionId: string;
  itemId: string;
  itemName: string;
  itemSku: string | null;
  itemCategory: string | null;
  itemBarcode: string | null;
  systemQuantity: number | null;
  countedQuantity: number | null;
  variance: number | null;
  varianceValue: number | null;
  unitCost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockCountSession {
  id: string;
  businessId: string;
  branchId: string;
  branch?: { id: string; name: string };
  startedById: string;
  startedBy?: { id: string; firstName: string; lastName: string };
  completedById: string | null;
  completedBy?: { id: string; firstName: string; lastName: string } | null;
  approvedById: string | null;
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  status: CountSessionStatus;
  isBlind: boolean;
  zone: string | null;
  notes: string | null;
  rejectionReason: string | null;
  totalItems: number;
  countedItems: number;
  itemsWithVariance: number;
  totalVarianceValue: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: StockCountItem[];
}

export interface ReconciliationReport {
  session: StockCountSession;
  summary: {
    totalItems: number;
    countedItems: number;
    itemsWithVariance: number;
    totalVarianceValue: number;
    overCountItems: number;
    underCountItems: number;
    overCountValue: number;
    underCountValue: number;
  };
  itemsWithVariance: StockCountItem[];
  overCount: StockCountItem[];
  underCount: StockCountItem[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCountSessionDto {
  branchId: string;
  isBlind?: boolean;
  zone?: string;
  notes?: string;
  itemIds?: string[];
}

export interface CountItemEntryDto {
  itemId: string;
  itemName: string;
  itemSku?: string;
  itemCategory?: string;
  itemBarcode?: string;
  systemQuantity: number;
  countedQuantity?: number;
  unitCost?: number;
  notes?: string;
}

export interface AddCountItemsDto {
  items: CountItemEntryDto[];
}

export interface UpdateCountItemDto {
  countedQuantity: number;
  notes?: string;
}

export interface CompleteCountDto {
  notes?: string;
}

export interface ApproveVarianceDto {
  notes?: string;
}

export interface RejectVarianceDto {
  reason: string;
}

export interface CountSessionQueryDto {
  status?: CountSessionStatus;
  branchId?: string;
  page?: number;
  limit?: number;
}
