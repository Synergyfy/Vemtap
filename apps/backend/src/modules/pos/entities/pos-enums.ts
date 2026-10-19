export enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  CARD = 'card',
  SPLIT = 'split',
}

export enum SaleStatus {
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
}

export enum RegisterSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum PosTillStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  OFFLINE = 'offline',
  DISABLED = 'disabled',
}

export enum PosPeripheralType {
  CARD_TERMINAL = 'card_terminal',
  PRINTER = 'printer',
  CASH_DRAWER = 'cash_drawer',
  SCANNER = 'scanner',
  KDS = 'kds',
  CUSTOMER_DISPLAY = 'customer_display',
}

export enum PosPeripheralConnection {
  IP = 'ip',
  BLUETOOTH = 'bluetooth',
  USB = 'usb',
}

export enum PosPeripheralStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/** Actions a supervisor PIN can authorise. */
export enum PosOverrideAction {
  VOID = 'void',
  REFUND = 'refund',
  REPRINT = 'reprint',
  DRAWER_OPEN = 'drawer_open',
  DISCOUNT = 'discount',
}
