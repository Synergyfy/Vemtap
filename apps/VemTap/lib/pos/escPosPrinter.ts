/**
 * ESC/POS Thermal Printer & Cash Drawer Utility
 * Supports USB (WebSerial/WebUSB) thermal printers and falls back to the
 * standard browser print dialog when no thermal printer is connected.
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

// ---------------------------------------------------------------------------
// Thermal printer connection (WebSerial first, then WebUSB)
// ---------------------------------------------------------------------------

interface SerialWriter {
  write(data: Uint8Array): Promise<void>;
  releaseLock(): void;
}

interface SerialPortHandle {
  writable: { getWriter(): SerialWriter };
  open(options: Record<string, unknown>): Promise<void>;
  close(): Promise<void>;
}

interface UsbEndpoint {
  direction: string;
  type: string;
  endpointNumber: number;
}

interface UsbInterface {
  alternate?: { endpoints?: UsbEndpoint[] };
}

interface UsbDeviceHandle {
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(value: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, bytes: Uint8Array): Promise<void>;
  configuration?: { interfaces?: UsbInterface[] };
}

interface NavigatorPrinterApis {
  serial?: { requestPort(): Promise<SerialPortHandle> };
  usb?: { requestDevice(options: { filters: { vendorId?: number }[] }): Promise<UsbDeviceHandle> };
}

let activePort: SerialPortHandle | null = null;
let activeUsbDevice: UsbDeviceHandle | null = null;

export function isThermalPrinterConnected(): boolean {
  return !!activePort || !!activeUsbDevice;
}

/**
 * Opens a connection to a USB thermal printer.
 * - Uses the Web Serial API (most USB thermal printers expose a CDC serial port).
 * - Falls back to WebUSB (bulk OUT endpoint) when serial is unavailable.
 * Returns 'serial', 'usb', or null if the user cancelled / browser unsupported.
 */
export async function connectThermalPrinter(): Promise<'serial' | 'usb' | null> {
  const nav = navigator as unknown as NavigatorPrinterApis;

  if (nav.serial?.requestPort) {
    try {
      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 9600 });
      activePort = port;
      return 'serial';
    } catch {
      // User cancelled or the port failed to open — try WebUSB as a fallback.
      activePort = null;
    }
  }

  if (nav.usb?.requestDevice) {
    try {
      const device = await nav.usb.requestDevice({ filters: [] });
      await device.open();
      try {
        await device.selectConfiguration(1);
      } catch { /* some devices keep configuration 1 by default */ }
      await device.claimInterface(0);
      activeUsbDevice = device;
      return 'usb';
    } catch {
      activeUsbDevice = null;
    }
  }

  return null;
}

export async function disconnectThermalPrinter(): Promise<void> {
  if (activePort) {
    try {
      await activePort.close();
    } catch { /* ignore */ }
    activePort = null;
  }
  if (activeUsbDevice) {
    try {
      await activeUsbDevice.close();
    } catch { /* ignore */ }
    activeUsbDevice = null;
  }
}

async function writeEscPos(bytes: Uint8Array): Promise<boolean> {
  if (activePort) {
    const writer = activePort.writable.getWriter();
    try {
      await writer.write(bytes);
    } finally {
      writer.releaseLock();
    }
    return true;
  }

  if (activeUsbDevice) {
    let endpointNumber = 1;
    try {
      const iface = activeUsbDevice.configuration?.interfaces?.[0];
      const endpoint = iface?.alternate?.endpoints?.find(
        (e) => e.direction === 'out' && e.type === 'bulk',
      );
      if (endpoint) endpointNumber = endpoint.endpointNumber;
    } catch { /* keep default endpoint 1 */ }
    await activeUsbDevice.transferOut(endpointNumber, bytes);
    return true;
  }

  return false;
}

/**
 * Prints a receipt to the connected thermal printer, or falls back to the
 * standard browser print dialog when no thermal printer is connected.
 */
export async function triggerReceiptPrint(data: PrintReceiptData): Promise<void> {
  if (typeof window === 'undefined') return;

  const bytes = generateEscPosCommands(data);
  try {
    const sent = await writeEscPos(bytes);
    if (sent) return;
  } catch (e) {
    console.warn('ESC/POS write failed, falling back to print dialog', e);
  }

  window.print();
}
