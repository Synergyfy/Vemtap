export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'split';
export type PosSaleStatus = 'completed' | 'refunded' | 'partial_refund';
export type RegisterSessionStatus = 'open' | 'closed';

export interface PosSaleItemResponse {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discount: number;
  totalPrice: number;
}

export interface PosSplitPaymentResponse {
  id: string;
  method: PaymentMethod;
  amount: number;
}

export interface CustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface PosSaleResponse {
  id: string;
  receiptNumber: string;
  businessId: string;
  branchId: string;
  cashierId: string;
  cashierName: string;
  customerId: string | null;
  customer?: CustomerSummary | null;
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  hideCustomerInfoOnReceipt: boolean;
  notes: string | null;
  status: PosSaleStatus;
  items: PosSaleItemResponse[];
  splitPayments: PosSplitPaymentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PosHeldSaleItemResponse {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discount: number;
  totalPrice: number;
}

export interface PosHeldSaleResponse {
  id: string;
  businessId: string;
  branchId: string;
  cashierId: string;
  customerId: string | null;
  customer?: CustomerSummary | null;
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  note: string | null;
  heldAt: string;
  items: PosHeldSaleItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterSessionResponse {
  id: string;
  businessId: string;
  branchId: string;
  cashierId: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  expectedCash: number;
  totalSales: number;
  transactionCount: number;
  status: RegisterSessionStatus;
}

export interface RegisterStatusResponse {
  isOpen: boolean;
  session: RegisterSessionResponse | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardResponse {
  revenue: number;
  transactionCount: number;
  averageSaleValue: number;
  paymentBreakdown: Record<string, number>;
}

export interface TopProductResponse {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface CreatePosSaleItemDto {
  productId: string;
  quantity: number;
  discount?: number;
}

export interface SplitPaymentDto {
  method: PaymentMethod;
  amount: number;
}

export interface PaymentDetailsDto {
  method: PaymentMethod;
  amountPaid: number;
  change?: number;
  splitDetails?: SplitPaymentDto[];
}

export interface CreatePosSaleDto {
  items: CreatePosSaleItemDto[];
  payment: PaymentDetailsDto;
  branchId: string;
  customerId?: string;
  cartDiscountAmount?: number;
  hideCustomerInfoOnReceipt?: boolean;
  notes?: string;
  clientRef?: string;
  orderedAt?: string;
}

export interface HoldSaleItemDto {
  productId: string;
  productName: string;
  sku?: string;
  barcode?: string;
  unitPrice: number;
  costPrice?: number;
  quantity: number;
  discount?: number;
  totalPrice: number;
}

export interface HoldPosSaleDto {
  items: HoldSaleItemDto[];
  branchId: string;
  customerId?: string;
  note?: string;
  subtotal?: number;
  discountAmount?: number;
  tax?: number;
  total?: number;
}

export interface OpenRegisterDto {
  openingCash: number;
}

export interface PosSalesQuery {
  page?: number;
  limit?: number;
  status?: PosSaleStatus;
  paymentMethod?: PaymentMethod;
  branchId?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface RegisterHistoryQuery {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface BatchSyncResult {
  clientRef: string | null;
  success: boolean;
  saleId?: string;
  error?: string;
}

export type BatchSyncRequest = CreatePosSaleDto[];

export interface RefundItemDto {
  saleItemId: string;
  quantity: number;
}

export interface UpdatePosSaleStatusDto {
  status: PosSaleStatus;
  reason?: string;
  refundItems?: RefundItemDto[];
}
