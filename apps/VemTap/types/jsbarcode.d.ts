declare module 'jsbarcode' {
  interface JsBarcodeOptions {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
    text?: string;
    textPosition?: string;
    textAlign?: string;
    textMargin?: number;
    font?: string;
    fontOptions?: string;
    flat?: boolean;
    valid?: (valid: boolean) => void;
  }

  function JsBarcode(
    target: SVGElement | HTMLCanvasElement | HTMLImageElement | string,
    value: string,
    options?: JsBarcodeOptions
  ): void;

  export default JsBarcode;
}
