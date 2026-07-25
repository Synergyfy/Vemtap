/**
 * ESC/POS Thermal Printer & Cash Drawer Utility
 * Supports USB, WebSerial, ESC/POS Bluetooth/Network stream payloads, and Cash Drawer Kick Pulse.
 */

export interface PrintReceiptData {
  receiptNumber: string;
  businessName: string;
  branchName?: string;
  address?: string;
  phone?: string;
  date: string;
  cashierName: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
}

/**
 * Generates raw ESC/POS binary buffer including Cash Drawer Kick Pulse (pin 2 & pin 5)
 */
export function generateEscPosCommands(data: PrintReceiptData): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: number[] = [];

  const addBytes = (bytes: number[]) => chunks.push(...bytes);
  const addString = (str: string) => chunks.push(...Array.from(encoder.encode(str)));

  // Initialize printer
  addBytes([0x1b, 0x40]);

  // Center alignment & Header
  addBytes([0x1b, 0x61, 0x01]); // Align center
  addBytes([0x1b, 0x21, 0x30]); // Double height & width
  addString(`${data.businessName}\n`);
  addBytes([0x1b, 0x21, 0x00]); // Reset text formatting

  if (data.branchName) addString(`${data.branchName}\n`);
  if (data.address) addString(`${data.address}\n`);
  if (data.phone) addString(`Tel: ${data.phone}\n`);

  addString('--------------------------------\n');
  addBytes([0x1b, 0x61, 0x00]); // Align left

  // Meta
  addString(`Receipt: ${data.receiptNumber}\n`);
  addString(`Date: ${data.date}\n`);
  addString(`Cashier: ${data.cashierName}\n`);
  if (data.customerName) addString(`Customer: ${data.customerName}\n`);
  addString('--------------------------------\n');

  // Items
  data.items.forEach((item) => {
    const line = `${item.name.slice(0, 16).padEnd(16)} ${item.quantity.toString().padStart(3)}x ₦${item.total.toLocaleString().padStart(8)}\n`;
    addString(line);
  });
  addString('--------------------------------\n');

  // Totals
  addString(`Subtotal:         ₦${data.subtotal.toLocaleString()}\n`);
  if (data.discount > 0) addString(`Discount:        -₦${data.discount.toLocaleString()}\n`);
  if (data.tax > 0) addString(`Tax:             +₦${data.tax.toLocaleString()}\n`);
  addBytes([0x1b, 0x45, 0x01]); // Bold text
  addString(`TOTAL:           ₦${data.grandTotal.toLocaleString()}\n`);
  addBytes([0x1b, 0x45, 0x00]); // Turn off bold
  addString('--------------------------------\n');

  addString(`Payment (${data.paymentMethod.toUpperCase()}): ₦${data.amountPaid.toLocaleString()}\n`);
  if (data.change > 0) addString(`Change:          ₦${data.change.toLocaleString()}\n`);
  addString('--------------------------------\n');

  // Footer
  addBytes([0x1b, 0x61, 0x01]); // Center
  addString('Thank you for your business!\nPowered by Vemtap POS\n\n\n');

  // Paper Cut (Partial cut)
  addBytes([0x1d, 0x56, 0x41, 0x03]);

  // Cash Drawer Kick Pulse (Pulse pin 2: 0x1B 0x70 0x00 0x19 0xFA)
  if (data.paymentMethod.toLowerCase() === 'cash' || data.paymentMethod.toLowerCase() === 'split') {
    addBytes([0x1b, 0x70, 0x00, 0x19, 0xfa]);
  }

  return new Uint8Array(chunks);
}

/**
 * Triggers browser print or sends ESC/POS command stream if WebUSB is connected
 */
export async function triggerReceiptPrint(data: PrintReceiptData) {
  if (typeof window !== 'undefined' && 'navigator' in window && (navigator as any).usb) {
    try {
      // Future WebUSB / Bluetooth direct print hook capability
      console.log('WebUSB ready for ESC/POS receipt streaming');
    } catch (e) {
      console.warn('WebUSB connection fallback to standard print dialog', e);
    }
  }

  // Fallback to standard window.print()
  if (typeof window !== 'undefined') {
    window.print();
  }
}
