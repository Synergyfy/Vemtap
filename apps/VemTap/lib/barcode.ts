import JsBarcode from 'jsbarcode';

let sequenceCounter = 0;

export function generateBarcodeValue(productId: string, name?: string): string {
  const prefix = 'VT';
  const hash = productId.replace(/-/g, '').slice(-6).toUpperCase().padStart(6, '0');
  sequenceCounter++;
  const seq = sequenceCounter.toString().padStart(4, '0');
  return `${prefix}${hash}${seq}`;
}

export function renderBarcodeDataUrl(value: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, value, {
        format: 'CODE128',
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: '#ffffff',
      });
      resolve(canvas.toDataURL('image/png'));
    } catch (err) {
      reject(err);
    }
  });
}

export function renderBarcodeSvg(value: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, value, {
    format: 'CODE128',
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 14,
    margin: 5,
  });
  return svg.outerHTML;
}

export function renderBarcodeCanvas(value: string, canvas: HTMLCanvasElement): void {
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 14,
    margin: 5,
  });
}

export function isValidBarcode(value: string): boolean {
  return /^[A-Za-z0-9\-]+$/.test(value) && value.length >= 4 && value.length <= 30;
}
